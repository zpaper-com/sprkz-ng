import { PDFService } from '../../services/pdfService';
import { generateMockPDFDocument, createMockFile } from '../utils/testUtils';
import * as unleashService from '../../services/unleashService';

// Mock PDF.js
const mockPDFJS = {
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '/pdf.worker.min.mjs',
  },
  VerbosityLevel: {
    ERRORS: 0,
    WARNINGS: 1,
    INFOS: 5,
  },
};

jest.mock('pdfjs-dist', () => mockPDFJS);

// Mock Unleash service
jest.mock('../../services/unleashService', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
}));

describe('PDFService', () => {
  const mockIsFeatureEnabled = unleashService.isFeatureEnabled as jest.MockedFunction<typeof unleashService.isFeatureEnabled>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default feature flag responses
    mockIsFeatureEnabled.mockImplementation((flag) => {
      switch (flag) {
        case 'PDF_LAZY_LOADING':
          return true;
        case 'PERFORMANCE_MONITORING':
          return true;
        default:
          return true;
      }
    });

    // Clear any cached documents
    PDFService['loadedDocuments'].clear();
    PDFService['loadedPages'].clear();
  });

  describe('Document Loading', () => {
    it('should load PDF from URL', async () => {
      const mockDoc = generateMockPDFDocument(3);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      const result = await PDFService.loadDocument({
        url: 'https://example.com/test.pdf',
      });

      expect(result).toBe(mockDoc);
      expect(mockPDFJS.getDocument).toHaveBeenCalledWith({
        url: 'https://example.com/test.pdf',
        data: undefined,
        withCredentials: false,
        verbosity: mockPDFJS.VerbosityLevel.INFOS,
      });
    });

    it('should load PDF from data buffer', async () => {
      const mockDoc = generateMockPDFDocument(2);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      const testData = new ArrayBuffer(1024);
      const result = await PDFService.loadDocument({
        data: testData,
      });

      expect(result).toBe(mockDoc);
      expect(mockPDFJS.getDocument).toHaveBeenCalledWith({
        url: undefined,
        data: testData,
        withCredentials: undefined,
        verbosity: mockPDFJS.VerbosityLevel.INFOS,
      });
    });

    it('should use cached documents when lazy loading is enabled', async () => {
      const mockDoc = generateMockPDFDocument(3);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      const url = 'https://example.com/cached.pdf';
      
      // First load
      const result1 = await PDFService.loadDocument({ url });
      expect(result1).toBe(mockDoc);
      expect(mockPDFJS.getDocument).toHaveBeenCalledTimes(1);

      // Second load (should use cache)
      const result2 = await PDFService.loadDocument({ url });
      expect(result2).toBe(mockDoc);
      expect(mockPDFJS.getDocument).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should bypass cache when lazy loading is disabled', async () => {
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'PDF_LAZY_LOADING' ? false : true
      );

      const mockDoc = generateMockPDFDocument(3);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      const url = 'https://example.com/no-cache.pdf';
      
      // First load
      await PDFService.loadDocument({ url });
      expect(mockPDFJS.getDocument).toHaveBeenCalledTimes(1);

      // Second load (should not use cache)
      await PDFService.loadDocument({ url });
      expect(mockPDFJS.getDocument).toHaveBeenCalledTimes(2);
    });

    it('should handle loading errors gracefully', async () => {
      const loadingError = new Error('Failed to load PDF');
      const mockLoadingTask = {
        promise: Promise.reject(loadingError),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      await expect(PDFService.loadDocument({
        url: 'https://example.com/invalid.pdf',
      })).rejects.toMatchObject({
        type: 'LOADING_FAILED',
        originalError: loadingError,
      });
    });

    it('should support credentials for cross-origin requests', async () => {
      const mockDoc = generateMockPDFDocument(1);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      await PDFService.loadDocument({
        url: 'https://example.com/secure.pdf',
        withCredentials: true,
      });

      expect(mockPDFJS.getDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          withCredentials: true,
        })
      );
    });
  });

  describe('Page Extraction', () => {
    it('should extract specific pages from PDF document', async () => {
      const mockPage = {
        pageNumber: 2,
        getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        render: jest.fn().mockResolvedValue({}),
        getAnnotations: jest.fn().mockResolvedValue([]),
      };
      
      const mockDoc = {
        ...generateMockPDFDocument(3),
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      const result = await PDFService.getPage(mockDoc, 2);

      expect(result).toBe(mockPage);
      expect(mockDoc.getPage).toHaveBeenCalledWith(2);
    });

    it('should cache pages when lazy loading is enabled', async () => {
      const mockPage = {
        pageNumber: 1,
        getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        render: jest.fn().mockResolvedValue({}),
        getAnnotations: jest.fn().mockResolvedValue([]),
      };
      
      const mockDoc = {
        ...generateMockPDFDocument(3),
        fingerprints: ['test-fingerprint'],
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      // First call
      const result1 = await PDFService.getPage(mockDoc, 1);
      expect(result1).toBe(mockPage);
      expect(mockDoc.getPage).toHaveBeenCalledTimes(1);

      // Second call (should use cache)
      const result2 = await PDFService.getPage(mockDoc, 1);
      expect(result2).toBe(mockPage);
      expect(mockDoc.getPage).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle page extraction errors', async () => {
      const mockDoc = {
        ...generateMockPDFDocument(3),
        getPage: jest.fn().mockRejectedValue(new Error('Page not found')),
      };

      await expect(PDFService.getPage(mockDoc, 10)).rejects.toMatchObject({
        type: 'PARSING_FAILED',
        message: expect.stringContaining('Failed to get page 10'),
      });
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate thumbnails from PDF pages', async () => {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,thumbnail-data');
      
      const mockContext = {
        drawImage: jest.fn(),
        clearRect: jest.fn(),
      };
      
      mockCanvas.getContext = jest.fn().mockReturnValue(mockContext);
      
      // Mock document.createElement
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn().mockReturnValue(mockCanvas);

      const mockPage = {
        pageNumber: 1,
        getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        render: jest.fn().mockResolvedValue({}),
      };

      const result = await PDFService.generateThumbnail(mockPage, 150);

      expect(result).toBe('data:image/png;base64,thumbnail-data');
      expect(mockPage.render).toHaveBeenCalled();
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png', 0.8);

      // Restore document.createElement
      document.createElement = originalCreateElement;
    });

    it('should handle thumbnail generation errors', async () => {
      const mockPage = {
        pageNumber: 1,
        getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        render: jest.fn().mockRejectedValue(new Error('Render failed')),
      };

      await expect(PDFService.generateThumbnail(mockPage, 150)).rejects.toMatchObject({
        type: 'RENDERING_FAILED',
        message: expect.stringContaining('Failed to generate thumbnail'),
      });
    });
  });

  describe('Form Field Extraction', () => {
    it('should extract form fields from PDF pages', async () => {
      const mockAnnotations = [
        {
          fieldName: 'firstName',
          fieldType: 'Tx', // Text field
          rect: [100, 200, 300, 230],
          readOnly: false,
          required: true,
        },
        {
          fieldName: 'signature',
          fieldType: 'Sig', // Signature field
          rect: [100, 150, 400, 200],
          readOnly: false,
          required: true,
        },
      ];
      
      const mockPage = {
        pageNumber: 1,
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await PDFService.extractFormFields(mockPage);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'firstName',
        type: 'text',
        required: true,
        readOnly: false,
        page: 1,
        rect: [100, 200, 300, 230],
      });
      expect(result[1]).toMatchObject({
        name: 'signature',
        type: 'signature',
        required: true,
        readOnly: false,
        page: 1,
        rect: [100, 150, 400, 200],
      });
    });

    it('should handle pages with no form fields', async () => {
      const mockPage = {
        pageNumber: 1,
        getAnnotations: jest.fn().mockResolvedValue([]),
      };

      const result = await PDFService.extractFormFields(mockPage);

      expect(result).toHaveLength(0);
      expect(mockPage.getAnnotations).toHaveBeenCalledWith({ intent: 'display' });
    });

    it('should filter out non-form annotations', async () => {
      const mockAnnotations = [
        {
          fieldName: 'textField',
          fieldType: 'Tx',
          rect: [100, 200, 300, 230],
        },
        {
          // Non-form annotation (e.g., link)
          subtype: 'Link',
          url: 'https://example.com',
        },
        {
          // Annotation without fieldName
          fieldType: 'Tx',
          rect: [100, 100, 300, 130],
        },
      ];
      
      const mockPage = {
        pageNumber: 1,
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await PDFService.extractFormFields(mockPage);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('textField');
    });
  });

  describe('Performance Monitoring', () => {
    it('should log performance metrics when monitoring is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockDoc = generateMockPDFDocument(1);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      await PDFService.loadDocument({
        url: 'https://example.com/performance.pdf',
      });

      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('PERFORMANCE_MONITORING');
      // Should log performance metrics
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PDF loaded successfully')
      );

      consoleSpy.mockRestore();
    });

    it('should not log when performance monitoring is disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'PERFORMANCE_MONITORING' ? false : true
      );

      const mockDoc = generateMockPDFDocument(1);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      await PDFService.loadDocument({
        url: 'https://example.com/quiet.pdf',
      });

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('PDF loaded successfully')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should clean up cached documents', () => {
      // Add some mock documents to cache
      PDFService['loadedDocuments'].set('test1', generateMockPDFDocument(1));
      PDFService['loadedPages'].set('page1', { pageNumber: 1 } as any);

      expect(PDFService['loadedDocuments'].size).toBe(1);
      expect(PDFService['loadedPages'].size).toBe(1);

      PDFService.clearCache();

      expect(PDFService['loadedDocuments'].size).toBe(0);
      expect(PDFService['loadedPages'].size).toBe(0);
    });

    it('should handle large document caching', async () => {
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'PDF_LAZY_LOADING' ? true : false
      );

      const mockDoc = generateMockPDFDocument(100); // Large document
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      const url = 'https://example.com/large.pdf';
      await PDFService.loadDocument({ url });

      // Should be cached
      expect(PDFService['loadedDocuments'].has(url)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error information', async () => {
      const originalError = new Error('Network error');
      const mockLoadingTask = {
        promise: Promise.reject(originalError),
      };
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      try {
        await PDFService.loadDocument({
          url: 'https://example.com/error.pdf',
        });
      } catch (error: any) {
        expect(error).toMatchObject({
          type: 'LOADING_FAILED',
          message: expect.stringContaining('Failed to load PDF'),
          originalError,
        });
      }
    });

    it('should handle worker initialization errors', async () => {
      // Mock worker error
      const workerError = new Error('Worker failed to initialize');
      mockPDFJS.getDocument.mockImplementation(() => {
        throw workerError;
      });

      await expect(PDFService.loadDocument({
        url: 'https://example.com/worker-error.pdf',
      })).rejects.toMatchObject({
        type: 'LOADING_FAILED',
        originalError: workerError,
      });
    });
  });

  describe('Integration', () => {
    it('should work with File objects', async () => {
      const mockFile = createMockFile('test.pdf', 'application/pdf', 2048);
      const mockDoc = generateMockPDFDocument(2);
      const mockLoadingTask = {
        promise: Promise.resolve(mockDoc),
      };
      
      // Mock FileReader
      const mockFileReader = {
        readAsArrayBuffer: jest.fn(),
        result: new ArrayBuffer(2048),
        onload: null as any,
        onerror: null as any,
      };
      
      global.FileReader = jest.fn().mockImplementation(() => mockFileReader);
      
      mockPDFJS.getDocument.mockReturnValue(mockLoadingTask);

      // Simulate file reading
      const loadPromise = PDFService.loadDocument({ data: mockFileReader.result });
      
      const result = await loadPromise;
      expect(result).toBe(mockDoc);
    });

    it('should handle concurrent document loading', async () => {
      const mockDoc1 = generateMockPDFDocument(1);
      const mockDoc2 = generateMockPDFDocument(2);
      
      mockPDFJS.getDocument
        .mockReturnValueOnce({ promise: Promise.resolve(mockDoc1) })
        .mockReturnValueOnce({ promise: Promise.resolve(mockDoc2) });

      const [result1, result2] = await Promise.all([
        PDFService.loadDocument({ url: 'https://example.com/doc1.pdf' }),
        PDFService.loadDocument({ url: 'https://example.com/doc2.pdf' }),
      ]);

      expect(result1).toBe(mockDoc1);
      expect(result2).toBe(mockDoc2);
      expect(mockPDFJS.getDocument).toHaveBeenCalledTimes(2);
    });
  });
});