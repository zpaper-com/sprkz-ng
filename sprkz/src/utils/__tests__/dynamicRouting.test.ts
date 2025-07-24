import { DynamicRoutingService } from '../dynamicRouting';

// Mock fetch globally
global.fetch = jest.fn();

describe('DynamicRoutingService', () => {
  let service: DynamicRoutingService;

  beforeEach(() => {
    service = new DynamicRoutingService();
    jest.clearAllMocks();
  });

  describe('loadURLConfigs', () => {
    it('should load URL configurations from API', async () => {
      const mockConfigs = [
        {
          path: '/makana',
          pdfPath: 'makana2025.pdf',
          features: { 1: true, 2: false },
          pdfFields: { 'field1': 'read-only', 'field2': 'hidden' }
        },
        {
          path: '/tremfya',
          pdfPath: 'tremfya.pdf',
          features: { 1: false, 2: true },
          pdfFields: {}
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      });

      await service.loadURLConfigs();

      expect(fetch).toHaveBeenCalledWith('/api/url-configs');
      expect(service.getLoaded()).toBe(true);
      expect(service.getAllPaths()).toEqual(['/makana', '/tremfya']);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(service.loadURLConfigs()).rejects.toThrow('Failed to fetch URL configurations: 500');
      expect(service.getLoaded()).toBe(false);
    });
  });

  describe('findURLConfig', () => {
    beforeEach(async () => {
      const mockConfigs = [
        {
          path: '/makana',
          pdfPath: 'makana2025.pdf',
          features: { 1: true },
          pdfFields: { 'field1': 'read-only' }
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      });

      await service.loadURLConfigs();
    });

    it('should find URL configuration by path', () => {
      const config = service.findURLConfig('/makana');
      expect(config).not.toBeNull();
      expect(config?.path).toBe('/makana');
      expect(config?.pdfPath).toBe('makana2025.pdf');
    });

    it('should return null for non-existent paths', () => {
      const config = service.findURLConfig('/nonexistent');
      expect(config).toBeNull();
    });
  });

  describe('getPDFPath', () => {
    beforeEach(async () => {
      const mockConfigs = [
        {
          path: '/makana',
          pdfPath: 'makana2025.pdf',
          features: {},
          pdfFields: {}
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      });

      await service.loadURLConfigs();
    });

    it('should return correct PDF path for configured routes', () => {
      const pdfPath = service.getPDFPath('/makana');
      expect(pdfPath).toBe('/pdfs/makana2025.pdf');
    });

    it('should return default PDF path for non-existent routes', () => {
      const pdfPath = service.getPDFPath('/nonexistent');
      expect(pdfPath).toBe('/pdfs/makana2025.pdf');
    });
  });

  describe('getFeatures', () => {
    beforeEach(async () => {
      const mockConfigs = [
        {
          path: '/makana',
          pdfPath: 'makana2025.pdf',
          features: { 1: true, 2: false },
          pdfFields: {}
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      });

      await service.loadURLConfigs();
    });

    it('should return features for configured routes', () => {
      const features = service.getFeatures('/makana');
      expect(features).toEqual({ 1: true, 2: false });
    });

    it('should return empty object for non-existent routes', () => {
      const features = service.getFeatures('/nonexistent');
      expect(features).toEqual({});
    });
  });

  describe('getPDFFields', () => {
    beforeEach(async () => {
      const mockConfigs = [
        {
          path: '/makana',
          pdfPath: 'makana2025.pdf',
          features: {},
          pdfFields: { 'field1': 'read-only', 'field2': 'hidden' }
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs
      });

      await service.loadURLConfigs();
    });

    it('should return PDF field configurations for configured routes', () => {
      const pdfFields = service.getPDFFields('/makana');
      expect(pdfFields).toEqual({ 'field1': 'read-only', 'field2': 'hidden' });
    });

    it('should return empty object for non-existent routes', () => {
      const pdfFields = service.getPDFFields('/nonexistent');
      expect(pdfFields).toEqual({});
    });
  });
});