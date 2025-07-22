// Mock pdfjs-dist before importing
import { pdfService } from '../pdfService';
import * as pdfjsLib from 'pdfjs-dist';

jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

describe('PDFService', () => {
  describe('loadPDF', () => {
    it('should load PDF from URL', async () => {
      const mockPDFDocument = {
        numPages: 2,
        getPage: jest.fn(),
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockPDFDocument),
      };

      (pdfjsLib.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);

      const result = await pdfService.loadPDF('/pdfs/makana2025.pdf');

      expect(pdfjsLib.getDocument).toHaveBeenCalledWith('/pdfs/makana2025.pdf');
      expect(result).toBe(mockPDFDocument);
    });

    it('should handle PDF loading errors', async () => {
      const error = new Error('Failed to load PDF');
      const mockLoadingTask = {
        promise: Promise.reject(error),
      };

      (pdfjsLib.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);

      await expect(pdfService.loadPDF('/invalid.pdf')).rejects.toThrow(
        'Failed to load PDF'
      );
    });
  });

  describe('renderPage', () => {
    it('should render page to canvas with proper viewport', async () => {
      const mockPage = {
        getViewport: jest.fn().mockReturnValue({
          width: 800,
          height: 600,
          transform: [1, 0, 0, 1, 0, 0],
        }),
        render: jest.fn().mockResolvedValue(undefined),
      };

      const mockCanvas = document.createElement('canvas');
      const mockContext = mockCanvas.getContext('2d');

      const result = await pdfService.renderPage(mockPage, mockCanvas, 1.0);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });
      expect(mockPage.render).toHaveBeenCalledWith({
        canvasContext: mockContext,
        viewport: expect.any(Object),
      });
      expect(result).toEqual({
        width: 800,
        height: 600,
      });
    });
  });

  describe('getFormFields', () => {
    it('should extract form fields from PDF page annotations', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'name',
          rect: [100, 100, 200, 120],
          readOnly: false,
        },
        {
          fieldType: 'Ch',
          fieldName: 'dropdown',
          rect: [100, 150, 200, 170],
          readOnly: false,
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage);

      expect(mockPage.getAnnotations).toHaveBeenCalledWith({
        intent: 'display',
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: 'text',
        name: 'name',
        rect: [100, 100, 200, 120],
        required: false,
        readOnly: false,
      });
    });

    it('should filter out read-only fields from required validation', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'readonly_field',
          rect: [100, 100, 200, 120],
          readOnly: true,
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage);

      expect(result[0].readOnly).toBe(true);
    });
  });
});
