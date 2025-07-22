# Technical Specifications - Sprkz PDF Form Platform

## Overview

This document provides detailed technical specifications, code patterns, and implementation guidelines extracted from comprehensive research and prototyping. Use this as the authoritative technical reference for implementation details.

## Error Monitoring Architecture

### Sentry Integration

The application uses Sentry for comprehensive error monitoring, performance tracking, and issue reporting.

```typescript
// Sentry configuration
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

const sentryConfig: SentryConfig = {
  dsn: process.env.REACT_APP_SENTRY_DSN || 'https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend: (event) => {
    // Filter out development errors or sensitive information
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Event:', event);
    }
    return event;
  }
};

// Initialize Sentry
Sentry.init({
  ...sentryConfig,
  integrations: [
    new Integrations.BrowserTracing({
      // Performance monitoring for PDF operations
      tracingOrigins: ['localhost', /^https:\/\/.*\.zpaper\.com/],
    }),
  ],
  // Optional: Enable default PII collection (IP addresses, etc.)
  // sendDefaultPii: true, // Use with caution for privacy
});
```

### Error Boundary Integration

```typescript
// Enhanced error boundary with Sentry integration
import { ErrorBoundary } from '@sentry/react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>An error occurred while processing your PDF form.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            {error.toString()}
          </details>
          <button onClick={resetError} style={{ marginTop: '10px' }}>
            Try Again
          </button>
        </div>
      )}
      beforeCapture={(scope, error, errorInfo) => {
        // Add context for PDF-related errors
        scope.setTag('errorBoundary', 'AppErrorBoundary');
        scope.setContext('errorInfo', errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### PDF-Specific Error Tracking

```typescript
// Enhanced error handling for PDF operations
enum PDFErrorType {
  LOADING_FAILED = 'pdf_loading_failed',
  PARSING_FAILED = 'pdf_parsing_failed',
  FIELD_EXTRACTION_FAILED = 'field_extraction_failed',
  RENDERING_FAILED = 'pdf_rendering_failed',
  SIGNATURE_FAILED = 'signature_embedding_failed'
}

class PDFErrorHandler {
  static captureError(error: Error, type: PDFErrorType, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', type);
      scope.setLevel('error');
      
      // Add PDF-specific context
      if (context) {
        scope.setContext('pdfContext', {
          pdfUrl: context.pdfUrl,
          pageNumber: context.pageNumber,
          fieldCount: context.fieldCount,
          fileSize: context.fileSize,
          ...context
        });
      }
      
      // Add user context for better debugging
      scope.setUser({
        id: 'anonymous', // No personal data
        sessionId: context?.sessionId || 'unknown'
      });
      
      Sentry.captureException(error);
    });
  }
  
  static capturePerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: `PDF Operation: ${operation}`,
      level: 'info',
      data: {
        duration: `${duration}ms`,
        ...metadata
      }
    });
  }
}

// Usage in PDF operations
const loadPDF = async (pdfUrl: string) => {
  const startTime = performance.now();
  
  try {
    const pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
    
    const duration = performance.now() - startTime;
    PDFErrorHandler.capturePerformance('pdf_load', duration, {
      pages: pdfDoc.numPages,
      url: pdfUrl
    });
    
    return pdfDoc;
  } catch (error) {
    PDFErrorHandler.captureError(
      error as Error,
      PDFErrorType.LOADING_FAILED,
      { pdfUrl, loadTime: performance.now() - startTime }
    );
    throw error;
  }
};
```

### Performance Monitoring

```typescript
// Performance tracking for critical operations
class PerformanceTracker {
  static trackPDFOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    return Sentry.startTransaction({
      name: operationName,
      op: 'pdf.operation'
    }).finish(async (transaction) => {
      try {
        const result = await operation();
        transaction.setStatus('ok');
        return result;
      } catch (error) {
        transaction.setStatus('internal_error');
        PDFErrorHandler.captureError(
          error as Error,
          PDFErrorType.LOADING_FAILED,
          context
        );
        throw error;
      }
    });
  }
}

// Usage example
const renderPage = async (page: PDFPageProxy, pageNumber: number) => {
  return PerformanceTracker.trackPDFOperation(
    'pdf.render_page',
    async () => {
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      await page.render({ canvasContext: context, viewport }).promise;
      return canvas;
    },
    { pageNumber, operation: 'render' }
  );
};
```

### Sentry Validation Testing

**IMPORTANT**: After implementing Sentry, validate it works by temporarily adding this debug component:

```typescript
// Temporary Sentry validation (REMOVE after testing)
const SentryTestComponent: React.FC = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const button = document.createElement('button');
      button.innerHTML = 'Test Sentry';
      button.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:10px;';
      button.onclick = () => { throw new Error("My first Sentry error!"); };
      document.body.appendChild(button);
      
      return () => document.body.contains(button) && document.body.removeChild(button);
    }
  }, []);
  return null;
};

// Add temporarily to App.tsx root, then remove after validation
```

## Feature Flags Architecture

### Unleash Integration

The application uses Unleash for feature flag management, allowing for controlled feature rollouts and A/B testing.

```typescript
// Unleash client configuration
import { UnleashClient } from 'unleash-client';

interface UnleashConfig {
  url: string;
  clientKey: string;
  appName: string;
  environment: string;
  refreshInterval: number;
}

const unleashConfig: UnleashConfig = {
  url: process.env.REACT_APP_UNLEASH_URL || 'https://flags.zpaper.com/',
  clientKey: process.env.REACT_APP_UNLEASH_CLIENT_KEY || '',
  appName: 'sprkz-pdf-forms',
  environment: process.env.NODE_ENV || 'development',
  refreshInterval: 30000 // 30 seconds
};

// Initialize Unleash client
const unleash = new UnleashClient(unleashConfig);
```

### Feature Flags Context

```typescript
// Feature flags context implementation
interface FeatureFlagsContextType {
  isFeatureEnabled: (flagName: string) => boolean;
  getFeatureVariant: (flagName: string) => any;
  isReady: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  isFeatureEnabled: () => false,
  getFeatureVariant: () => null,
  isReady: false
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    unleash.on('ready', () => {
      setIsReady(true);
    });
    
    unleash.on('error', (error) => {
      console.error('Unleash error:', error);
    });
    
    return () => {
      unleash.destroy();
    };
  }, []);
  
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return unleash.isEnabled(flagName);
  }, []);
  
  const getFeatureVariant = useCallback((flagName: string): any => {
    return unleash.getVariant(flagName);
  }, []);
  
  return (
    <FeatureFlagsContext.Provider value={{ isFeatureEnabled, getFeatureVariant, isReady }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
```

### Strategic Feature Flags

```typescript
// Feature flag constants and usage patterns
export const FEATURE_FLAGS = {
  // Signature Features
  TYPED_SIGNATURE_FONTS: 'typed-signature-fonts',
  SIGNATURE_COLOR_OPTIONS: 'signature-color-options',
  ADVANCED_SIGNATURE_TOOLS: 'advanced-signature-tools',
  
  // Wizard Features  
  SMART_FIELD_NAVIGATION: 'smart-field-navigation',
  AUTO_VALIDATION: 'auto-validation',
  PROGRESS_ANALYTICS: 'progress-analytics',
  
  // PDF Processing
  ENHANCED_FIELD_DETECTION: 'enhanced-field-detection',
  BATCH_PDF_PROCESSING: 'batch-pdf-processing',
  FIELD_PREFILLING: 'field-prefilling',
  
  // UI/UX Experiments
  DARK_THEME: 'dark-theme',
  COMPACT_LAYOUT: 'compact-layout',
  ANIMATED_TRANSITIONS: 'animated-transitions',
  
  // Performance
  LAZY_PAGE_LOADING: 'lazy-page-loading',
  AGGRESSIVE_CACHING: 'aggressive-caching',
  PRELOAD_ADJACENT_PAGES: 'preload-adjacent-pages'
} as const;

// Usage example in components
const SignatureComponent: React.FC = () => {
  const { isFeatureEnabled } = useFeatureFlags();
  
  const showColorOptions = isFeatureEnabled(FEATURE_FLAGS.SIGNATURE_COLOR_OPTIONS);
  const showAdvancedFonts = isFeatureEnabled(FEATURE_FLAGS.TYPED_SIGNATURE_FONTS);
  
  return (
    <div>
      {showColorOptions && <ColorPicker />}
      {showAdvancedFonts && <AdvancedFontSelector />}
    </div>
  );
};
```

## PDF File Configuration

### Default PDF Setup

The application is configured to serve PDF files from the `public/pdfs/` directory, with `makana2025.pdf` as the default:

```typescript
// Environment configuration
const DEFAULT_PDF_URL = process.env.REACT_APP_DEFAULT_PDF || '/pdfs/makana2025.pdf';

// URL parameter handling for PDF loading
interface PDFLoadingConfig {
  defaultPdf: string;
  allowedParameters: string[];
  fallbackBehavior: 'default' | 'prompt' | 'error';
}

const pdfConfig: PDFLoadingConfig = {
  defaultPdf: DEFAULT_PDF_URL,
  allowedParameters: ['f', 'file', 'pdf'],
  fallbackBehavior: 'default'
};

// PDF URL resolution
const resolvePDFUrl = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for URL parameter (e.g., ?f=custom.pdf)
  const pdfParam = urlParams.get('f') || urlParams.get('file') || urlParams.get('pdf');
  
  if (pdfParam) {
    // Resolve relative paths to pdfs directory
    if (!pdfParam.startsWith('http') && !pdfParam.startsWith('/')) {
      return `/pdfs/${pdfParam}`;
    }
    return pdfParam;
  }
  
  // Return default PDF
  return DEFAULT_PDF_URL;
};
```

### PDF Directory Structure

```
public/
├── pdfs/
│   ├── makana2025.pdf (default)
│   ├── tremfya.pdf (additional sample)
│   └── [other PDF files as needed]
└── pdf.worker.min.js
```

### React Server Static File Serving

The React development and production servers must serve static files from the `public/pdfs/` directory:

```typescript
// Development server configuration (React dev server handles this automatically)
// public/pdfs/* files are accessible at http://localhost:7779/pdfs/*

// Production server configuration example (using serve or custom Express)
app.use('/pdfs', express.static(path.join(__dirname, 'public/pdfs')));

// Health endpoint (required for ALB)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'sprkz-pdf-forms',
    timestamp: new Date().toISOString(),
    defaultPdf: DEFAULT_PDF_URL
  });
});
```

## PDF.js Integration Architecture

### Multi-Layer Rendering System

PDF.js uses a sophisticated multi-layer approach that perfectly supports interactive forms:

1. **Canvas Layer**: Renders the visual PDF content (background)
2. **Text Layer**: Enables text selection and search
3. **Annotation Layer**: Handles interactive elements like hyperlinks, highlights, form fields, and comments
4. **Structural Layer**: Manages layout, alignment, and scaling

### Implementation Pattern

```javascript
// Multi-layer rendering implementation
const renderPage = async (page, pageContainer) => {
  const viewport = page.getViewport({ scale: 1 });
  
  // 1. Canvas Layer - Visual content
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext).promise;
  
  // 2. Text Layer - Text selection
  const textLayer = document.createElement('div');
  textLayer.className = 'textLayer';
  const textContent = await page.getTextContent();
  pdfjsLib.renderTextLayer({ 
    textContent, 
    container: textLayer, 
    viewport 
  });
  
  // 3. Annotation Layer - Interactive forms
  const annotationLayer = document.createElement('div');
  annotationLayer.className = 'annotationLayer';
  const annotations = await page.getAnnotations({ intent: "display" });
  pdfjsLib.AnnotationLayer.render({
    annotations,
    div: annotationLayer,
    page,
    viewport
  });
  
  // Append layers in correct order
  pageContainer.appendChild(canvas);
  pageContainer.appendChild(textLayer);
  pageContainer.appendChild(annotationLayer);
};
```

### PDF.js Configuration

```javascript
// PDF.js worker configuration
import * as pdfjsLib from 'pdfjs-dist';
import { AnnotationLayer } from 'pdfjs-dist/build/pdf';

// Set worker source (for React/Webpack builds)
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

// Document loading pattern
const loadPDF = async (pdfUrl) => {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  return await loadingTask.promise;
};
```

### Form Field Extraction

```javascript
// Form field extraction from annotation layer
const extractFormFields = async (page) => {
  const annotations = await page.getAnnotations({ intent: "display" });
  const formFields = [];
  
  annotations.forEach((annotation) => {
    if (annotation.subtype === 'Widget') {
      const field = {
        name: annotation.fieldName,
        type: annotation.fieldType,
        value: annotation.fieldValue || '',
        required: !annotation.readOnly && annotation.required,
        readOnly: annotation.readOnly,
        page: page.pageNumber,
        rect: annotation.rect,
        options: annotation.options || null, // For dropdowns/radio
        multiline: annotation.multiLine || false,
        maxLength: annotation.maxLen || null
      };
      formFields.push(field);
    }
  });
  
  return formFields;
};
```

## Signature Component Specifications

### Core Requirements

The signature component must support both drawing and typed signature modes with professional quality output.

### Drawing Mode Specifications

```typescript
interface SignatureCanvasProps {
  width: number;
  height: number;
  backgroundColor?: string;
  penColor?: string;
  minWidth?: number;
  maxWidth?: number;
  velocityFilterWeight?: number;
  onSignatureEnd?: (signature: string) => void;
}

interface SignatureCanvasConfig {
  // Canvas sizing that adapts to PDF signature field dimensions
  adaptiveSize: boolean;
  
  // Quality settings for high-resolution signature capture
  pixelRatio: number; // Typically 2 for retina displays
  
  // Color options (primarily black, with blue option)
  penColor: 'black' | 'blue' | string;
  
  // Stroke width adjustment for drawing signatures
  minStrokeWidth: number; // Default: 0.5
  maxStrokeWidth: number; // Default: 2.5
  
  // Performance: 60fps canvas performance requirement
  throttleRender: boolean;
}
```

### Typed Signature Specifications

```typescript
interface TypedSignatureProps {
  text: string;
  fontFamily: SignatureFontFamily;
  fontSize: number;
  color: string;
  preview: boolean;
}

enum SignatureFontFamily {
  SERIF = 'Times New Roman, serif',           // Professional serif
  SANS_SERIF = 'Arial, sans-serif',           // Professional sans-serif  
  CURSIVE_DANCING = 'Dancing Script, cursive', // Primary cursive option
  CURSIVE_PACIFICO = 'Pacifico, cursive',     // Alternative cursive
  CURSIVE_BRUSH = 'Brush Script MT, cursive', // Traditional cursive
  HANDWRITING = 'Caveat, cursive'             // Modern handwriting
}

interface FontSelectorProps {
  selectedFont: SignatureFontFamily;
  onFontChange: (font: SignatureFontFamily) => void;
  previewText: string;
}
```

### Signature Integration Patterns

```javascript
// Signature field detection and overlay
const detectSignatureFields = (formFields) => {
  return formFields.filter(field => 
    field.type === 'Sig' || 
    field.name.toLowerCase().includes('signature') ||
    field.name.toLowerCase().includes('sign')
  );
};

// Signature embedding with PDF-lib
const embedSignature = async (pdfDoc, signatureData, field) => {
  const signatureImage = await pdfDoc.embedPng(signatureData);
  const pages = pdfDoc.getPages();
  const page = pages[field.page - 1];
  
  // Calculate signature bounds from PDF field coordinates
  const { width, height } = page.getSize();
  const [x1, y1, x2, y2] = field.rect;
  
  page.drawImage(signatureImage, {
    x: x1,
    y: height - y2, // PDF coordinates are bottom-up
    width: x2 - x1,
    height: y2 - y1,
  });
};
```

## State Management Structures

### Form Field Data Model

```typescript
interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date';
  value: string | boolean | string[];
  required: boolean;
  readOnly: boolean;
  page: number;
  rect: [number, number, number, number]; // [x1, y1, x2, y2]
  isComplete: boolean;
  validationErrors: string[];
  options?: string[]; // For dropdown/radio fields
  multiline?: boolean;
  maxLength?: number;
  pattern?: string; // For validation regex
}

interface ApplicationState {
  // PDF document and rendering
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  
  // Form management
  formFields: FormField[];
  completedFields: string[];
  currentFieldIndex: number;
  
  // Wizard state
  wizardState: 'idle' | 'start' | 'navigating' | 'signing' | 'submitting';
  isFormValid: boolean;
  isSubmitted: boolean;
  
  // UI state
  sidebarOpen: boolean;
  signatureModalOpen: boolean;
  errorMessage: string | null;
  
  // Progress tracking
  completionPercentage: number;
  requiredFieldsCompleted: number;
  totalRequiredFields: number;
}
```

### Validation Service

```typescript
interface ValidationRule {
  type: 'required' | 'email' | 'date' | 'pattern' | 'minLength' | 'maxLength';
  value?: any;
  message: string;
}

interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}

class ValidationService {
  static validateField(field: FormField, rules: ValidationRule[]): FieldValidationResult {
    const errors: string[] = [];
    
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!field.value || (typeof field.value === 'string' && field.value.trim() === '')) {
            errors.push(rule.message);
          }
          break;
          
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (field.value && !emailRegex.test(field.value as string)) {
            errors.push(rule.message);
          }
          break;
          
        case 'pattern':
          if (field.value && !new RegExp(rule.value).test(field.value as string)) {
            errors.push(rule.message);
          }
          break;
          
        case 'minLength':
          if (field.value && (field.value as string).length < rule.value) {
            errors.push(rule.message);
          }
          break;
          
        case 'maxLength':
          if (field.value && (field.value as string).length > rule.value) {
            errors.push(rule.message);
          }
          break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Special handling for read-only fields (exclude from required validation)
  static getRequiredFields(fields: FormField[]): FormField[] {
    return fields.filter(field => field.required && !field.readOnly);
  }
  
  // Handle field dependencies and conditional requirements
  static validateConditionalFields(fields: FormField[]): FieldValidationResult[] {
    // Implementation for conditional field validation
    // Example: If field A is filled, then field B becomes required
    return fields.map(field => ({ isValid: true, errors: [] }));
  }
}
```

## Component Architecture

### React Component Structure

```
App
├── PDFFormContainer
│   ├── Toolbar
│   │   ├── ActionButton (Start/Next/Sign/Submit)
│   │   ├── ProgressTracker
│   │   └── ErrorDisplay
│   ├── ThumbnailSidebar
│   │   └── PageThumbnail[] (with completion indicators)
│   └── PDFViewer (PDF.js Integration)
│       ├── CanvasLayer (visual content)
│       ├── TextLayer (text selection)
│       ├── AnnotationLayer (interactive forms)
│       └── CustomFieldOverlay (highlighting/guidance)
├── SignatureModal
│   ├── SignatureCanvas (drawing mode)
│   ├── TypedSignature (text mode)
│   │   ├── FontSelector
│   │   └── SignaturePreview
│   └── SignatureControls (clear/undo/confirm)
├── FormFieldManager (tracks field states)
├── ValidationService
├── PDFProcessor (PDF-lib for final generation)
└── SubmissionService
```

### Event Handling Patterns

```javascript
// Form field event handling with annotation layer
const setupFormFieldEvents = (annotationLayer) => {
  annotationLayer.addEventListener('input', (event) => {
    const target = event.target;
    if (target.hasAttribute('data-element-id')) {
      const fieldName = target.name || target.getAttribute('data-element-id');
      const fieldValue = target.type === 'checkbox' ? target.checked : target.value;
      
      // Update field state
      updateFieldValue(fieldName, fieldValue);
      
      // Real-time validation
      validateField(fieldName);
      
      // Check wizard progression
      checkWizardProgression();
    }
  });
  
  annotationLayer.addEventListener('focus', (event) => {
    const fieldName = event.target.name;
    highlightCurrentField(fieldName);
    showFieldTooltip(fieldName);
  });
  
  annotationLayer.addEventListener('blur', (event) => {
    const fieldName = event.target.name;
    hideFieldTooltip(fieldName);
    validateField(fieldName);
  });
};
```

## Performance Requirements

### Specific Performance Targets

- **PDF Loading**: Under 3 seconds for documents up to 10MB
- **Field Navigation**: Under 100ms response time between fields
- **Signature Canvas**: 60fps performance during drawing
- **Memory Management**: Efficient handling up to 50MB PDFs
- **Initial Rendering**: Complete page render within 500ms
- **Form Validation**: Real-time validation under 10ms per field

### Performance Optimization Strategies

```javascript
// Lazy loading for large documents
const lazyLoadPages = {
  loadedPages: new Set(),
  
  async loadPage(pageNumber) {
    if (this.loadedPages.has(pageNumber)) {
      return;
    }
    
    const page = await pdfDoc.getPage(pageNumber);
    await renderPage(page);
    this.loadedPages.add(pageNumber);
  },
  
  // Preload adjacent pages
  async preloadAdjacentPages(currentPage) {
    const pagesToLoad = [currentPage - 1, currentPage + 1]
      .filter(page => page > 0 && page <= totalPages);
      
    await Promise.all(pagesToLoad.map(page => this.loadPage(page)));
  }
};

// Debounced validation for performance
const debouncedValidation = debounce((fieldName) => {
  validateField(fieldName);
  updateProgress();
}, 300);
```

## Error Handling Categories

### Error Types and Handling

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  PDF_PROCESSING_ERROR = 'pdf_processing_error', 
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  SIGNATURE_ERROR = 'signature_error'
}

interface ApplicationError {
  type: ErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
  retryAction?: () => void;
}

class ErrorHandler {
  static handleError(error: ApplicationError): void {
    // Console logging: Detailed error information for debugging
    console.error(`[${error.type}] ${error.message}`, error.details);
    
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        // Show network error with retry option
        showErrorToast('Connection failed. Please check your internet connection.', error.retryAction);
        break;
        
      case ErrorType.PDF_PROCESSING_ERROR:
        // Invalid PDF, unsupported features
        showErrorMessage('Unable to process PDF. The file may be corrupted or contain unsupported features.');
        break;
        
      case ErrorType.VALIDATION_ERROR:
        // Incomplete or invalid form data
        highlightValidationErrors(error.details);
        break;
        
      case ErrorType.SERVER_ERROR:
        // Submission failures, server responses
        showErrorToast('Server error occurred. Please try again later.', error.retryAction);
        break;
        
      case ErrorType.SIGNATURE_ERROR:
        showErrorMessage('Signature capture failed. Please try again.');
        break;
    }
  }
}
```

## Browser Support and Compatibility

### Specific Version Requirements

- **Chrome 90+** (primary target with full feature support)
- **Firefox 88+** (full compatibility with PDF.js native support)
- **Safari 14+** (desktop and mobile with touch signature support)
- **Edge 90+** (Chromium-based full compatibility)
- **Mobile browsers**: iOS Safari, Chrome Mobile (touch-optimized)

### Feature Detection

```javascript
// Browser capability detection
const browserSupport = {
  checkPDFJSSupport() {
    return typeof pdfjsLib !== 'undefined';
  },
  
  checkCanvasSupport() {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  },
  
  checkTouchSupport() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  checkFileAPISupport() {
    return window.File && window.FileReader && window.FileList && window.Blob;
  }
};
```

## Google Fonts Integration

### Font Loading Strategy

```javascript
// Google Fonts loading for signature fonts
const loadSignatureFonts = async () => {
  const fontFamilies = [
    'Dancing Script:400,700',
    'Pacifico:400',
    'Caveat:400,700'
  ];
  
  const fontPromises = fontFamilies.map(family => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
      link.rel = 'stylesheet';
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  });
  
  await Promise.all(fontPromises);
  
  // Ensure fonts are loaded before use
  await document.fonts.ready;
};
```

## PDF Generation and Submission

### PDF-lib Integration

```javascript
// Form data embedding with field configuration rules
const generateCompletedPDF = async (originalPdfBytes, formData) => {
  const pdfDoc = await PDFLib.PDFDocument.load(originalPdfBytes);
  const form = pdfDoc.getForm();
  
  // Apply field configuration rules (preserve read-only field values)
  Object.entries(formData).forEach(([fieldName, value]) => {
    try {
      const field = form.getField(fieldName);
      
      // Preserve read-only fields (don't overwrite)
      if (field.isReadOnly()) {
        return;
      }
      
      // Set field values based on type
      if (field.constructor.name === 'PDFTextField') {
        field.setText(value);
      } else if (field.constructor.name === 'PDFCheckBox') {
        if (value) field.check();
        else field.uncheck();
      } else if (field.constructor.name === 'PDFDropdown') {
        field.select(value);
      }
    } catch (error) {
      console.warn(`Could not set field ${fieldName}:`, error);
    }
  });
  
  // Generate new PDF with all field values populated (both patient-entered and pre-existing)
  // Preserve non-form content (text, images, etc.)
  return await pdfDoc.save();
};

// HTTP submission with proper error handling
const submitForm = async (formData, pdfUrl) => {
  const submissionData = {
    formData,
    pdfUrl,
    timestamp: new Date().toISOString(),
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }
  };
  
  try {
    const response = await fetch('/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new ApplicationError({
      type: ErrorType.SERVER_ERROR,
      message: 'Form submission failed',
      details: error,
      recoverable: true,
      retryAction: () => submitForm(formData, pdfUrl)
    });
  }
};
```

This technical specification document provides the detailed implementation patterns and requirements needed for successful development of the Sprkz PDF form platform.