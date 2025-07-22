import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface FormField {
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'button';
  name: string;
  rect: number[];
  required: boolean;
  readOnly: boolean;
  options?: string[];
  value?: string;
}

export interface PageDimensions {
  width: number;
  height: number;
}

class PDFService {
  /**
   * Load PDF document from URL
   */
  async loadPDF(url: string): Promise<PDFDocumentProxy> {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdfDocument = await loadingTask.promise;
      return pdfDocument;
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  /**
   * Render PDF page to canvas
   */
  async renderPage(
    page: PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scale: number = 1.0
  ): Promise<PageDimensions> {
    try {
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions with device pixel ratio for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      canvas.height = viewport.height * devicePixelRatio;
      canvas.width = viewport.width * devicePixelRatio;
      canvas.style.height = viewport.height + 'px';
      canvas.style.width = viewport.width + 'px';

      // Scale context for device pixel ratio
      context.scale(devicePixelRatio, devicePixelRatio);

      // Clear canvas before rendering
      context.clearRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Render and wait for completion
      const renderTask = page.render(renderContext);
      await renderTask.promise;

      return {
        width: viewport.width,
        height: viewport.height
      };
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      throw error;
    }
  }

  /**
   * Render PDF page to canvas with cancellation support
   */
  renderPageWithCancellation(
    page: PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scale: number = 1.0
  ): any {
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas dimensions with device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.width = viewport.width * devicePixelRatio;
    canvas.style.height = viewport.height + 'px';
    canvas.style.width = viewport.width + 'px';

    // Scale context for device pixel ratio
    context.scale(devicePixelRatio, devicePixelRatio);

    // Clear canvas before rendering
    context.clearRect(0, 0, viewport.width, viewport.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Return the render task directly so it can be cancelled
    return page.render(renderContext);
  }

  /**
   * Extract form fields from PDF page annotations
   */
  async getFormFields(page: PDFPageProxy): Promise<FormField[]> {
    const annotations = await page.getAnnotations({ intent: 'display' });
    
    return annotations
      .filter((annotation: any) => annotation.fieldType)
      .map((annotation: any) => {
        const field: FormField = {
          type: this.mapFieldType(annotation.fieldType),
          name: annotation.fieldName || '',
          rect: annotation.rect || [],
          required: false, // Will be enhanced in later phases
          readOnly: annotation.readOnly || false,
        };

        // Add options for dropdown/radio fields
        if (annotation.options) {
          field.options = annotation.options;
        }

        // Add current value if available
        if (annotation.fieldValue !== undefined) {
          field.value = annotation.fieldValue;
        }

        return field;
      });
  }

  /**
   * Map PDF.js field types to our internal field types
   */
  private mapFieldType(pdfFieldType: string): FormField['type'] {
    switch (pdfFieldType) {
      case 'Tx': // Text field
        return 'text';
      case 'Btn': // Button field (checkbox, radio, push button)
        return 'checkbox'; // Will be refined based on button flags
      case 'Ch': // Choice field (dropdown, listbox)
        return 'dropdown';
      case 'Sig': // Signature field
        return 'signature';
      default:
        return 'text';
    }
  }

  /**
   * Create text layer for PDF page (for text selection)
   */
  async createTextLayer(
    page: PDFPageProxy,
    textLayerDiv: HTMLDivElement,
    viewport: any
  ): Promise<void> {
    const textContent = await page.getTextContent();
    
    // Clear existing text layer
    textLayerDiv.innerHTML = '';
    textLayerDiv.className = 'textLayer';

    // Create properly positioned text elements for selection
    textContent.items.forEach((textItem: any) => {
      const textDiv = document.createElement('span');
      textDiv.textContent = textItem.str;
      textDiv.style.position = 'absolute';
      
      // Transform coordinates from PDF coordinate system to viewport
      const tx = textItem.transform;
      const left = tx[4];
      const bottom = tx[5]; 
      const top = viewport.height - bottom - textItem.height;
      
      textDiv.style.left = `${left}px`;
      textDiv.style.top = `${top}px`;
      textDiv.style.fontSize = `${textItem.height}px`;
      textDiv.style.fontFamily = textItem.fontName || 'sans-serif';
      textDiv.style.whiteSpace = 'pre';
      textDiv.style.color = 'transparent';
      textDiv.style.userSelect = 'text';
      textDiv.style.cursor = 'text';
      
      textLayerDiv.appendChild(textDiv);
    });
  }

  /**
   * Get page count from PDF document
   */
  getPageCount(pdfDocument: PDFDocumentProxy): number {
    return pdfDocument.numPages;
  }

  /**
   * Get specific page from PDF document
   */
  async getPage(pdfDocument: PDFDocumentProxy, pageNumber: number): Promise<PDFPageProxy> {
    return await pdfDocument.getPage(pageNumber);
  }
}

export const pdfService = new PDFService();