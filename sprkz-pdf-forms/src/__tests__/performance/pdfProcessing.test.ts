import { PDFService } from '../../services/pdfService';
import { ValidationService } from '../../services/validationService';
import { UnleashService } from '../../services/unleashService';
import { generateMockPDFDocument, generateMockFormField, measurePerformance, expectPerformance } from '../utils/testUtils';

// Mock PDF.js for performance tests
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '/pdf.worker.min.mjs',
  },
}));

// Mock Unleash for performance tests
jest.mock('@unleash/proxy-client-react', () => ({
  UnleashClient: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    on: jest.fn((event, callback) => {
      if (event === 'ready') callback();
    }),
    isEnabled: jest.fn().mockReturnValue(true),
    getVariant: jest.fn().mockReturnValue(null),
    updateContext: jest.fn(),
  })),
}));

describe('PDF Processing Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear caches
    PDFService.clearCache();
    
    // Mock console to avoid noise in performance tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('PDF Loading Performance', () => {
    it('should load PDF documents within performance targets', async () => {
      const mockDoc = generateMockPDFDocument(10);
      
      const { getDocument } = require('pdfjs-dist');
      getDocument.mockReturnValue({
        promise: Promise.resolve(mockDoc),
      });

      const { result, duration } = await measurePerformance(async () => {
        return await PDFService.loadDocument({
          url: 'https://example.com/test.pdf',
        });
      });

      expect(result).toBe(mockDoc);
      expectPerformance(duration, 1000); // Should load within 1 second
    });

    it('should handle large PDF documents efficiently', async () => {
      const largeMockDoc = generateMockPDFDocument(100); // 100 pages
      
      const { getDocument } = require('pdfjs-dist');
      getDocument.mockReturnValue({
        promise: Promise.resolve(largeMockDoc),
      });

      const { result, duration } = await measurePerformance(async () => {
        return await PDFService.loadDocument({
          url: 'https://example.com/large.pdf',
        });
      });

      expect(result).toBe(largeMockDoc);
      expectPerformance(duration, 3000); // Large documents can take up to 3 seconds
    });

    it('should benefit from caching on repeated loads', async () => {
      const mockDoc = generateMockPDFDocument(5);
      
      const { getDocument } = require('pdfjs-dist');
      getDocument.mockReturnValue({
        promise: Promise.resolve(mockDoc),
      });

      const url = 'https://example.com/cached.pdf';

      // First load (cold)
      const { duration: firstLoad } = await measurePerformance(async () => {
        return await PDFService.loadDocument({ url });
      });

      // Second load (cached)
      const { duration: secondLoad } = await measurePerformance(async () => {
        return await PDFService.loadDocument({ url });
      });

      expect(secondLoad).toBeLessThan(firstLoad);
      expectPerformance(secondLoad, 10); // Cached loads should be very fast
    });

    it('should handle concurrent PDF loads efficiently', async () => {
      const mockDocs = Array.from({ length: 5 }, (_, i) => generateMockPDFDocument(3));
      
      const { getDocument } = require('pdfjs-dist');
      getDocument.mockImplementation((options) => ({
        promise: Promise.resolve(mockDocs[parseInt(options.url.slice(-5, -4)) || 0]),
      }));

      const { result, duration } = await measurePerformance(async () => {
        const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/doc${i}.pdf`);
        return await Promise.all(
          urls.map(url => PDFService.loadDocument({ url }))
        );
      });

      expect(result).toHaveLength(5);
      expectPerformance(duration, 2000); // Concurrent loads should complete within 2 seconds
    });
  });

  describe('Form Field Extraction Performance', () => {
    it('should extract form fields from pages quickly', async () => {
      const mockAnnotations = Array.from({ length: 20 }, (_, i) => ({
        fieldName: `field${i}`,
        fieldType: 'Tx',
        rect: [100 + i * 10, 200, 300, 230],
        readOnly: false,
        required: i < 10,
      }));

      const mockPage = {
        pageNumber: 1,
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const { result, duration } = await measurePerformance(async () => {
        return await PDFService.extractFormFields(mockPage);
      });

      expect(result).toHaveLength(20);
      expectPerformance(duration, 100); // Should extract fields within 100ms
    });

    it('should handle pages with many form fields efficiently', async () => {
      // Create a large number of form fields (100)
      const mockAnnotations = Array.from({ length: 100 }, (_, i) => ({
        fieldName: `field${i}`,
        fieldType: ['Tx', 'Ch', 'Btn'][i % 3], // Mix of field types
        rect: [100 + (i % 10) * 50, 200 + Math.floor(i / 10) * 30, 300, 230],
        readOnly: i > 80,
        required: i < 50,
      }));

      const mockPage = {
        pageNumber: 1,
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const { result, duration } = await measurePerformance(async () => {
        return await PDFService.extractFormFields(mockPage);
      });

      expect(result).toHaveLength(100);
      expectPerformance(duration, 500); // Should handle large number of fields within 500ms
    });

    it('should process multiple pages concurrently', async () => {
      const createMockPage = (pageNum: number, fieldCount: number) => ({
        pageNumber: pageNum,
        getAnnotations: jest.fn().mockResolvedValue(
          Array.from({ length: fieldCount }, (_, i) => ({
            fieldName: `page${pageNum}_field${i}`,
            fieldType: 'Tx',
            rect: [100, 200 + i * 30, 300, 230 + i * 30],
          }))
        ),
      });

      const mockPages = [
        createMockPage(1, 15),
        createMockPage(2, 20),
        createMockPage(3, 10),
        createMockPage(4, 25),
        createMockPage(5, 5),
      ];

      const { result, duration } = await measurePerformance(async () => {
        return await Promise.all(
          mockPages.map(page => PDFService.extractFormFields(page))
        );
      });

      const totalFields = result.reduce((sum, fields) => sum + fields.length, 0);
      expect(totalFields).toBe(75); // 15 + 20 + 10 + 25 + 5
      expectPerformance(duration, 300); // Concurrent processing should be fast
    });
  });

  describe('Validation Service Performance', () => {
    it('should validate individual fields quickly', async () => {
      const field = generateMockFormField({
        name: 'testField',
        type: 'text',
        required: true,
      });

      const { result, duration } = await measurePerformance(async () => {
        return await ValidationService.validateField(field, 'test value');
      });

      expect(result.isValid).toBe(true);
      expectPerformance(duration, 10); // Individual validation should be under 10ms
    });

    it('should validate multiple fields efficiently', async () => {
      const fields = Array.from({ length: 50 }, (_, i) =>
        generateMockFormField({
          name: `field${i}`,
          type: ['text', 'email', 'phone', 'date'][i % 4],
          required: i < 25,
        })
      );

      const values = fields.reduce((acc, field, i) => {
        acc[field.name] = `value${i}`;
        return acc;
      }, {} as Record<string, any>);

      const { result, duration } = await measurePerformance(async () => {
        return await ValidationService.validateForm(fields, values);
      });

      expect(result.fieldResults).toHaveLength(50);
      expectPerformance(duration, 100); // Bulk validation should complete within 100ms
    });

    it('should benefit from validation caching', async () => {
      const field = generateMockFormField({
        name: 'cachedField',
        type: 'text',
        required: true,
      });

      const value = 'cached value';

      // First validation (cold)
      const { duration: firstValidation } = await measurePerformance(async () => {
        return await ValidationService.validateField(field, value);
      });

      // Second validation (cached)
      const { duration: secondValidation } = await measurePerformance(async () => {
        return await ValidationService.validateField(field, value);
      });

      expect(secondValidation).toBeLessThan(firstValidation);
      expectPerformance(secondValidation, 5); // Cached validation should be very fast
    });

    it('should handle complex validation rules efficiently', async () => {
      const complexField = generateMockFormField({
        name: 'complexField',
        type: 'email',
        required: true,
      });

      // Test with complex email validation
      const complexEmail = 'test.email+tag@very-long-domain-name.example.com';

      const { result, duration } = await measurePerformance(async () => {
        return await ValidationService.validateField(complexField, complexEmail);
      });

      expect(result.isValid).toBe(true);
      expectPerformance(duration, 50); // Complex validation should complete within 50ms
    });
  });

  describe('Feature Flags Performance', () => {
    let unleashService: UnleashService;

    beforeEach(async () => {
      unleashService = UnleashService.getInstance({
        url: 'http://test-url',
        clientKey: 'test-key',
      });
      await unleashService.initialize();
    });

    afterEach(() => {
      unleashService.destroy();
    });

    it('should check feature flags quickly', async () => {
      const { result, duration } = await measurePerformance(async () => {
        // Check multiple flags
        return [
          'ENHANCED_WIZARD_MODE',
          'SIGNATURE_DRAWING_MODE', 
          'PDF_LAZY_LOADING',
          'PERFORMANCE_MONITORING',
          'ENHANCED_FIELD_VALIDATION',
        ].map(flag => unleashService.isEnabled(flag as any));
      });

      expect(result).toHaveLength(5);
      expectPerformance(duration, 5); // Flag checks should be very fast
    });

    it('should handle bulk flag operations efficiently', async () => {
      const { result, duration } = await measurePerformance(async () => {
        return unleashService.getAllFlags();
      });

      expect(Object.keys(result)).toHaveLength(24); // All defined flags
      expectPerformance(duration, 10); // Bulk operations should be fast
    });

    it('should update context quickly', async () => {
      const newContext = {
        userId: 'test-user-123',
        sessionId: 'session-456', 
        feature: 'premium',
      };

      const { duration } = await measurePerformance(async () => {
        unleashService.updateContext(newContext);
        return Promise.resolve();
      });

      expectPerformance(duration, 5); // Context updates should be immediate
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const mockDoc = generateMockPDFDocument(5);
        const { getDocument } = require('pdfjs-dist');
        getDocument.mockReturnValue({
          promise: Promise.resolve(mockDoc),
        });

        await PDFService.loadDocument({
          url: `https://example.com/test${i}.pdf`,
        });

        // Validation operations
        const field = generateMockFormField({
          name: `field${i}`,
          type: 'text',
          required: true,
        });
        await ValidationService.validateField(field, `value${i}`);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up caches effectively', () => {
      // Add some test data to caches
      PDFService['loadedDocuments'].set('test1', generateMockPDFDocument(1));
      PDFService['loadedPages'].set('page1', {} as any);

      const { duration } = measurePerformance(() => {
        PDFService.clearCache();
      });

      expect(PDFService['loadedDocuments'].size).toBe(0);
      expect(PDFService['loadedPages'].size).toBe(0);
      expectPerformance(duration, 10); // Cache clearing should be fast
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid sequential operations', async () => {
      const operations = Array.from({ length: 20 }, (_, i) => async () => {
        const field = generateMockFormField({
          name: `stressField${i}`,
          type: 'text',
          required: true,
        });
        return await ValidationService.validateField(field, `value${i}`);
      });

      const { result, duration } = await measurePerformance(async () => {
        const results = [];
        for (const operation of operations) {
          results.push(await operation());
        }
        return results;
      });

      expect(result).toHaveLength(20);
      result.forEach(r => expect(r.isValid).toBe(true));
      expectPerformance(duration, 200); // Sequential operations should complete within 200ms
    });

    it('should handle concurrent stress operations', async () => {
      const operations = Array.from({ length: 20 }, (_, i) => () => {
        const field = generateMockFormField({
          name: `concurrentField${i}`,
          type: 'text', 
          required: true,
        });
        return ValidationService.validateField(field, `value${i}`);
      });

      const { result, duration } = await measurePerformance(async () => {
        return await Promise.all(operations.map(op => op()));
      });

      expect(result).toHaveLength(20);
      result.forEach(r => expect(r.isValid).toBe(true));
      expectPerformance(duration, 100); // Concurrent operations should be faster
    });

    it('should maintain performance under high feature flag usage', async () => {
      const unleashService = UnleashService.getInstance();
      await unleashService.initialize();

      const flagChecks = Array.from({ length: 1000 }, () => () => 
        unleashService.isEnabled('ENHANCED_WIZARD_MODE')
      );

      const { result, duration } = await measurePerformance(async () => {
        return flagChecks.map(check => check());
      });

      expect(result).toHaveLength(1000);
      expectPerformance(duration, 50); // 1000 flag checks should complete within 50ms

      unleashService.destroy();
    });
  });
});