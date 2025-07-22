import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.REACT_APP_PDF_WORKER_URL || '/pdf.worker.min.mjs';

export interface PDFLoadOptions {
  url?: string;
  data?: ArrayBuffer;
  withCredentials?: boolean;
}

export interface PDFServiceError {
  type: 'LOADING_FAILED' | 'PARSING_FAILED' | 'RENDERING_FAILED';
  message: string;
  originalError?: Error;
}

export class PDFService {
  private static loadedDocuments: Map<string, PDFDocumentProxy> = new Map();
  private static loadedPages: Map<string, PDFPageProxy> = new Map();

  /**
   * Load PDF document from URL or data
   */
  static async loadDocument(options: PDFLoadOptions): Promise<PDFDocumentProxy> {
    const startTime = performance.now();
    
    try {
      const cacheKey = options.url || 'data-pdf';
      
      // Check cache first
      if (options.url && this.loadedDocuments.has(cacheKey)) {
        return this.loadedDocuments.get(cacheKey)!;
      }

      const loadingTask = options.url 
        ? pdfjsLib.getDocument({
            url: options.url,
            withCredentials: options.withCredentials || false,
          })
        : pdfjsLib.getDocument({ data: options.data! });

      const pdfDoc = await loadingTask.promise;
      
      // Cache the document
      if (options.url) {
        this.loadedDocuments.set(cacheKey, pdfDoc);
      }

      const duration = performance.now() - startTime;
      console.log(`PDF loaded successfully in ${duration.toFixed(2)}ms. Pages: ${pdfDoc.numPages}`);
      
      return pdfDoc;
    } catch (error) {
      const duration = performance.now() - startTime;
      const pdfError: PDFServiceError = {
        type: 'LOADING_FAILED',
        message: `Failed to load PDF after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('PDF loading error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Get a specific page from the PDF document
   */
  static async getPage(pdfDoc: PDFDocumentProxy, pageNumber: number): Promise<PDFPageProxy> {
    const startTime = performance.now();
    const cacheKey = `${pdfDoc.fingerprints[0]}-page-${pageNumber}`;
    
    try {
      // Check cache first
      if (this.loadedPages.has(cacheKey)) {
        return this.loadedPages.get(cacheKey)!;
      }

      if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
        throw new Error(`Invalid page number: ${pageNumber}. Document has ${pdfDoc.numPages} pages.`);
      }

      const page = await pdfDoc.getPage(pageNumber);
      
      // Cache the page
      this.loadedPages.set(cacheKey, page);

      const duration = performance.now() - startTime;
      console.log(`Page ${pageNumber} loaded in ${duration.toFixed(2)}ms`);
      
      return page;
    } catch (error) {
      const duration = performance.now() - startTime;
      const pdfError: PDFServiceError = {
        type: 'LOADING_FAILED',
        message: `Failed to load page ${pageNumber} after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('Page loading error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Render page to canvas with proper scaling
   */
  static async renderPageToCanvas(
    page: PDFPageProxy, 
    canvas: HTMLCanvasElement, 
    scale: number = 1
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      const duration = performance.now() - startTime;
      console.log(`Page rendered to canvas in ${duration.toFixed(2)}ms (${viewport.width}x${viewport.height})`);
    } catch (error) {
      const duration = performance.now() - startTime;
      const pdfError: PDFServiceError = {
        type: 'RENDERING_FAILED',
        message: `Failed to render page to canvas after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('Canvas rendering error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Extract text content from a page
   */
  static async extractTextContent(page: PDFPageProxy): Promise<string> {
    try {
      const textContent = await page.getTextContent();
      return textContent.items
        .map((item: any) => 'str' in item ? item.str : '')
        .join(' ');
    } catch (error) {
      const pdfError: PDFServiceError = {
        type: 'PARSING_FAILED',
        message: `Failed to extract text content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('Text extraction error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Extract form fields from a page using annotation layer
   */
  static async extractFormFields(page: PDFPageProxy) {
    try {
      const annotations = await page.getAnnotations({ intent: 'display' });
      const formFields = [];

      for (const annotation of annotations) {
        if (annotation.subtype === 'Widget') {
          const field = {
            name: annotation.fieldName || `field_${annotation.id}`,
            type: annotation.fieldType || 'unknown',
            value: annotation.fieldValue || '',
            required: !annotation.readOnly && (annotation.required || false),
            readOnly: annotation.readOnly || false,
            page: page.pageNumber,
            rect: annotation.rect,
            options: annotation.options || null,
            multiline: annotation.multiLine || false,
            maxLength: annotation.maxLen || null,
            id: annotation.id,
            subtype: annotation.subtype
          };
          formFields.push(field);
        }
      }

      console.log(`Extracted ${formFields.length} form fields from page ${page.pageNumber}`);
      return formFields;
    } catch (error) {
      const pdfError: PDFServiceError = {
        type: 'PARSING_FAILED',
        message: `Failed to extract form fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('Form field extraction error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Generate thumbnail for a page
   */
  static async generateThumbnail(
    page: PDFPageProxy, 
    maxWidth: number = 150
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      const viewport = page.getViewport({ scale: 1 });
      const scale = maxWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context for thumbnail');
      }

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;

      const thumbnailDataUrl = canvas.toDataURL('image/png');
      
      const duration = performance.now() - startTime;
      console.log(`Thumbnail generated in ${duration.toFixed(2)}ms (${canvas.width}x${canvas.height})`);
      
      return thumbnailDataUrl;
    } catch (error) {
      const duration = performance.now() - startTime;
      const pdfError: PDFServiceError = {
        type: 'RENDERING_FAILED',
        message: `Failed to generate thumbnail after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      console.error('Thumbnail generation error:', pdfError);
      throw pdfError;
    }
  }

  /**
   * Preload adjacent pages for smooth navigation
   */
  static async preloadAdjacentPages(
    pdfDoc: PDFDocumentProxy, 
    currentPage: number, 
    range: number = 1
  ): Promise<void> {
    const pagesToPreload = [];
    
    for (let i = Math.max(1, currentPage - range); i <= Math.min(pdfDoc.numPages, currentPage + range); i++) {
      if (i !== currentPage) {
        pagesToPreload.push(i);
      }
    }

    const preloadPromises = pagesToPreload.map(async (pageNum) => {
      try {
        await this.getPage(pdfDoc, pageNum);
        console.log(`Preloaded page ${pageNum}`);
      } catch (error) {
        console.warn(`Failed to preload page ${pageNum}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Clean up cached resources
   */
  static cleanup(documentUrl?: string): void {
    if (documentUrl) {
      this.loadedDocuments.delete(documentUrl);
      // Clean up related pages
      const keysToDelete = Array.from(this.loadedPages.keys()).filter(key => key.includes(documentUrl));
      keysToDelete.forEach(key => this.loadedPages.delete(key));
    } else {
      // Clean up all cached resources
      this.loadedDocuments.clear();
      this.loadedPages.clear();
    }
    
    console.log('PDF service cache cleaned up');
  }

  /**
   * Get default PDF URL from environment or URL parameter
   */
  static getDefaultPDFUrl(): string {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const pdfParam = urlParams.get('f') || urlParams.get('file') || urlParams.get('pdf');
    
    if (pdfParam) {
      // Resolve relative paths to pdfs directory
      if (!pdfParam.startsWith('http') && !pdfParam.startsWith('/')) {
        return `/pdfs/${pdfParam}`;
      }
      return pdfParam;
    }
    
    // Return default PDF from environment
    return process.env.REACT_APP_DEFAULT_PDF || '/pdfs/makana2025.pdf';
  }
}