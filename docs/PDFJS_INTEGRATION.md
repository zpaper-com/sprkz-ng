# PDF.js Integration Guide for Sprkz Platform

## Overview

This document provides comprehensive guidance for integrating PDF.js into the Sprkz PDF form completion platform. Based on current best practices and compatibility requirements for React applications in 2024.

## Recommended Version & Installation

### PDF.js Version Selection
**Recommended**: `pdfjs-dist@3.11.174` (Stable LTS)
- ✅ **Proven compatibility** with React 16.8+ and 18+
- ✅ **Stable API** with extensive documentation
- ✅ **Production-ready** with known performance characteristics
- ✅ **Form field support** with complete annotation layer

**Avoid**: `pdfjs-dist@4.x` and `5.x` versions
- ❌ Known compatibility issues with React
- ❌ API breaking changes that affect form field extraction
- ❌ Worker configuration complications

### Installation Commands
```bash
# Core PDF.js library
npm install pdfjs-dist@3.11.174

# TypeScript support (if using TypeScript)
npm install --save-dev @types/pdfjs-dist
```

### Package.json Verification
```json
{
  "dependencies": {
    "pdfjs-dist": "^3.11.174"
  }
}
```

## Worker Configuration

### Critical: Worker Setup
PDF.js requires a web worker for background processing. This is **essential** for performance and prevents UI blocking during PDF parsing.

### Option 1: Static File Approach (Recommended for CRA)
```bash
# Copy worker to public directory
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
```

**Environment Configuration** (`.env`):
```bash
REACT_APP_PDF_WORKER_URL=/pdf.worker.min.js
```

**Worker Initialization**:
```typescript
// src/config/pdfjs.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.REACT_APP_PDF_WORKER_URL || '/pdf.worker.min.js';

export default pdfjsLib;
```

### Option 2: Dynamic Import (Advanced)
```typescript
import * as pdfjsLib from 'pdfjs-dist';

// For modern bundlers with dynamic import support
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();
```

### Verification Script
```typescript
// Test worker configuration
const testWorker = async () => {
  try {
    const pdf = await pdfjsLib.getDocument('/pdfs/test.pdf').promise;
    console.log('✅ PDF.js worker configured correctly');
    pdf.destroy();
  } catch (error) {
    console.error('❌ PDF.js worker configuration failed:', error);
  }
};
```

## Multi-Layer Rendering Architecture

### PDF.js Rendering Layers
PDF.js uses a **four-layer rendering system** for complete PDF display and interaction:

1. **Canvas Layer**: Visual content rendering
2. **Text Layer**: Text selection and search capabilities
3. **Annotation Layer**: Interactive form fields and links
4. **Structural Layer**: Container for proper alignment and scaling

### Core Service Implementation

```typescript
// src/services/pdfService.ts
import * as pdfjsLib from 'pdfjs-dist';

interface PDFPageRenderOptions {
  scale?: number;
  rotation?: number;
}

export class PDFService {
  private pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;

  async loadPDF(pdfUrl: string): Promise<pdfjsLib.PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      // Enhanced loading options
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      // Disable text layer for performance if not needed
      useSystemFonts: true
    });

    this.pdfDocument = await loadingTask.promise;
    return this.pdfDocument;
  }

  async renderPage(
    pageNumber: number, 
    canvasElement: HTMLCanvasElement,
    options: PDFPageRenderOptions = {}
  ): Promise<void> {
    if (!this.pdfDocument) throw new Error('PDF not loaded');

    const page = await this.pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ 
      scale: options.scale || 1.0,
      rotation: options.rotation || 0
    });

    // Configure canvas
    const context = canvasElement.getContext('2d')!;
    canvasElement.width = viewport.width;
    canvasElement.height = viewport.height;

    // Render canvas layer
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
  }

  async getTextContent(pageNumber: number): Promise<pdfjsLib.TextContent> {
    if (!this.pdfDocument) throw new Error('PDF not loaded');
    
    const page = await this.pdfDocument.getPage(pageNumber);
    return await page.getTextContent();
  }

  async getAnnotations(pageNumber: number): Promise<pdfjsLib.Annotation[]> {
    if (!this.pdfDocument) throw new Error('PDF not loaded');
    
    const page = await this.pdfDocument.getPage(pageNumber);
    return await page.getAnnotations({ intent: 'display' });
  }

  cleanup(): void {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
  }
}
```

## Form Field Extraction & Interaction

### Form Field Types Supported
- **Text Fields**: `fieldType: "Tx"` - Single/multi-line text input
- **Checkboxes**: `fieldType: "Btn"` with `checkBox: true`
- **Radio Buttons**: `fieldType: "Btn"` with `radioButton: true` 
- **Dropdowns**: `fieldType: "Ch"` with `combo: true`
- **List Boxes**: `fieldType: "Ch"` with `combo: false`
- **Signature Fields**: `fieldType: "Sig"`

### Form Field Service Implementation

```typescript
// src/services/formFieldService.ts
import * as pdfjsLib from 'pdfjs-dist';

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  value: string | boolean | null;
  required: boolean;
  readOnly: boolean;
  rect: number[]; // [x1, y1, x2, y2]
  page: number;
  options?: string[]; // For dropdowns
}

export class FormFieldService {
  async extractFormFields(
    pdfDocument: pdfjsLib.PDFDocumentProxy
  ): Promise<FormField[]> {
    const fields: FormField[] = [];
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const annotations = await page.getAnnotations({ intent: 'display' });

      for (const annotation of annotations) {
        if (this.isFormField(annotation)) {
          const field = this.convertAnnotationToFormField(annotation, pageNum);
          if (field) {
            fields.push(field);
          }
        }
      }
    }

    return fields;
  }

  private isFormField(annotation: pdfjsLib.Annotation): boolean {
    return ['text', 'checkbox', 'radiobutton', 'combobox', 'listbox', 'signature']
      .includes(annotation.fieldType?.toLowerCase() || '');
  }

  private convertAnnotationToFormField(
    annotation: pdfjsLib.Annotation, 
    pageNumber: number
  ): FormField | null {
    const fieldType = this.getFieldType(annotation);
    if (!fieldType) return null;

    return {
      id: annotation.id || `field_${pageNumber}_${annotation.fieldName}`,
      name: annotation.fieldName || `unnamed_${annotation.id}`,
      type: fieldType,
      value: this.getFieldValue(annotation),
      required: !annotation.readOnly && this.isRequired(annotation),
      readOnly: annotation.readOnly || false,
      rect: annotation.rect,
      page: pageNumber,
      options: this.getFieldOptions(annotation)
    };
  }

  private getFieldType(annotation: pdfjsLib.Annotation): FormField['type'] | null {
    const fieldType = annotation.fieldType?.toLowerCase();
    
    switch (fieldType) {
      case 'tx': return 'text';
      case 'btn':
        if (annotation.checkBox) return 'checkbox';
        if (annotation.radioButton) return 'radio';
        return null;
      case 'ch':
        return annotation.combo ? 'dropdown' : 'dropdown';
      case 'sig': return 'signature';
      default: return null;
    }
  }

  private getFieldValue(annotation: pdfjsLib.Annotation): string | boolean | null {
    if (annotation.fieldType === 'Btn') {
      return annotation.checkBox || annotation.radioButton ? 
        (annotation.fieldValue === 'On' || annotation.fieldValue === true) : false;
    }
    return annotation.fieldValue || null;
  }

  private isRequired(annotation: pdfjsLib.Annotation): boolean {
    // Check PDF form flags for required status
    return (annotation.fieldFlags & 2) !== 0; // Required flag
  }

  private getFieldOptions(annotation: pdfjsLib.Annotation): string[] | undefined {
    if (annotation.fieldType === 'Ch' && annotation.options) {
      return annotation.options.map((option: any) => 
        typeof option === 'string' ? option : option.displayValue || option.exportValue
      );
    }
    return undefined;
  }

  categorizeFields(fields: FormField[]): {
    required: FormField[];
    optional: FormField[];
    signatures: FormField[];
  } {
    return {
      required: fields.filter(f => f.required && f.type !== 'signature'),
      optional: fields.filter(f => !f.required && f.type !== 'signature'),
      signatures: fields.filter(f => f.type === 'signature')
    };
  }
}
```

## Coordinate Transformation & Viewport Handling

### Understanding PDF Coordinate System
- **PDF Origin**: Bottom-left (0, 0)
- **Canvas Origin**: Top-left (0, 0)
- **PDF.js**: Automatically handles coordinate transformation

### Viewport Configuration
```typescript
// src/utils/pdfViewport.ts
export class PDFViewportManager {
  static calculateOptimalScale(
    page: pdfjsLib.PDFPageProxy, 
    containerWidth: number, 
    containerHeight: number
  ): number {
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    
    const scaleX = containerWidth / unscaledViewport.width;
    const scaleY = containerHeight / unscaledViewport.height;
    
    // Use the smaller scale to ensure page fits in container
    return Math.min(scaleX, scaleY, 2.0); // Max scale of 2.0 for performance
  }

  static createViewport(
    page: pdfjsLib.PDFPageProxy, 
    scale: number, 
    rotation: number = 0
  ): pdfjsLib.PageViewport {
    return page.getViewport({ scale, rotation });
  }

  static convertPDFRectToScreenRect(
    pdfRect: number[], 
    viewport: pdfjsLib.PageViewport
  ): DOMRect {
    const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(pdfRect);
    
    return new DOMRect(
      Math.min(x1, x2),
      Math.min(y1, y2),
      Math.abs(x2 - x1),
      Math.abs(y2 - y1)
    );
  }
}
```

## Performance Optimization

### Memory Management
```typescript
// src/hooks/usePDFCleanup.ts
import { useEffect, useRef } from 'react';

export const usePDFCleanup = () => {
  const cleanupTasks = useRef<(() => void)[]>([]);

  const addCleanupTask = (task: () => void) => {
    cleanupTasks.current.push(task);
  };

  const cleanup = () => {
    cleanupTasks.current.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    cleanupTasks.current = [];
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return { addCleanupTask, cleanup };
};
```

### Canvas Size Management for Mobile
```typescript
// src/utils/canvasUtils.ts
export const getOptimalCanvasSize = (viewport: pdfjsLib.PageViewport) => {
  // Mobile browsers have canvas size limitations
  const MAX_CANVAS_SIZE = 16384; // 16k x 16k pixel limit
  const MAX_CANVAS_AREA = 268435456; // 256MB memory limit
  
  const originalWidth = viewport.width;
  const originalHeight = viewport.height;
  const originalArea = originalWidth * originalHeight;

  // Check area constraint
  if (originalArea > MAX_CANVAS_AREA) {
    const scale = Math.sqrt(MAX_CANVAS_AREA / originalArea);
    return {
      width: Math.floor(originalWidth * scale),
      height: Math.floor(originalHeight * scale),
      scale: scale
    };
  }

  // Check dimension constraints
  if (originalWidth > MAX_CANVAS_SIZE || originalHeight > MAX_CANVAS_SIZE) {
    const scale = Math.min(
      MAX_CANVAS_SIZE / originalWidth,
      MAX_CANVAS_SIZE / originalHeight
    );
    return {
      width: Math.floor(originalWidth * scale),
      height: Math.floor(originalHeight * scale),
      scale: scale
    };
  }

  return {
    width: originalWidth,
    height: originalHeight,
    scale: 1.0
  };
};
```

### Lazy Page Loading
```typescript
// src/hooks/useLazyPageLoading.ts
import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export const useLazyPageLoading = (
  pdfDocument: pdfjsLib.PDFDocumentProxy | null,
  visiblePageNumbers: number[]
) => {
  const [loadedPages, setLoadedPages] = useState<Map<number, pdfjsLib.PDFPageProxy>>(new Map());
  const loadingPages = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!pdfDocument) return;

    const loadPages = async () => {
      for (const pageNum of visiblePageNumbers) {
        if (!loadedPages.has(pageNum) && !loadingPages.current.has(pageNum)) {
          loadingPages.current.add(pageNum);
          
          try {
            const page = await pdfDocument.getPage(pageNum);
            setLoadedPages(prev => new Map(prev).set(pageNum, page));
          } catch (error) {
            console.error(`Failed to load page ${pageNum}:`, error);
          } finally {
            loadingPages.current.delete(pageNum);
          }
        }
      }
    };

    loadPages();
  }, [pdfDocument, visiblePageNumbers]);

  return loadedPages;
};
```

## Error Handling & Edge Cases

### Comprehensive Error Handling
```typescript
// src/utils/pdfErrorHandler.ts
export enum PDFErrorType {
  PASSWORD_REQUIRED = 'PasswordException',
  INVALID_PDF = 'InvalidPDFException',
  MISSING_PDF = 'MissingPDFException',
  NETWORK_ERROR = 'NetworkException',
  UNSUPPORTED_FEATURE = 'UnsupportedFeature'
}

export const handlePDFError = (error: any): {
  type: PDFErrorType;
  message: string;
  recoverable: boolean;
} => {
  if (error.name === PDFErrorType.PASSWORD_REQUIRED) {
    return {
      type: PDFErrorType.PASSWORD_REQUIRED,
      message: 'This PDF is password-protected. Please provide the password.',
      recoverable: true
    };
  }

  if (error.name === PDFErrorType.INVALID_PDF) {
    return {
      type: PDFErrorType.INVALID_PDF,
      message: 'This file is not a valid PDF document.',
      recoverable: false
    };
  }

  if (error.name === PDFErrorType.MISSING_PDF) {
    return {
      type: PDFErrorType.MISSING_PDF,
      message: 'The PDF file could not be found.',
      recoverable: true
    };
  }

  if (error.message?.includes('fetch')) {
    return {
      type: PDFErrorType.NETWORK_ERROR,
      message: 'Network error while loading PDF. Please check your connection.',
      recoverable: true
    };
  }

  return {
    type: PDFErrorType.UNSUPPORTED_FEATURE,
    message: 'An error occurred while processing the PDF.',
    recoverable: false
  };
};
```

## Integration Checklist

### Pre-Implementation Checklist
- [ ] **PDF.js version**: Installed `pdfjs-dist@3.11.174`
- [ ] **Worker setup**: PDF worker copied to public directory
- [ ] **Environment variables**: `REACT_APP_PDF_WORKER_URL` configured
- [ ] **TypeScript types**: `@types/pdfjs-dist` installed (if using TypeScript)

### Implementation Checklist
- [ ] **PDF Service**: Core PDF loading and rendering service created
- [ ] **Form Field Service**: Form field extraction and categorization
- [ ] **Viewport Manager**: Coordinate transformation utilities
- [ ] **Error Handling**: Comprehensive error handling for all PDF operations
- [ ] **Memory Management**: Cleanup hooks and memory management
- [ ] **Performance**: Canvas size optimization for mobile devices

### Testing Checklist
- [ ] **PDF Loading**: Test with various PDF types and sizes
- [ ] **Form Fields**: Verify extraction of all supported field types
- [ ] **Rendering**: Test multi-layer rendering system
- [ ] **Error Cases**: Test invalid PDFs, network errors, password-protected files
- [ ] **Performance**: Test with large PDFs (>10MB) on mobile devices
- [ ] **Memory**: Verify cleanup and memory management

## Common Pitfalls to Avoid

1. **Version Mismatch**: Always use matching versions of pdfjs-dist and worker
2. **Worker Path Issues**: Ensure worker is accessible from the configured URL
3. **Memory Leaks**: Always call `pdf.destroy()` when done with PDF documents
4. **Canvas Size Limits**: Respect mobile browser canvas memory limitations
5. **Coordinate Confusion**: Remember PDF.js handles coordinate transformation
6. **Form Field Detection**: Not all PDF forms use standard form field annotations
7. **SSR Issues**: PDF.js is client-side only, use dynamic imports for SSR frameworks

## Testing Strategy

### Unit Tests
```typescript
// __tests__/pdfService.test.ts
import { PDFService } from '../src/services/pdfService';

describe('PDFService', () => {
  let pdfService: PDFService;

  beforeEach(() => {
    pdfService = new PDFService();
  });

  afterEach(() => {
    pdfService.cleanup();
  });

  test('should load PDF successfully', async () => {
    const pdf = await pdfService.loadPDF('/pdfs/test.pdf');
    expect(pdf.numPages).toBeGreaterThan(0);
  });

  test('should extract form fields', async () => {
    await pdfService.loadPDF('/pdfs/form-test.pdf');
    const fields = await pdfService.extractFormFields();
    expect(Array.isArray(fields)).toBe(true);
  });
});
```

### Integration Tests
- Test complete PDF loading and rendering workflow
- Verify form field extraction with real PDF documents
- Test error handling with invalid files
- Performance testing with large documents

This comprehensive integration guide provides everything needed to successfully implement PDF.js in the Sprkz platform with proper architecture, performance optimization, and error handling.