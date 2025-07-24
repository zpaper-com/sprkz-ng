// Mock pdfjs-dist before importing
import { pdfService } from '../pdfService';
import * as pdfjsLib from 'pdfjs-dist';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock HTML canvas elements
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockReturnValue({
    scale: jest.fn(),
    clearRect: jest.fn(),
  }),
});

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true,
});

jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

describe('PDFService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error loading PDF:', error);
    });

    it('should handle different PDF URLs', async () => {
      const mockPDFDocument = { numPages: 1 };
      const mockLoadingTask = {
        promise: Promise.resolve(mockPDFDocument),
      };

      (pdfjsLib.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);

      await pdfService.loadPDF('https://example.com/document.pdf');

      expect(pdfjsLib.getDocument).toHaveBeenCalledWith('https://example.com/document.pdf');
    });
  });

  describe('renderPage', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockContext = {
        scale: jest.fn(),
        clearRect: jest.fn(),
      } as any;
      
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    });

    it('should render page to canvas with proper viewport', async () => {
      const mockViewport = {
        width: 800,
        height: 600,
        transform: [1, 0, 0, 1, 0, 0],
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      const result = await pdfService.renderPage(mockPage as any, mockCanvas, 1.0);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });
      expect(mockPage.render).toHaveBeenCalledWith({
        canvasContext: mockContext,
        viewport: mockViewport,
      });
      expect(result).toEqual({
        width: 800,
        height: 600,
      });
    });

    it('should handle different scale values', async () => {
      const mockViewport = {
        width: 1600,
        height: 1200,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      await pdfService.renderPage(mockPage as any, mockCanvas, 2.0);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 2.0 });
    });

    it('should handle default scale when not provided', async () => {
      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      await pdfService.renderPage(mockPage as any, mockCanvas);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });
    });

    it('should throw error when canvas context is null', async () => {
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      const mockPage = {
        getViewport: jest.fn().mockReturnValue({ width: 800, height: 600 }),
        render: jest.fn(),
      };

      await expect(
        pdfService.renderPage(mockPage as any, mockCanvas, 1.0)
      ).rejects.toThrow('Could not get canvas context');
    });

    it('should handle device pixel ratio correctly', async () => {
      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      await pdfService.renderPage(mockPage as any, mockCanvas, 1.0);

      // Check that canvas dimensions are scaled by device pixel ratio (2)
      expect(mockCanvas.width).toBe(1600); // 800 * 2
      expect(mockCanvas.height).toBe(1200); // 600 * 2
      expect(mockCanvas.style.width).toBe('800px');
      expect(mockCanvas.style.height).toBe('600px');
      
      expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should handle rendering errors', async () => {
      const error = new Error('Rendering failed');
      const mockRenderTask = {
        promise: Promise.reject(error),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue({ width: 800, height: 600 }),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      await expect(
        pdfService.renderPage(mockPage as any, mockCanvas)
      ).rejects.toThrow('Rendering failed');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error rendering PDF page:', error);
    });
  });

  describe('renderPageWithCancellation', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockContext = {
        scale: jest.fn(),
        clearRect: jest.fn(),
      } as any;
      
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    });

    it('should return render task for cancellation', () => {
      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
        cancel: jest.fn(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      const result = pdfService.renderPageWithCancellation(mockPage as any, mockCanvas, 1.0);

      expect(result).toBe(mockRenderTask);
      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });
      expect(mockPage.render).toHaveBeenCalledWith({
        canvasContext: mockContext,
        viewport: mockViewport,
      });
    });

    it('should handle default scale', () => {
      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      pdfService.renderPageWithCancellation(mockPage as any, mockCanvas);

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 1.0 });
    });

    it('should throw error when canvas context is null', () => {
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      const mockPage = {
        getViewport: jest.fn().mockReturnValue({ width: 800, height: 600 }),
        render: jest.fn(),
      };

      expect(() => {
        pdfService.renderPageWithCancellation(mockPage as any, mockCanvas);
      }).toThrow('Could not get canvas context');
    });

    it('should set up canvas with device pixel ratio', () => {
      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
      };

      pdfService.renderPageWithCancellation(mockPage as any, mockCanvas, 1.5);

      expect(mockCanvas.width).toBe(1600); // 800 * 2 (devicePixelRatio)
      expect(mockCanvas.height).toBe(1200); // 600 * 2 (devicePixelRatio)
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

      const result = await pdfService.getFormFields(mockPage as any);

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
      expect(result[1]).toEqual({
        type: 'dropdown',
        name: 'dropdown',
        rect: [100, 150, 200, 170],
        required: false,
        readOnly: false,
      });
    });

    it('should handle all field types correctly', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'text_field',
        },
        {
          fieldType: 'Btn',
          fieldName: 'button_field',
        },
        {
          fieldType: 'Ch',
          fieldName: 'choice_field',
        },
        {
          fieldType: 'Sig',
          fieldName: 'signature_field',
        },
        {
          fieldType: 'Unknown',
          fieldName: 'unknown_field',
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('text');
      expect(result[1].type).toBe('checkbox');
      expect(result[2].type).toBe('dropdown');
      expect(result[3].type).toBe('signature');
      expect(result[4].type).toBe('text'); // Unknown defaults to text
    });

    it('should handle annotations with options', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Ch',
          fieldName: 'dropdown_with_options',
          options: ['Option 1', 'Option 2', 'Option 3'],
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result[0].options).toEqual(['Option 1', 'Option 2', 'Option 3']);
    });

    it('should handle annotations with field values', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'text_with_value',
          fieldValue: 'Initial value',
        },
        {
          fieldType: 'Btn',
          fieldName: 'checkbox_checked',
          fieldValue: true,
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result[0].value).toBe('Initial value');
      expect(result[1].value).toBe(true);
    });

    it('should handle annotations without field names', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          // No fieldName property
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result[0].name).toBe('');
    });

    it('should handle annotations without rect property', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'field_without_rect',
          // No rect property
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result[0].rect).toEqual([]);
    });

    it('should filter out annotations without fieldType', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'valid_field',
        },
        {
          // No fieldType
          fieldName: 'invalid_field',
        },
        {
          fieldType: 'Ch',
          fieldName: 'another_valid_field',
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('valid_field');
      expect(result[1].name).toBe('another_valid_field');
    });

    it('should handle read-only fields', async () => {
      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'readonly_field',
          readOnly: true,
        },
        {
          fieldType: 'Tx',
          fieldName: 'editable_field',
          readOnly: false,
        },
        {
          fieldType: 'Tx',
          fieldName: 'default_field',
          // No readOnly property
        },
      ];

      const mockPage = {
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
      };

      const result = await pdfService.getFormFields(mockPage as any);

      expect(result[0].readOnly).toBe(true);
      expect(result[1].readOnly).toBe(false);
      expect(result[2].readOnly).toBe(false); // Default
    });
  });

  describe('createTextLayer', () => {
    let mockTextLayerDiv: HTMLDivElement;

    beforeEach(() => {
      mockTextLayerDiv = document.createElement('div');
    });

    it('should create text layer with proper positioning', async () => {
      const mockTextContent = {
        items: [
          {
            str: 'Hello World',
            transform: [1, 0, 0, 1, 100, 200],
            height: 16,
            fontName: 'Arial',
          },
          {
            str: 'Second line',
            transform: [1, 0, 0, 1, 100, 180],
            height: 14,
            // No fontName
          },
        ],
      };

      const mockViewport = {
        height: 600,
      };

      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue(mockTextContent),
      };

      await pdfService.createTextLayer(mockPage as any, mockTextLayerDiv, mockViewport);

      expect(mockPage.getTextContent).toHaveBeenCalled();
      expect(mockTextLayerDiv.className).toBe('textLayer');
      expect(mockTextLayerDiv.children).toHaveLength(2);

      const firstSpan = mockTextLayerDiv.children[0] as HTMLSpanElement;
      expect(firstSpan.textContent).toBe('Hello World');
      expect(firstSpan.style.position).toBe('absolute');
      expect(firstSpan.style.left).toBe('100px');
      expect(firstSpan.style.top).toBe('384px'); // 600 - 200 - 16
      expect(firstSpan.style.fontSize).toBe('16px');
      expect(firstSpan.style.fontFamily).toBe('Arial');
      expect(firstSpan.style.color).toBe('transparent');
      expect(firstSpan.style.userSelect).toBe('text');
      expect(firstSpan.style.cursor).toBe('text');

      const secondSpan = mockTextLayerDiv.children[1] as HTMLSpanElement;
      expect(secondSpan.textContent).toBe('Second line');
      expect(secondSpan.style.fontFamily).toBe('sans-serif'); // Default
    });

    it('should clear existing text layer content', async () => {
      mockTextLayerDiv.innerHTML = '<span>Existing content</span>';
      mockTextLayerDiv.className = 'oldClass';

      const mockTextContent = {
        items: [],
      };

      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue(mockTextContent),
      };

      await pdfService.createTextLayer(mockPage as any, mockTextLayerDiv, { height: 600 });

      expect(mockTextLayerDiv.innerHTML).toBe('');
      expect(mockTextLayerDiv.className).toBe('textLayer');
    });

    it('should handle empty text content', async () => {
      const mockTextContent = {
        items: [],
      };

      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue(mockTextContent),
      };

      await pdfService.createTextLayer(mockPage as any, mockTextLayerDiv, { height: 600 });

      expect(mockTextLayerDiv.children).toHaveLength(0);
    });

    it('should handle text items with different transforms', async () => {
      const mockTextContent = {
        items: [
          {
            str: 'Rotated text',
            transform: [0.707, 0.707, -0.707, 0.707, 150, 300],
            height: 12,
          },
        ],
      };

      const mockViewport = {
        height: 600,
      };

      const mockPage = {
        getTextContent: jest.fn().mockResolvedValue(mockTextContent),
      };

      await pdfService.createTextLayer(mockPage as any, mockTextLayerDiv, mockViewport);

      const span = mockTextLayerDiv.children[0] as HTMLSpanElement;
      expect(span.style.left).toBe('150px'); // transform[4]
      expect(span.style.top).toBe('288px'); // 600 - 300 - 12
    });
  });

  describe('getPageCount', () => {
    it('should return the number of pages in PDF document', () => {
      const mockPDFDocument = {
        numPages: 5,
      };

      const result = pdfService.getPageCount(mockPDFDocument as any);

      expect(result).toBe(5);
    });

    it('should handle single page documents', () => {
      const mockPDFDocument = {
        numPages: 1,
      };

      const result = pdfService.getPageCount(mockPDFDocument as any);

      expect(result).toBe(1);
    });

    it('should handle large documents', () => {
      const mockPDFDocument = {
        numPages: 1000,
      };

      const result = pdfService.getPageCount(mockPDFDocument as any);

      expect(result).toBe(1000);
    });
  });

  describe('getPage', () => {
    it('should return specific page from PDF document', async () => {
      const mockPage = {
        pageNumber: 3,
      };

      const mockPDFDocument = {
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      const result = await pdfService.getPage(mockPDFDocument as any, 3);

      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(3);
      expect(result).toBe(mockPage);
    });

    it('should handle first page', async () => {
      const mockPage = {
        pageNumber: 1,
      };

      const mockPDFDocument = {
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      const result = await pdfService.getPage(mockPDFDocument as any, 1);

      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(1);
      expect(result).toBe(mockPage);
    });

    it('should handle page loading errors', async () => {
      const error = new Error('Page not found');
      const mockPDFDocument = {
        getPage: jest.fn().mockRejectedValue(error),
      };

      await expect(
        pdfService.getPage(mockPDFDocument as any, 999)
      ).rejects.toThrow('Page not found');
    });
  });

  describe('Integration tests', () => {
    it('should work with full PDF processing workflow', async () => {
      const mockTextContent = {
        items: [
          {
            str: 'Sample text',
            transform: [1, 0, 0, 1, 50, 100],
            height: 12,
            fontName: 'Times',
          },
        ],
      };

      const mockAnnotations = [
        {
          fieldType: 'Tx',
          fieldName: 'sample_field',
          rect: [50, 100, 200, 120],
          readOnly: false,
        },
      ];

      const mockViewport = {
        width: 800,
        height: 600,
      };

      const mockRenderTask = {
        promise: Promise.resolve(),
      };

      const mockPage = {
        getViewport: jest.fn().mockReturnValue(mockViewport),
        render: jest.fn().mockReturnValue(mockRenderTask),
        getAnnotations: jest.fn().mockResolvedValue(mockAnnotations),
        getTextContent: jest.fn().mockResolvedValue(mockTextContent),
      };

      const mockPDFDocument = {
        numPages: 1,
        getPage: jest.fn().mockResolvedValue(mockPage),
      };

      const mockLoadingTask = {
        promise: Promise.resolve(mockPDFDocument),
      };

      (pdfjsLib.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);

      // Test full workflow
      const pdfDocument = await pdfService.loadPDF('/test.pdf');
      expect(pdfService.getPageCount(pdfDocument)).toBe(1);

      const page = await pdfService.getPage(pdfDocument, 1);
      
      const canvas = document.createElement('canvas');
      const mockContext = {
        scale: jest.fn(),
        clearRect: jest.fn(),
      };
      jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);

      const dimensions = await pdfService.renderPage(page, canvas);
      expect(dimensions).toEqual({ width: 800, height: 600 });

      const formFields = await pdfService.getFormFields(page);
      expect(formFields).toHaveLength(1);
      expect(formFields[0].name).toBe('sample_field');

      const textLayerDiv = document.createElement('div');
      await pdfService.createTextLayer(page, textLayerDiv, mockViewport);
      expect(textLayerDiv.children).toHaveLength(1);
    });
  });
});
