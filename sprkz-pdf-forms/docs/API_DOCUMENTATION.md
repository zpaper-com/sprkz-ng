# Sprkz PDF Forms - API Documentation

## Overview

This document provides comprehensive API documentation for the Sprkz PDF Forms platform, covering all services, components, hooks, and utilities.

## Architecture Overview

```
src/
├── components/           # React UI Components
├── contexts/            # React Context Providers
├── hooks/               # Custom React Hooks
├── services/            # Core Business Logic Services
├── types/               # TypeScript Type Definitions
├── utils/               # Utility Functions
└── __tests__/           # Test Suites
```

---

## Services

### PDFService

**File**: `src/services/pdfService.ts`

Core service for PDF document processing, form field extraction, and PDF generation.

#### Class: PDFService

**Singleton Pattern**: Use `PDFService.getInstance()` to access the service.

##### Methods

###### `loadDocument(source: PDFSource): Promise<PDFDocument>`

Loads a PDF document from various sources.

**Parameters:**
- `source: PDFSource` - Document source configuration
  ```typescript
  type PDFSource = {
    url?: string;           // HTTP/HTTPS URL
    file?: File;           // Browser File object
    arrayBuffer?: ArrayBuffer; // Raw PDF data
  }
  ```

**Returns:** `Promise<PDFDocument>` - Loaded PDF document metadata

**Example:**
```typescript
const pdfService = PDFService.getInstance();
const document = await pdfService.loadDocument({ url: 'https://example.com/form.pdf' });
```

###### `getFormFields(document: PDFDocument): Promise<FormField[]>`

Extracts all interactive form fields from the PDF document.

**Parameters:**
- `document: PDFDocument` - Previously loaded PDF document

**Returns:** `Promise<FormField[]>` - Array of form field definitions

**Example:**
```typescript
const fields = await pdfService.getFormFields(document);
console.log(`Found ${fields.length} form fields`);
```

###### `renderPage(document: PDFDocument, pageNumber: number, options?: RenderOptions): Promise<RenderResult>`

Renders a specific PDF page to a canvas element.

**Parameters:**
- `document: PDFDocument` - PDF document to render
- `pageNumber: number` - Page number (1-based)
- `options?: RenderOptions` - Rendering configuration
  ```typescript
  type RenderOptions = {
    scale?: number;        // Rendering scale (default: 1.0)
    viewport?: Viewport;   // Custom viewport settings
    canvasContext?: CanvasRenderingContext2D; // Pre-existing canvas context
  }
  ```

**Returns:** `Promise<RenderResult>` - Rendered canvas and metadata

**Example:**
```typescript
const renderResult = await pdfService.renderPage(document, 1, { scale: 1.5 });
const canvas = renderResult.canvas;
```

###### `generateThumbnail(document: PDFDocument, pageNumber: number): Promise<string>`

Generates a thumbnail image for the specified page.

**Parameters:**
- `document: PDFDocument` - PDF document
- `pageNumber: number` - Page number (1-based)

**Returns:** `Promise<string>` - Base64-encoded thumbnail image data

**Example:**
```typescript
const thumbnailData = await pdfService.generateThumbnail(document, 1);
// Returns: "data:image/png;base64,iVBOR..."
```

###### `fillFormFields(document: PDFDocument, formData: FormData): Promise<void>`

Fills form fields with provided data.

**Parameters:**
- `document: PDFDocument` - PDF document with form fields
- `formData: FormData` - Form field values
  ```typescript
  type FormData = Record<string, any>;
  // Example: { firstName: "John", lastName: "Doe", agreeTerms: true }
  ```

**Example:**
```typescript
await pdfService.fillFormFields(document, {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com"
});
```

###### `generateFilledPDF(document: PDFDocument, formData: FormData): Promise<Uint8Array>`

Generates a new PDF with filled form data.

**Parameters:**
- `document: PDFDocument` - Original PDF document
- `formData: FormData` - Complete form data

**Returns:** `Promise<Uint8Array>` - Generated PDF as byte array

**Example:**
```typescript
const pdfBytes = await pdfService.generateFilledPDF(document, formData);
// Save or submit the generated PDF
```

#### Types

##### FormField
```typescript
interface FormField {
  name: string;           // Unique field identifier
  fieldType: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  required: boolean;      // Whether field is required
  page: number;          // Page number containing the field
  rect: [number, number, number, number]; // Field coordinates [x1, y1, x2, y2]
  options?: string[];    // Available options for dropdown/radio fields
  defaultValue?: any;    // Default field value
  validation?: ValidationRule[]; // Custom validation rules
}
```

##### PDFDocument
```typescript
interface PDFDocument {
  numPages: number;      // Total number of pages
  title?: string;        // Document title metadata
  author?: string;       // Document author
  subject?: string;      // Document subject
  keywords?: string[];   // Document keywords
  creationDate?: Date;   // Document creation date
  modificationDate?: Date; // Last modification date
}
```

---

### ValidationService

**File**: `src/services/validationService.ts`

Handles form field validation with comprehensive rule-based validation system.

#### Class: ValidationService

**Singleton Pattern**: Use `ValidationService.getInstance()` to access the service.

##### Methods

###### `validateField(field: FormField, value: any, context?: ValidationContext): ValidationResult`

Validates a single form field value.

**Parameters:**
- `field: FormField` - Field definition to validate
- `value: any` - Field value to validate
- `context?: ValidationContext` - Additional validation context
  ```typescript
  type ValidationContext = {
    allFormData?: Record<string, any>; // All form field values
    userAgent?: string;               // Browser information
    locale?: string;                  // User locale for localized validation
  }
  ```

**Returns:** `ValidationResult` - Validation outcome
```typescript
interface ValidationResult {
  isValid: boolean;      // Whether validation passed
  errors: string[];      // Array of error messages
  warnings?: string[];   // Non-blocking warnings
  suggestions?: string[]; // Helpful suggestions
}
```

**Example:**
```typescript
const validationService = ValidationService.getInstance();
const result = validationService.validateField(emailField, "invalid-email");
if (!result.isValid) {
  console.log("Validation errors:", result.errors);
}
```

###### `validateFormData(fields: FormField[], formData: Record<string, any>): FormValidationResult`

Validates complete form data against all field definitions.

**Parameters:**
- `fields: FormField[]` - Array of all form fields
- `formData: Record<string, any>` - Complete form data

**Returns:** `FormValidationResult` - Comprehensive validation results
```typescript
interface FormValidationResult {
  isValid: boolean;                    // Overall form validity
  errors: Record<string, string[]>;    // Errors by field name
  warnings: Record<string, string[]>;  // Warnings by field name
  missingRequiredFields: string[];     // Names of missing required fields
  fieldValidationResults: Record<string, ValidationResult>; // Individual field results
}
```

**Example:**
```typescript
const formResult = validationService.validateFormData(fields, formData);
if (!formResult.isValid) {
  console.log("Form has errors:", formResult.errors);
  console.log("Missing required fields:", formResult.missingRequiredFields);
}
```

###### `getValidationRules(fieldType: string): ValidationRule[]`

Retrieves default validation rules for a specific field type.

**Parameters:**
- `fieldType: string` - Type of form field

**Returns:** `ValidationRule[]` - Array of applicable validation rules

**Example:**
```typescript
const emailRules = validationService.getValidationRules('email');
// Returns rules for email format, length, etc.
```

##### Built-in Validation Rules

###### Text Fields
- **Required**: Field must have a value
- **MinLength**: Minimum character count
- **MaxLength**: Maximum character count
- **Pattern**: Regular expression validation
- **Email**: Valid email format
- **Phone**: Valid phone number format
- **URL**: Valid URL format

###### Numeric Fields
- **Min**: Minimum numeric value
- **Max**: Maximum numeric value
- **Integer**: Must be whole number
- **Decimal**: Must be valid decimal

###### Date Fields
- **DateFormat**: Valid date format
- **MinDate**: Minimum allowed date
- **MaxDate**: Maximum allowed date
- **FutureDate**: Must be in the future
- **PastDate**: Must be in the past

###### Custom Validation
```typescript
const customRule: ValidationRule = {
  name: 'customBusinessRule',
  validator: (value, field, context) => {
    // Custom validation logic
    return {
      isValid: true,
      errors: []
    };
  },
  message: 'Custom validation failed'
};
```

---

### UnleashService

**File**: `src/services/unleashService.ts`

Feature flag management service using Unleash for controlling feature visibility and behavior.

#### Class: UnleashService

**Singleton Pattern**: Use `UnleashService.getInstance(config?)` to access the service.

##### Configuration

```typescript
interface UnleashConfig {
  url: string;           // Unleash proxy URL
  clientKey: string;     // Client API key
  appName: string;       // Application name
  environment?: string;  // Environment (dev/staging/prod)
}
```

##### Methods

###### `initialize(context?: Record<string, string>): Promise<void>`

Initializes the Unleash client with optional user context.

**Parameters:**
- `context?: Record<string, string>` - User context for feature targeting
  ```typescript
  // Example context
  {
    userId: "user-123",
    email: "user@example.com",
    environment: "production",
    betaUser: "true"
  }
  ```

**Example:**
```typescript
const unleashService = UnleashService.getInstance({
  url: 'https://unleash.company.com/proxy',
  clientKey: 'your-client-key'
});

await unleashService.initialize({
  userId: currentUser.id,
  environment: process.env.NODE_ENV
});
```

###### `isEnabled(flagName: keyof FeatureFlags, context?: Record<string, string>): boolean`

Checks if a feature flag is enabled for the current user/context.

**Parameters:**
- `flagName: keyof FeatureFlags` - Name of the feature flag
- `context?: Record<string, string>` - Optional context override

**Returns:** `boolean` - Whether the feature is enabled

**Example:**
```typescript
if (unleashService.isEnabled('ENHANCED_WIZARD_MODE')) {
  // Enable enhanced wizard features
  showAdvancedNavigation();
}
```

###### `getVariant(flagName: keyof FeatureFlags, context?: Record<string, string>): any`

Gets the variant value for a feature flag (for A/B testing).

**Parameters:**
- `flagName: keyof FeatureFlags` - Name of the feature flag
- `context?: Record<string, string>` - Optional context override

**Returns:** `any` - Variant value or null if no variant

**Example:**
```typescript
const buttonColor = unleashService.getVariant('BUTTON_COLOR_TEST');
// Returns: { name: "blue", payload: { value: "#0066cc" } }
```

###### `getAllFlags(context?: Record<string, string>): FeatureFlags`

Gets all feature flags with their current states.

**Parameters:**
- `context?: Record<string, string>` - Optional context override

**Returns:** `FeatureFlags` - Object with all flag states

**Example:**
```typescript
const allFlags = unleashService.getAllFlags();
console.log('Current feature flags:', allFlags);
```

###### `getFlagsByCategory(category: keyof typeof FEATURE_CATEGORIES): Partial<FeatureFlags>`

Gets feature flags filtered by category.

**Parameters:**
- `category: keyof typeof FEATURE_CATEGORIES` - Flag category name

**Returns:** `Partial<FeatureFlags>` - Flags in the specified category

**Example:**
```typescript
const coreFlags = unleashService.getFlagsByCategory('CORE');
const experimentalFlags = unleashService.getFlagsByCategory('EXPERIMENTAL');
```

###### `subscribe(callback: (flags: FeatureFlags) => void): () => void`

Subscribes to feature flag changes.

**Parameters:**
- `callback: (flags: FeatureFlags) => void` - Callback for flag updates

**Returns:** `() => void` - Unsubscribe function

**Example:**
```typescript
const unsubscribe = unleashService.subscribe((updatedFlags) => {
  console.log('Flags updated:', updatedFlags);
  // Update UI based on new flag states
});

// Later: unsubscribe();
```

###### `updateContext(context: Record<string, string>): void`

Updates the user context for feature flag evaluation.

**Parameters:**
- `context: Record<string, string>` - New context data

**Example:**
```typescript
// User upgrades to premium
unleashService.updateContext({
  userId: user.id,
  subscriptionTier: 'premium',
  betaUser: 'true'
});
```

##### Feature Flag Categories

```typescript
const FEATURE_CATEGORIES = {
  CORE: [
    'ENHANCED_WIZARD_MODE',
    'PROGRESSIVE_FORM_FILLING',
    'SMART_FIELD_DETECTION',
    'REAL_TIME_VALIDATION'
  ],
  SIGNATURE: [
    'SIGNATURE_DRAWING_MODE',
    'SIGNATURE_TYPED_MODE',
    'SIGNATURE_UPLOAD_MODE',
    'MULTI_SIGNATURE_SUPPORT'
  ],
  EXPERIMENTAL: [
    'BULK_PDF_PROCESSING',
    'OFFLINE_MODE_SUPPORT',
    'AI_FORM_COMPLETION',
    'VOICE_INPUT_SUPPORT'
  ],
  UI_ENHANCEMENTS: [
    'ADVANCED_ANIMATIONS',
    'DARK_MODE_SUPPORT',
    'ACCESSIBILITY_ENHANCEMENTS',
    'MOBILE_OPTIMIZATIONS'
  ],
  PERFORMANCE: [
    'LAZY_LOADING_ENABLED',
    'CACHING_OPTIMIZATIONS',
    'WORKER_THREAD_PROCESSING'
  ],
  INTEGRATIONS: [
    'SENTRY_ERROR_TRACKING',
    'ANALYTICS_TRACKING',
    'EXTERNAL_API_INTEGRATION'
  ],
  SECURITY: [
    'SECURITY_AUDIT_LOGGING',
    'DATA_ENCRYPTION',
    'SESSION_TIMEOUT_ENABLED'
  ]
} as const;
```

##### Default Feature Flags

```typescript
const DEFAULT_FEATURE_FLAGS = {
  // Core Features (Production Ready)
  ENHANCED_WIZARD_MODE: true,
  PROGRESSIVE_FORM_FILLING: true,
  SMART_FIELD_DETECTION: true,
  REAL_TIME_VALIDATION: true,

  // Signature Features (Stable)
  SIGNATURE_DRAWING_MODE: true,
  SIGNATURE_TYPED_MODE: true,
  MULTI_SIGNATURE_SUPPORT: true,
  
  // Experimental Features (Disabled by Default)
  SIGNATURE_UPLOAD_MODE: false,
  BULK_PDF_PROCESSING: false,
  OFFLINE_MODE_SUPPORT: false,
  AI_FORM_COMPLETION: false,
  VOICE_INPUT_SUPPORT: false,

  // UI Enhancements (Enabled)
  ADVANCED_ANIMATIONS: true,
  DARK_MODE_SUPPORT: true,
  ACCESSIBILITY_ENHANCEMENTS: true,
  MOBILE_OPTIMIZATIONS: true,

  // Performance Optimizations (Enabled)
  LAZY_LOADING_ENABLED: true,
  CACHING_OPTIMIZATIONS: true,
  WORKER_THREAD_PROCESSING: false,

  // Integrations (Environment Dependent)
  SENTRY_ERROR_TRACKING: true,
  ANALYTICS_TRACKING: true,
  EXTERNAL_API_INTEGRATION: false,

  // Security Features (Production Only)
  SECURITY_AUDIT_LOGGING: false,
  DATA_ENCRYPTION: false,
  SESSION_TIMEOUT_ENABLED: false
} as const;
```

---

## React Contexts

### FeatureFlagsContext

**File**: `src/contexts/FeatureFlagsContext.tsx`

Provides feature flag state and functionality throughout the React component tree.

#### Provider: FeatureFlagsProvider

```typescript
interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  config?: Partial<UnleashConfig>;
  initialContext?: Record<string, string>;
}
```

**Example:**
```jsx
<FeatureFlagsProvider 
  config={{ url: 'https://unleash.example.com/proxy' }}
  initialContext={{ userId: user.id }}
>
  <App />
</FeatureFlagsProvider>
```

#### Context Interface

```typescript
interface FeatureFlagsContextType {
  isFeatureEnabled: (flagName: keyof FeatureFlags, context?: Record<string, string>) => boolean;
  getFeatureVariant: (flagName: keyof FeatureFlags, context?: Record<string, string>) => any;
  getAllFlags: (context?: Record<string, string>) => FeatureFlags;
  getFlagsByCategory: (category: keyof typeof FEATURE_CATEGORIES) => Partial<FeatureFlags>;
  updateContext: (context: Record<string, string>) => void;
  loading: boolean;
  error: Error | null;
}
```

---

## Custom Hooks

### useFeatureFlag

**File**: `src/hooks/useFeatureFlags.ts`

Hook for accessing individual feature flags.

```typescript
const useFeatureFlag = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  return {
    isEnabled: boolean;
    loading: boolean;
    error: Error | null;
  };
};
```

**Example:**
```typescript
function WizardComponent() {
  const { isEnabled } = useFeatureFlag('ENHANCED_WIZARD_MODE');
  
  return (
    <div>
      {isEnabled ? <EnhancedWizard /> : <BasicWizard />}
    </div>
  );
}
```

### useFeatureFlags

Hook for accessing multiple feature flags.

```typescript
const useFeatureFlags = (flagNames: (keyof FeatureFlags)[], context?: Record<string, string>) => {
  return {
    flags: Partial<FeatureFlags>;
    loading: boolean;
    error: Error | null;
  };
};
```

**Example:**
```typescript
function SignatureComponent() {
  const { flags } = useFeatureFlags([
    'SIGNATURE_DRAWING_MODE',
    'SIGNATURE_TYPED_MODE',
    'SIGNATURE_UPLOAD_MODE'
  ]);
  
  return (
    <div>
      {flags.SIGNATURE_DRAWING_MODE && <DrawingMode />}
      {flags.SIGNATURE_TYPED_MODE && <TypedMode />}
      {flags.SIGNATURE_UPLOAD_MODE && <UploadMode />}
    </div>
  );
}
```

### useConditionalFeature

Hook for conditional rendering based on feature flags.

```typescript
const useConditionalFeature = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  return {
    isEnabled: boolean;
    ConditionalComponent: React.ComponentType<{
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }>;
  };
};
```

**Example:**
```typescript
function MyComponent() {
  const { ConditionalComponent } = useConditionalFeature('EXPERIMENTAL_FEATURE');
  
  return (
    <ConditionalComponent fallback={<div>Feature not available</div>}>
      <ExperimentalFeature />
    </ConditionalComponent>
  );
}
```

---

## Utility Functions

### microInteractions

**File**: `src/utils/microInteractions.ts`

Provides animation keyframes and micro-interaction utilities.

#### Animation Keyframes

```typescript
export const microAnimations = {
  hoverLift: keyframes`...`,      // Hover lift effect
  pulse: keyframes`...`,          // Pulse animation
  slideIn: keyframes`...`,        // Slide in animation
  fadeIn: keyframes`...`,         // Fade in animation
  bounceIn: keyframes`...`,       // Bounce in animation
  shake: keyframes`...`,          // Shake animation for errors
  success: keyframes`...`,        // Success animation
  loading: keyframes`...`,        // Loading spinner
  progress: keyframes`...`,       // Progress bar fill
  typewriter: keyframes`...`,     // Typewriter effect
  glowPulse: keyframes`...`,      // Glow pulse effect
  slideUp: keyframes`...`,        // Slide up animation
  zoomIn: keyframes`...`,         // Zoom in animation
  ripple: keyframes`...`,         // Material ripple effect
  heartbeat: keyframes`...`       // Heartbeat animation
};
```

#### Interaction Styles

```typescript
export const interactionStyles = {
  hoverLift: css`...`,           // Hover lift interaction
  clickScale: css`...`,          // Click scale feedback  
  focusGlow: css`...`,           // Focus glow effect
  errorShake: css`...`,          // Error shake feedback
  successPulse: css`...`,        // Success pulse feedback
  loadingSpinner: css`...`,      // Loading state
  disabledState: css`...`,       // Disabled interaction
  dragHandle: css`...`,          // Drag handle styling
  tooltipTrigger: css`...`,      // Tooltip hover trigger
  buttonPress: css`...`,         // Button press feedback
  formFocus: css`...`,           // Form field focus
  cardHover: css`...`,           // Card hover effect
  modalEntrance: css`...`,       // Modal entrance animation
  toastSlide: css`...`,          // Toast notification slide
  tabTransition: css`...`        // Tab transition effect
};
```

#### Utility Functions

```typescript
// Create custom animation with timing
export const createAnimation = (
  keyframe: Keyframes,
  duration: string = '0.3s',
  easing: string = 'ease-out'
) => css`
  animation: ${keyframe} ${duration} ${easing};
`;

// Responsive animation based on motion preferences
export const respectMotionPreference = (animation: any) => css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    ${animation}
  }
`;

// Create staggered animations for lists
export const createStaggeredAnimation = (
  keyframe: Keyframes,
  delay: number = 0.1
) => css`
  ${Array.from({ length: 10 }, (_, i) => css`
    &:nth-child(${i + 1}) {
      animation-delay: ${i * delay}s;
    }
  `)}
`;
```

---

## Error Handling

### Error Types

```typescript
// PDF Processing Errors
class PDFLoadError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'PDFLoadError';
  }
}

class FormFieldExtractionError extends Error {
  constructor(message: string, public fieldName?: string) {
    super(message);
    this.name = 'FormFieldExtractionError';
  }
}

// Validation Errors
class ValidationError extends Error {
  constructor(
    message: string,
    public fieldName: string,
    public fieldValue: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Feature Flag Errors
class FeatureFlagError extends Error {
  constructor(message: string, public flagName?: string) {
    super(message);
    this.name = 'FeatureFlagError';
  }
}
```

### Error Recovery

```typescript
// Service error recovery patterns
class ErrorRecoveryService {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  }

  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      console.warn('Primary operation failed, using fallback:', error);
      return await fallback();
    }
  }
}
```

---

## Testing Utilities

### Test Helpers

**File**: `src/__tests__/utils/testUtils.tsx`

Comprehensive testing utilities and mocks.

#### Custom Render Function

```typescript
export const customRender = (
  ui: ReactElement,
  options?: RenderOptions
): RenderResult => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>
      <FeatureFlagsProvider>
        {children}
      </FeatureFlagsProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...options });
};
```

#### Mock Data Generators

```typescript
// Generate mock PDF document
export const generateMockPDFDocument = (pageCount: number = 3) => ({
  numPages: pageCount,
  title: `Mock PDF Document (${pageCount} pages)`,
  author: 'Test Author',
  subject: 'Test Subject',
  creationDate: new Date('2024-01-01'),
  modificationDate: new Date()
});

// Generate mock form field
export const generateMockFormField = (overrides: Partial<FormField> = {}) => ({
  name: 'mockField',
  fieldType: 'text' as const,
  required: false,
  page: 1,
  rect: [0, 0, 100, 20],
  ...overrides
});

// Generate mock feature flags
export const createMockFeatureFlags = (overrides: Record<string, boolean> = {}) => ({
  ENHANCED_WIZARD_MODE: true,
  SIGNATURE_DRAWING_MODE: true,
  REAL_TIME_VALIDATION: true,
  ...overrides
});
```

#### Performance Testing

```typescript
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
```

---

## Configuration

### Environment Variables

```bash
# Development
REACT_APP_UNLEASH_PROXY_URL=http://localhost:3002/proxy
REACT_APP_UNLEASH_CLIENT_KEY=development-key
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Production
REACT_APP_UNLEASH_PROXY_URL=https://unleash.company.com/proxy
REACT_APP_UNLEASH_CLIENT_KEY=production-key
REACT_APP_SENTRY_DSN=your-production-sentry-dsn
REACT_APP_API_BASE_URL=https://api.company.com
```

### Build Configuration

```json
{
  "scripts": {
    "start": "PORT=7779 react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "lint": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Best Practices

### Service Usage

1. **Always use singleton pattern** for services
2. **Handle errors gracefully** with try/catch blocks
3. **Provide fallback values** for feature flags
4. **Use TypeScript types** for better developer experience
5. **Implement proper cleanup** in useEffect hooks

### Performance Considerations

1. **Lazy load services** only when needed
2. **Cache frequently accessed data** (PDFs, form fields)
3. **Debounce validation** for real-time feedback
4. **Use Web Workers** for heavy PDF processing
5. **Implement proper memory cleanup**

### Security Guidelines

1. **Validate all user inputs** before processing
2. **Sanitize file uploads** for security
3. **Use HTTPS** for all network requests  
4. **Implement CSP headers** for XSS protection
5. **Never log sensitive data** in production

---

## Migration Guide

### Upgrading from v1.0 to v2.0

1. **Update service imports**:
   ```typescript
   // Old
   import { pdfService } from './services/pdf';
   
   // New
   import { PDFService } from './services/pdfService';
   const pdfService = PDFService.getInstance();
   ```

2. **Update feature flag usage**:
   ```typescript
   // Old
   const isEnabled = featureFlags.WIZARD_MODE;
   
   // New
   const { isEnabled } = useFeatureFlag('ENHANCED_WIZARD_MODE');
   ```

3. **Update validation calls**:
   ```typescript
   // Old
   const isValid = validateField(field, value);
   
   // New
   const validationService = ValidationService.getInstance();
   const result = validationService.validateField(field, value);
   const isValid = result.isValid;
   ```

---

This documentation covers the complete API surface of the Sprkz PDF Forms platform. For additional examples and advanced usage patterns, refer to the test files in `src/__tests__/`.