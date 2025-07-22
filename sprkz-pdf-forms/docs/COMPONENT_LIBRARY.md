# Component Library Documentation - Sprkz PDF Forms

## Overview

This document provides comprehensive documentation for all React components in the Sprkz PDF Forms platform, including their APIs, props, usage examples, and design guidelines.

## Architecture Overview

```
src/components/
├── core/                 # Core UI components
├── forms/               # Form-specific components  
├── pdf/                 # PDF rendering components
├── wizard/              # Wizard navigation components
├── signature/           # Signature creation components
├── layout/              # Layout and structural components
└── shared/              # Shared utility components
```

---

## Core Components

### WizardButton

**File**: `src/components/core/WizardButton.tsx`

A dynamic button component that adapts its appearance and behavior based on the current wizard state and feature flags.

#### Props

```typescript
interface WizardButtonProps {
  variant: 'start' | 'next' | 'back' | 'sign' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  progress?: number;
  fieldCount?: number;
  currentField?: number;
  className?: string;
  children?: React.ReactNode;
}
```

#### Usage

```jsx
import { WizardButton } from '@/components/core/WizardButton';

// Start button
<WizardButton
  variant="start"
  onClick={handleStart}
  disabled={!pdfLoaded}
>
  Begin Form
</WizardButton>

// Navigation button with progress
<WizardButton
  variant="next"
  onClick={handleNext}
  progress={75}
  fieldCount={12}
  currentField={9}
  disabled={!isCurrentFieldValid}
/>

// Loading state
<WizardButton
  variant="submit"
  onClick={handleSubmit}
  loading={isSubmitting}
>
  Submit Form
</WizardButton>
```

#### States

- **Default**: Standard appearance for interaction
- **Hover**: Enhanced visual feedback with micro-animations
- **Active**: Pressed state with scale feedback
- **Disabled**: Muted appearance, non-interactive
- **Loading**: Spinner overlay with disabled interaction

#### Feature Flag Integration

```jsx
// Conditional button features
const { isEnabled } = useFeatureFlag('ENHANCED_WIZARD_MODE');

<WizardButton
  variant="next"
  onClick={handleNext}
  // Enhanced features only if flag is enabled
  showProgress={isEnabled}
  showFieldCounter={isEnabled}
/>
```

#### Styling

```tsx
// Theme-based styling
const WizardButton = styled(Button)<WizardButtonProps>`
  // Base styles
  ${({ theme }) => css`
    padding: ${theme.spacing(1.5, 3)};
    border-radius: ${theme.shape.borderRadius}px;
    font-weight: ${theme.typography.fontWeightMedium};
  `}
  
  // Variant-specific styles
  ${({ variant, theme }) => {
    switch (variant) {
      case 'start':
        return css`
          background: ${theme.palette.primary.main};
          color: ${theme.palette.primary.contrastText};
          &:hover { transform: translateY(-2px); }
        `;
      case 'submit':
        return css`
          background: ${theme.palette.success.main};
          color: ${theme.palette.success.contrastText};
        `;
      default:
        return css`
          background: ${theme.palette.secondary.main};
          color: ${theme.palette.secondary.contrastText};
        `;
    }
  }}
  
  // Micro-interactions
  ${interactionStyles.hoverLift}
  ${interactionStyles.clickScale}
`;
```

---

## PDF Components

### PDFViewer

**File**: `src/components/pdf/PDFViewer.tsx`

Core PDF rendering component using PDF.js with multi-layer architecture for optimal performance and interaction.

#### Props

```typescript
interface PDFViewerProps {
  document: PDFDocument;
  currentPage: number;
  scale: number;
  onPageChange: (pageNumber: number) => void;
  onFieldClick: (field: FormField) => void;
  highlightField?: string;
  showFieldOverlay?: boolean;
  className?: string;
}
```

#### Usage

```jsx
import { PDFViewer } from '@/components/pdf/PDFViewer';

<PDFViewer
  document={pdfDocument}
  currentPage={currentPage}
  scale={1.2}
  onPageChange={setCurrentPage}
  onFieldClick={handleFieldClick}
  highlightField={currentFieldName}
  showFieldOverlay={true}
/>
```

#### Layer Architecture

```jsx
// Three-layer rendering system
const PDFViewer: React.FC<PDFViewerProps> = ({ document, currentPage }) => {
  return (
    <div className="pdf-viewer">
      {/* Canvas Layer - Visual content */}
      <CanvasLayer 
        document={document}
        pageNumber={currentPage}
        scale={scale}
      />
      
      {/* Text Layer - Selection and search */}
      <TextLayer
        document={document}
        pageNumber={currentPage}
        scale={scale}
      />
      
      {/* Annotation Layer - Interactive forms */}
      <AnnotationLayer
        document={document}
        pageNumber={currentPage}
        scale={scale}
        onFieldClick={onFieldClick}
      />
      
      {/* Custom Overlay - Wizard guidance */}
      {showFieldOverlay && (
        <CustomFieldOverlay
          fields={pageFields}
          highlightField={highlightField}
        />
      )}
    </div>
  );
};
```

#### Performance Optimizations

```tsx
// Memoized rendering for performance
const MemoizedPDFViewer = memo(PDFViewer, (prevProps, nextProps) => {
  return (
    prevProps.document === nextProps.document &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.scale === nextProps.scale &&
    prevProps.highlightField === nextProps.highlightField
  );
});

// Lazy loading for large documents
const LazyPDFViewer = lazy(() => import('./PDFViewer'));

<Suspense fallback={<PDFLoadingSpinner />}>
  <LazyPDFViewer {...props} />
</Suspense>
```

### ThumbnailSidebar

**File**: `src/components/pdf/ThumbnailSidebar.tsx`

Sidebar component displaying page thumbnails for quick navigation and progress tracking.

#### Props

```typescript
interface ThumbnailSidebarProps {
  document: PDFDocument;
  currentPage: number;
  onPageClick: (pageNumber: number) => void;
  completedPages?: Set<number>;
  requiredPages?: Set<number>;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}
```

#### Usage

```jsx
<ThumbnailSidebar
  document={pdfDocument}
  currentPage={currentPage}
  onPageClick={navigateToPage}
  completedPages={completedPages}
  requiredPages={pagesWithRequiredFields}
  collapsed={sidebarCollapsed}
  onToggle={toggleSidebar}
/>
```

#### Page Indicators

```tsx
const PageThumbnail: React.FC<PageThumbnailProps> = ({ 
  pageNumber, 
  isActive, 
  isCompleted, 
  hasRequiredFields 
}) => {
  return (
    <div 
      className={cn(
        'page-thumbnail',
        isActive && 'active',
        isCompleted && 'completed'
      )}
    >
      <canvas className="thumbnail-canvas" />
      
      {/* Progress indicators */}
      {hasRequiredFields && !isCompleted && (
        <RequiredIndicator />
      )}
      
      {isCompleted && (
        <CompletedIndicator />
      )}
      
      <PageNumber>{pageNumber}</PageNumber>
    </div>
  );
};
```

---

## Form Components

### FormFieldManager

**File**: `src/components/forms/FormFieldManager.tsx`

Manages form field state, validation, and data persistence across the application.

#### Props

```typescript
interface FormFieldManagerProps {
  fields: FormField[];
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onValueChange: (fieldName: string, value: any) => void;
  onFieldFocus: (fieldName: string) => void;
  onValidationChange: (fieldName: string, errors: string[]) => void;
  validationRules?: Record<string, ValidationRule[]>;
}
```

#### Context Integration

```jsx
// Form context provider
export const FormProvider: React.FC<FormProviderProps> = ({ children }) => {
  const [formState, setFormState] = useState<FormState>({
    fields: [],
    values: {},
    errors: {},
    isValid: false,
    isDirty: false
  });

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [fieldName]: value },
      isDirty: true
    }));
  }, []);

  return (
    <FormContext.Provider value={{
      ...formState,
      updateField,
      validateField,
      resetForm
    }}>
      {children}
    </FormContext.Provider>
  );
};
```

#### Usage with Hooks

```jsx
// Custom hook for form field management
const useFormField = (fieldName: string) => {
  const { values, errors, updateField, validateField } = useFormContext();
  
  const value = values[fieldName];
  const error = errors[fieldName];
  
  const setValue = useCallback((newValue: any) => {
    updateField(fieldName, newValue);
    validateField(fieldName, newValue);
  }, [fieldName, updateField, validateField]);
  
  return {
    value,
    error,
    setValue,
    isValid: !error || error.length === 0
  };
};
```

### DynamicFormField

**File**: `src/components/forms/DynamicFormField.tsx`

Renders appropriate form field component based on field type with consistent styling and validation.

#### Props

```typescript
interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  error?: string[];
  onChange: (value: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}
```

#### Field Type Mapping

```tsx
const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ field, ...props }) => {
  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
        return <TextFormField field={field} {...props} />;
      
      case 'checkbox':
        return <CheckboxFormField field={field} {...props} />;
      
      case 'radio':
        return <RadioFormField field={field} {...props} />;
      
      case 'dropdown':
        return <DropdownFormField field={field} {...props} />;
      
      case 'signature':
        return <SignatureFormField field={field} {...props} />;
      
      default:
        console.warn(`Unknown field type: ${field.fieldType}`);
        return <TextFormField field={field} {...props} />;
    }
  };

  return (
    <FieldContainer className={props.className}>
      <FieldLabel required={field.required}>
        {field.label || field.name}
      </FieldLabel>
      
      {renderField()}
      
      {props.error && (
        <ErrorMessage errors={props.error} />
      )}
      
      {field.helpText && (
        <HelpText>{field.helpText}</HelpText>
      )}
    </FieldContainer>
  );
};
```

---

## Signature Components

### SignatureModal

**File**: `src/components/signature/SignatureModal.tsx`

Modal dialog for creating and managing digital signatures with multiple input methods.

#### Props

```typescript
interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signature: SignatureData) => void;
  field: FormField;
  currentValue?: SignatureData;
  availableMethods?: ('draw' | 'type' | 'upload')[];
}
```

#### Tab-based Interface

```jsx
<SignatureModal
  open={signatureModalOpen}
  onClose={closeSignatureModal}
  onSave={saveSignature}
  field={currentSignatureField}
  currentValue={existingSignature}
/>

// Internal tab structure
const SignatureModal: React.FC<SignatureModalProps> = ({ open, onSave, field }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <TabList>
          <Tab 
            active={activeTab === 'draw'} 
            onClick={() => setActiveTab('draw')}
          >
            Draw
          </Tab>
          <Tab 
            active={activeTab === 'type'} 
            onClick={() => setActiveTab('type')}
          >
            Type
          </Tab>
          {availableMethods?.includes('upload') && (
            <Tab 
              active={activeTab === 'upload'} 
              onClick={() => setActiveTab('upload')}
            >
              Upload
            </Tab>
          )}
        </TabList>

        <TabPanels>
          {activeTab === 'draw' && (
            <SignatureCanvas onSignature={setSignatureData} />
          )}
          
          {activeTab === 'type' && (
            <TypedSignature onSignature={setSignatureData} />
          )}
          
          {activeTab === 'upload' && (
            <SignatureUpload onSignature={setSignatureData} />
          )}
        </TabPanels>

        <ModalActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => signatureData && onSave(signatureData)}
            disabled={!signatureData}
          >
            Save Signature
          </Button>
        </ModalActions>
      </ModalContent>
    </Modal>
  );
};
```

### SignatureCanvas

**File**: `src/components/signature/SignatureCanvas.tsx`

Canvas component for drawing signatures with touch and mouse support.

#### Props

```typescript
interface SignatureCanvasProps {
  onSignature: (data: SignatureData) => void;
  width?: number;
  height?: number;
  penColor?: string;
  penWidth?: number;
  backgroundColor?: string;
  className?: string;
}
```

#### Canvas Implementation

```tsx
const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignature,
  width = 400,
  height = 200,
  penColor = '#000000',
  penWidth = 2
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Mouse events
  const handleMouseDown = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  // Touch events for mobile
  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  }, [handleMouseDown]);

  // Generate signature data
  const generateSignatureData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataURL = canvas.toDataURL('image/png');
    const signatureData: SignatureData = {
      type: 'drawing',
      data: dataURL,
      timestamp: new Date().toISOString(),
      field: fieldName
    };
    
    onSignature(signatureData);
  }, [hasSignature, onSignature]);

  return (
    <div className="signature-canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="signature-canvas"
        aria-label="Signature drawing area"
      />
      
      <CanvasControls>
        <Button onClick={clearCanvas} variant="outlined">
          Clear
        </Button>
        <PenControls>
          <ColorPicker value={penColor} onChange={setPenColor} />
          <ThicknessSlider value={penWidth} onChange={setPenWidth} />
        </PenControls>
      </CanvasControls>
    </div>
  );
};
```

---

## Wizard Components

### WizardNavigator

**File**: `src/components/wizard/WizardNavigator.tsx`

Manages wizard-style navigation through form fields with progress tracking and state management.

#### Props

```typescript
interface WizardNavigatorProps {
  fields: FormField[];
  currentFieldIndex: number;
  formValues: Record<string, any>;
  onNavigate: (direction: 'next' | 'back', targetIndex?: number) => void;
  onFieldFocus: (fieldName: string) => void;
  className?: string;
}
```

#### Navigation Logic

```tsx
const WizardNavigator: React.FC<WizardNavigatorProps> = ({
  fields,
  currentFieldIndex,
  formValues,
  onNavigate,
  onFieldFocus
}) => {
  // Get required fields only for wizard navigation
  const requiredFields = useMemo(() => 
    fields.filter(field => field.required), 
    [fields]
  );
  
  // Calculate progress
  const completedFields = useMemo(() => 
    requiredFields.filter(field => 
      formValues[field.name] !== undefined && 
      formValues[field.name] !== ''
    ).length,
    [requiredFields, formValues]
  );
  
  const progress = (completedFields / requiredFields.length) * 100;

  // Navigation handlers
  const handleNext = useCallback(() => {
    const nextIndex = findNextRequiredField(currentFieldIndex, requiredFields);
    if (nextIndex !== -1) {
      onNavigate('next', nextIndex);
      onFieldFocus(requiredFields[nextIndex].name);
    }
  }, [currentFieldIndex, requiredFields, onNavigate, onFieldFocus]);

  const handleBack = useCallback(() => {
    const prevIndex = findPreviousRequiredField(currentFieldIndex, requiredFields);
    if (prevIndex !== -1) {
      onNavigate('back', prevIndex);
      onFieldFocus(requiredFields[prevIndex].name);
    }
  }, [currentFieldIndex, requiredFields, onNavigate, onFieldFocus]);

  return (
    <WizardContainer>
      <ProgressTracker
        current={currentFieldIndex + 1}
        total={requiredFields.length}
        progress={progress}
      />
      
      <NavigationControls>
        <WizardButton
          variant="back"
          onClick={handleBack}
          disabled={currentFieldIndex === 0}
        >
          Back
        </WizardButton>
        
        <FieldCounter>
          Field {currentFieldIndex + 1} of {requiredFields.length}
        </FieldCounter>
        
        <WizardButton
          variant={currentFieldIndex === requiredFields.length - 1 ? "submit" : "next"}
          onClick={currentFieldIndex === requiredFields.length - 1 ? handleSubmit : handleNext}
          disabled={!isCurrentFieldValid}
        >
          {currentFieldIndex === requiredFields.length - 1 ? "Submit" : "Next"}
        </WizardButton>
      </NavigationControls>
    </WizardContainer>
  );
};
```

### ProgressTracker

**File**: `src/components/wizard/ProgressTracker.tsx`

Visual progress indicator showing form completion status.

#### Props

```typescript
interface ProgressTrackerProps {
  current: number;
  total: number;
  progress: number;
  showFieldCounter?: boolean;
  showPercentage?: boolean;
  className?: string;
}
```

#### Visual Implementation

```tsx
const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  current,
  total,
  progress,
  showFieldCounter = true,
  showPercentage = true
}) => {
  return (
    <ProgressContainer>
      {/* Progress bar */}
      <ProgressBar
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label={`Form completion: ${Math.round(progress)}%`}
      >
        <ProgressFill 
          width={progress}
          className={cn(
            'progress-fill',
            progress === 100 && 'completed'
          )}
        />
      </ProgressBar>
      
      {/* Progress indicators */}
      <ProgressInfo>
        {showFieldCounter && (
          <FieldCounter>
            {current} of {total} fields
          </FieldCounter>
        )}
        
        {showPercentage && (
          <PercentageDisplay>
            {Math.round(progress)}% complete
          </PercentageDisplay>
        )}
      </ProgressInfo>
      
      {/* Step indicators */}
      <StepIndicators>
        {Array.from({ length: total }, (_, index) => (
          <StepDot
            key={index}
            active={index < current}
            current={index === current - 1}
          />
        ))}
      </StepIndicators>
    </ProgressContainer>
  );
};
```

---

## Layout Components

### ApplicationLayout

**File**: `src/components/layout/ApplicationLayout.tsx`

Main layout component providing structure and responsive behavior for the entire application.

#### Props

```typescript
interface ApplicationLayoutProps {
  children: React.ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  showToolbar?: boolean;
  className?: string;
}
```

#### Layout Structure

```tsx
const ApplicationLayout: React.FC<ApplicationLayoutProps> = ({
  children,
  sidebarOpen = true,
  onSidebarToggle,
  showToolbar = true
}) => {
  return (
    <LayoutContainer>
      {/* Application header */}
      {showToolbar && (
        <ApplicationHeader>
          <HeaderContent>
            <Logo />
            <NavigationActions />
            <UserMenu />
          </HeaderContent>
        </ApplicationHeader>
      )}
      
      {/* Main content area */}
      <MainContent>
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen} 
          onToggle={onSidebarToggle}
        />
        
        {/* Content area */}
        <ContentArea sidebarOpen={sidebarOpen}>
          {children}
        </ContentArea>
      </MainContent>
      
      {/* Status bar / footer */}
      <StatusBar />
    </LayoutContainer>
  );
};
```

#### Responsive Behavior

```tsx
const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  
  ${({ theme }) => theme.breakpoints.down('md')} {
    /* Mobile layout adjustments */
    .sidebar {
      position: fixed;
      z-index: ${({ theme }) => theme.zIndex.drawer};
      transform: translateX(-100%);
      
      &.open {
        transform: translateX(0);
      }
    }
    
    .main-content {
      margin-left: 0;
    }
  }
  
  ${({ theme }) => theme.breakpoints.up('lg')} {
    /* Desktop layout optimizations */
    .sidebar {
      position: static;
      transform: none;
    }
  }
`;
```

---

## Shared Components

### LoadingSpinner

**File**: `src/components/shared/LoadingSpinner.tsx`

Reusable loading indicator with multiple variants and customizable appearance.

#### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'circular' | 'dots' | 'pulse' | 'skeleton';
  color?: string;
  overlay?: boolean;
  message?: string;
  className?: string;
}
```

#### Variants

```tsx
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'circular',
  color,
  overlay = false,
  message
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'circular':
        return <CircularSpinner size={size} color={color} />;
      
      case 'dots':
        return <DotsSpinner size={size} color={color} />;
      
      case 'pulse':
        return <PulseSpinner size={size} color={color} />;
      
      case 'skeleton':
        return <SkeletonLoader size={size} />;
      
      default:
        return <CircularSpinner size={size} color={color} />;
    }
  };

  const spinner = (
    <SpinnerContainer className={cn('loading-spinner', size, variant)}>
      {renderSpinner()}
      {message && <LoadingMessage>{message}</LoadingMessage>}
    </SpinnerContainer>
  );

  if (overlay) {
    return (
      <LoadingOverlay>
        {spinner}
      </LoadingOverlay>
    );
  }

  return spinner;
};
```

### ErrorBoundary

**File**: `src/components/shared/ErrorBoundary.tsx`

React error boundary for graceful error handling and user feedback.

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}
```

#### Implementation

```tsx
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: errorInfo }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

---

## Design System

### Theme Configuration

**File**: `src/theme/theme.ts`

Comprehensive Material-UI theme with custom design tokens.

#### Color Palette

```typescript
const palette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff'
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff'
  },
  // ... additional colors
};
```

#### Typography Scale

```typescript
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ].join(','),
  
  h1: {
    fontSize: '2.125rem',
    fontWeight: 300,
    lineHeight: 1.167
  },
  
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5
  },
  
  // ... additional styles
};
```

#### Component Overrides

```typescript
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
        fontWeight: 500
      }
    }
  },
  
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8
        }
      }
    }
  },
  
  // ... additional overrides
};
```

### Responsive Design

#### Breakpoints

```typescript
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536
  }
};
```

#### Grid System

```tsx
// Responsive grid layout
<Grid container spacing={2}>
  <Grid item xs={12} md={8}>
    <PDFViewer />
  </Grid>
  <Grid item xs={12} md={4}>
    <FormFieldPanel />
  </Grid>
</Grid>
```

---

## Usage Guidelines

### Component Composition

#### Combining Components

```jsx
// Example: Complete form interface
const FormInterface = () => {
  return (
    <ApplicationLayout sidebarOpen={sidebarOpen}>
      <ErrorBoundary onError={handleError}>
        <Grid container spacing={3}>
          {/* PDF Viewer */}
          <Grid item xs={12} lg={8}>
            <PDFViewer
              document={pdfDocument}
              currentPage={currentPage}
              onFieldClick={handleFieldClick}
            />
          </Grid>
          
          {/* Form Panel */}
          <Grid item xs={12} lg={4}>
            <FormFieldManager
              fields={formFields}
              values={formValues}
              onValueChange={handleValueChange}
            />
            
            <WizardNavigator
              fields={formFields}
              currentFieldIndex={currentFieldIndex}
              onNavigate={handleNavigate}
            />
          </Grid>
        </Grid>
        
        {/* Signature Modal */}
        <SignatureModal
          open={signatureModalOpen}
          onClose={closeSignatureModal}
          onSave={saveSignature}
          field={currentSignatureField}
        />
      </ErrorBoundary>
    </ApplicationLayout>
  );
};
```

### Accessibility Standards

#### WCAG 2.1 Compliance

```jsx
// Proper ARIA labeling
<WizardButton
  aria-label={`Navigate to next field (${currentField + 1} of ${totalFields})`}
  aria-describedby="progress-description"
  role="button"
  tabIndex={0}
/>

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      handleClick();
      event.preventDefault();
      break;
    case 'Tab':
      // Allow natural tab behavior
      break;
    default:
      break;
  }
};
```

### Performance Best Practices

#### Memoization

```tsx
// Memoize expensive components
const MemoizedPDFViewer = memo(PDFViewer, (prevProps, nextProps) => {
  return shallowEqual(prevProps, nextProps);
});

// Memoize callback functions
const handleFieldClick = useCallback((field: FormField) => {
  setCurrentField(field);
  onFieldFocus(field.name);
}, [setCurrentField, onFieldFocus]);
```

#### Lazy Loading

```tsx
// Code splitting for large components
const SignatureModal = lazy(() => import('./SignatureModal'));
const PDFViewer = lazy(() => import('./PDFViewer'));

// Conditional loading
{showSignatureModal && (
  <Suspense fallback={<LoadingSpinner />}>
    <SignatureModal {...props} />
  </Suspense>
)}
```

---

This component library documentation provides comprehensive guidance for using and extending the Sprkz PDF Forms component system. For implementation details and advanced usage patterns, refer to the individual component source files.