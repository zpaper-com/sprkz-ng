import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from '../../theme/theme';

// Test providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test utilities for async operations
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 100));
};

export const flushPromises = () => {
  return new Promise((resolve) => setImmediate(resolve));
};

// Utility to create mock events
export const createMockEvent = (type: string, properties: Record<string, any> = {}) => {
  return {
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: {},
    currentTarget: {},
    ...properties,
  };
};

// Mock intersection observer entry
export const createMockIntersectionObserverEntry = (
  target: Element,
  isIntersecting: boolean = true
) => ({
  target,
  isIntersecting,
  intersectionRatio: isIntersecting ? 1 : 0,
  intersectionRect: isIntersecting ? { width: 100, height: 100 } : { width: 0, height: 0 },
  boundingClientRect: { width: 100, height: 100, top: 0, left: 0, bottom: 100, right: 100 },
  rootBounds: { width: 1024, height: 768, top: 0, left: 0, bottom: 768, right: 1024 },
  time: Date.now(),
});

// Test data generators
export const generateMockFormField = (overrides: Partial<any> = {}) => ({
  id: 'test-field-1',
  name: 'testField',
  type: 'text',
  required: false,
  readOnly: false,
  page: 1,
  rect: [0, 0, 100, 30],
  value: '',
  validationErrors: [],
  ...overrides,
});

export const generateMockPDFDocument = (pageCount: number = 3) => ({
  numPages: pageCount,
  fingerprints: ['test-fingerprint-123'],
  getPage: jest.fn().mockResolvedValue({
    pageNumber: 1,
    getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
    render: jest.fn().mockResolvedValue({}),
    getAnnotations: jest.fn().mockResolvedValue([]),
  }),
});

// Mock file utilities
export const createMockFile = (
  name: string = 'test.pdf',
  type: string = 'application/pdf',
  size: number = 1024
) => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock PDF.js utilities
export const mockPDFJS = () => {
  return {
    getDocument: jest.fn().mockResolvedValue({
      promise: Promise.resolve(generateMockPDFDocument()),
    }),
    GlobalWorkerOptions: {
      workerSrc: '/pdf.worker.min.mjs',
    },
    VerbosityLevel: {
      ERRORS: 0,
      WARNINGS: 1,
      INFOS: 5,
    },
  };
};

// Feature flags test utilities
export const createMockFeatureFlags = (overrides: Record<string, boolean> = {}) => ({
  ENHANCED_WIZARD_MODE: true,
  PROGRESSIVE_FORM_FILLING: true,
  SMART_FIELD_DETECTION: true,
  SIGNATURE_DRAWING_MODE: true,
  SIGNATURE_TYPED_MODE: true,
  SIGNATURE_UPLOAD_MODE: false,
  MULTI_SIGNATURE_SUPPORT: true,
  ADVANCED_PDF_VALIDATION: true,
  PDF_FIELD_AUTOCOMPLETE: false,
  PDF_PREVIEW_MODE: true,
  BULK_PDF_PROCESSING: false,
  DARK_MODE_SUPPORT: false,
  ACCESSIBILITY_ENHANCEMENTS: true,
  MOBILE_OPTIMIZATIONS: true,
  ANIMATION_EFFECTS: true,
  PDF_LAZY_LOADING: true,
  FORM_STATE_PERSISTENCE: true,
  OFFLINE_MODE_SUPPORT: false,
  ENHANCED_FIELD_VALIDATION: true,
  SECURITY_AUDIT_LOGGING: false,
  DATA_ENCRYPTION: false,
  USAGE_ANALYTICS: false,
  ERROR_REPORTING: true,
  PERFORMANCE_MONITORING: true,
  ...overrides,
});

// Mock signature data
export const createMockSignatureData = (type: 'canvas' | 'typed' = 'canvas') => ({
  type,
  data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  metadata: {
    width: 400,
    height: 150,
    timestamp: Date.now(),
    ...(type === 'typed' && {
      font: 'Dancing Script',
      fontSize: 32,
      text: 'John Doe',
    }),
  },
});

// Custom matchers for better assertions
export const customMatchers = {
  toBeValidPDF: (received: any) => {
    const pass = received && typeof received === 'object' && 'numPages' in received;
    return {
      message: () => `expected ${received} to be a valid PDF document`,
      pass,
    };
  },
  toBeValidSignature: (received: any) => {
    const pass = received && 
      typeof received === 'object' && 
      'type' in received && 
      'data' in received && 
      received.data.startsWith('data:image/');
    return {
      message: () => `expected ${received} to be a valid signature data object`,
      pass,
    };
  },
  toHaveValidFormField: (received: any) => {
    const pass = received && 
      typeof received === 'object' && 
      'name' in received && 
      'type' in received && 
      'page' in received;
    return {
      message: () => `expected ${received} to be a valid form field`,
      pass,
    };
  },
};

// Test setup helpers
export const setupMockLocalStorage = () => {
  const mockStorage: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => mockStorage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    },
  });
  
  return mockStorage;
};

export const setupMockCanvas = () => {
  const mockContext = {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  };

  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock-data');

  return mockContext;
};

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any> | any) => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  return {
    result,
    duration: endTime - startTime,
  };
};

export const expectPerformance = (duration: number, maxDuration: number) => {
  expect(duration).toBeLessThan(maxDuration);
};