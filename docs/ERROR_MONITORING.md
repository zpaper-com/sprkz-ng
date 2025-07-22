# Error Monitoring Documentation

## Overview

Sprkz uses Sentry for comprehensive error monitoring, performance tracking, and debugging capabilities throughout the PDF form completion platform.

## Configuration

- **Package**: `@sentry/react` and `@sentry/tracing`
- **Environment Variable**: `REACT_APP_SENTRY_DSN`
- **Performance Monitoring**: Enabled with custom PDF operation tracking

## Implementation Strategy

### Core Error Categories

#### PDF Processing Errors
- `pdf_loading_failed` - PDF document loading failures
- `pdf_parsing_failed` - PDF structure parsing issues
- `field_extraction_failed` - Form field detection failures
- `pdf_rendering_failed` - PDF page rendering issues
- `signature_embedding_failed` - Signature insertion problems

#### Application Errors
- `wizard_navigation_failed` - Wizard step progression issues
- `validation_failed` - Form validation errors
- `feature_flag_failed` - Feature flag service issues
- `ui_component_failed` - React component rendering errors

#### Network Errors
- `pdf_fetch_failed` - PDF URL loading issues
- `form_submission_failed` - Server submission failures
- `unleash_connection_failed` - Feature flag service connectivity

### Sentry Configuration

```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || 'https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120',
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      new Integrations.BrowserTracing({
        tracingOrigins: [
          'localhost',
          /^https:\/\/.*\.zpaper\.com/,
          'https://flags.zpaper.com'
        ],
      }),
    ],
    
    // Optional: Enable default PII collection for better debugging
    // sendDefaultPii: true, // Use with caution - enables IP address collection
    
    beforeSend: (event, hint) => {
      // Filter sensitive information
      if (event.request?.url?.includes('pdf')) {
        // Remove potentially sensitive PDF URLs from logs
        event.request.url = '[PDF_URL_FILTERED]';
      }
      
      // Enhanced context for PDF operations
      if (hint.originalException && hint.originalException.name?.includes('PDF')) {
        event.tags = {
          ...event.tags,
          errorCategory: 'pdf_operation'
        };
      }
      
      return event;
    },
  });
};
```

### Error Boundary Implementation

```typescript
// src/components/ui/ErrorBoundary.tsx
import { ErrorBoundary } from '@sentry/react';
import { Button, Container, Typography, Alert } from '@mui/material';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetError, eventId }) => (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Application Error
            </Typography>
            <Typography variant="body2" paragraph>
              An unexpected error occurred while processing your PDF form. 
              The error has been automatically reported for investigation.
            </Typography>
            {eventId && (
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Error ID: {eventId}
              </Typography>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={resetError}
              sx={{ mr: 1 }}
            >
              Try Again
            </Button>
            <Button 
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Alert>
        </Container>
      )}
      beforeCapture={(scope, error, errorInfo) => {
        // Enhanced error context
        scope.setTag('errorBoundary', 'app');
        scope.setContext('componentStack', {
          componentStack: errorInfo.componentStack
        });
        scope.setLevel('error');
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### PDF-Specific Error Tracking

```typescript
// src/services/errorTracking.ts
import * as Sentry from '@sentry/react';

export enum ErrorType {
  PDF_LOADING = 'pdf_loading_failed',
  PDF_PARSING = 'pdf_parsing_failed', 
  FIELD_EXTRACTION = 'field_extraction_failed',
  PDF_RENDERING = 'pdf_rendering_failed',
  SIGNATURE_EMBEDDING = 'signature_embedding_failed',
  WIZARD_NAVIGATION = 'wizard_navigation_failed',
  VALIDATION = 'validation_failed',
  NETWORK = 'network_failed'
}

interface ErrorContext {
  pdfUrl?: string;
  pageNumber?: number;
  fieldCount?: number;
  fileSize?: number;
  operation?: string;
  userAgent?: string;
  sessionId?: string;
  [key: string]: any;
}

export class ErrorTracker {
  static captureError(
    error: Error, 
    type: ErrorType, 
    context?: ErrorContext
  ): void {
    Sentry.withScope((scope) => {
      // Set error classification
      scope.setTag('errorType', type);
      scope.setLevel('error');
      
      // Add PDF-specific context
      if (context) {
        scope.setContext('operationContext', {
          pdfUrl: context.pdfUrl || 'unknown',
          pageNumber: context.pageNumber || 0,
          fieldCount: context.fieldCount || 0,
          fileSize: context.fileSize ? `${context.fileSize} bytes` : 'unknown',
          operation: context.operation || 'unknown',
          timestamp: new Date().toISOString(),
          ...context
        });
      }
      
      // User context (no personal data)
      scope.setUser({
        id: context?.sessionId || 'anonymous',
        userAgent: navigator.userAgent
      });
      
      // Breadcrumb for debugging
      Sentry.addBreadcrumb({
        message: `Error in ${type}`,
        level: 'error',
        data: context
      });
      
      Sentry.captureException(error);
    });
  }
  
  static trackPerformance(
    operation: string, 
    duration: number, 
    metadata?: Record<string, any>
  ): void {
    Sentry.addBreadcrumb({
      message: `Performance: ${operation}`,
      level: 'info',
      data: {
        duration: `${duration.toFixed(2)}ms`,
        operation,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
    
    // Track slow operations
    if (duration > 3000) { // 3+ seconds
      Sentry.captureMessage(`Slow operation detected: ${operation}`, 'warning');
    }
  }
  
  static trackUserAction(action: string, metadata?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message: `User Action: ${action}`,
      level: 'info',
      category: 'user',
      data: {
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

### Performance Monitoring

```typescript
// src/utils/performanceMonitoring.ts
import * as Sentry from '@sentry/react';
import { ErrorTracker, ErrorType } from '../services/errorTracking';

export class PerformanceMonitor {
  static async trackAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: operationName,
      op: 'pdf.operation'
    });
    
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      transaction.setStatus('ok');
      transaction.setData('duration', duration);
      
      ErrorTracker.trackPerformance(operationName, duration, context);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      transaction.setStatus('internal_error');
      transaction.setData('duration', duration);
      transaction.setData('error', error.message);
      
      ErrorTracker.captureError(
        error as Error,
        ErrorType.PDF_LOADING, // Default, should be specific to operation
        { ...context, duration, operationName }
      );
      
      throw error;
    } finally {
      transaction.finish();
    }
  }
  
  static trackRenderPerformance(componentName: string, renderTime: number): void {
    if (renderTime > 100) { // Log slow renders
      ErrorTracker.trackPerformance(`render_${componentName}`, renderTime, {
        component: componentName,
        slow: renderTime > 500
      });
    }
  }
}

// Usage in React components
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const renderStartTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - renderStartTime;
      PerformanceMonitor.trackRenderPerformance(componentName, renderTime);
    });
    
    return <Component {...props} />;
  });
};
```

### Integration with Feature Flags

```typescript
// Enhanced feature flag error tracking
export const withSentryFeatureFlags = (
  originalImplementation: (flagName: string) => boolean
) => {
  return (flagName: string): boolean => {
    try {
      const result = originalImplementation(flagName);
      
      // Track feature flag usage
      Sentry.addBreadcrumb({
        message: `Feature Flag Check: ${flagName}`,
        level: 'info',
        category: 'feature_flag',
        data: { flagName, enabled: result }
      });
      
      return result;
    } catch (error) {
      ErrorTracker.captureError(
        error as Error,
        ErrorType.VALIDATION, // Could be feature_flag_error
        { flagName, operation: 'feature_flag_check' }
      );
      
      // Return safe default
      return false;
    }
  };
};
```

### Sentry Integration Testing

#### Initial Setup Validation

**CRITICAL**: After implementing Sentry configuration, validate it works by adding a temporary debug error:

```typescript
// Temporary validation component - ADD TO App.tsx INITIALLY
import React, { useEffect } from 'react';

const SentryValidationComponent: React.FC = () => {
  useEffect(() => {
    // Create temporary debug button for Sentry testing
    const testSentryError = () => {
      console.log('Testing Sentry error reporting...');
      throw new Error("My first Sentry error!");
    };
    
    // Add debug button (REMOVE AFTER VALIDATION)
    const debugButton = document.createElement('button');
    debugButton.innerHTML = 'Test Sentry Error';
    debugButton.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background-color: #ff4444;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    debugButton.onclick = testSentryError;
    document.body.appendChild(debugButton);
    
    console.log('Sentry debug button added. Click to test error reporting.');
    
    // Cleanup function
    return () => {
      if (document.body.contains(debugButton)) {
        document.body.removeChild(debugButton);
      }
    };
  }, []);
  
  return null; // This component renders nothing visible
};

// Usage in App.tsx (TEMPORARY - REMOVE AFTER VALIDATION)
function App() {
  return (
    <div className="App">
      {/* Remove SentryValidationComponent after successful validation */}
      {process.env.NODE_ENV === 'development' && <SentryValidationComponent />}
      
      {/* Your actual app components go here */}
      <h1>Sprkz PDF Forms</h1>
    </div>
  );
}
```

#### Validation Steps

1. **Add the validation component** to your App.tsx
2. **Start development server**: `npm start`
3. **Click the red "Test Sentry Error" button** in the top-right corner
4. **Check Sentry dashboard** within 30 seconds for the error report
5. **Verify error details** include:
   - Error message: "My first Sentry error!"
   - Environment: development
   - User context and breadcrumbs
   - Component stack trace
6. **REMOVE the validation component** after successful test

#### Production Testing Alternative

For production environments, use a more discrete testing approach:

```typescript
// Add to a component or utility function
const testSentryInProduction = () => {
  if (process.env.REACT_APP_SENTRY_TEST_MODE === 'true') {
    Sentry.captureMessage('Sentry production test', 'info');
    console.log('Sentry test message sent');
  }
};

// Call during app initialization in production
useEffect(() => {
  testSentryInProduction();
}, []);
```

### Unit Testing with Sentry

```typescript
// src/utils/testUtils.ts
import * as Sentry from '@sentry/react';

export const mockSentry = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback({
    setTag: jest.fn(),
    setLevel: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn()
  })),
  startTransaction: jest.fn(() => ({
    setStatus: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn()
  }))
};

// Test setup
beforeEach(() => {
  jest.clearAllMocks();
  // Mock Sentry functions
  jest.spyOn(Sentry, 'captureException').mockImplementation(mockSentry.captureException);
  jest.spyOn(Sentry, 'addBreadcrumb').mockImplementation(mockSentry.addBreadcrumb);
});

// Example test
describe('ErrorTracker', () => {
  it('should capture PDF loading errors with context', () => {
    const error = new Error('PDF failed to load');
    const context = { pdfUrl: 'test.pdf', fileSize: 1024 };
    
    ErrorTracker.captureError(error, ErrorType.PDF_LOADING, context);
    
    expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    expect(mockSentry.withScope).toHaveBeenCalled();
  });
});
```

### Production Deployment

#### Environment Configuration
```bash
# Production environment
REACT_APP_SENTRY_DSN=https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120
REACT_APP_SENTRY_ENVIRONMENT=production

# Staging environment  
REACT_APP_SENTRY_DSN=https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120
REACT_APP_SENTRY_ENVIRONMENT=staging

# Development environment (already configured in setup)
REACT_APP_SENTRY_DSN=https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120
REACT_APP_SENTRY_ENVIRONMENT=development
```

#### Release Tracking
```bash
# Create release for deployment tracking
npm install @sentry/cli
sentry-cli releases new $(git rev-parse HEAD)
sentry-cli releases set-commits $(git rev-parse HEAD) --auto
sentry-cli releases finalize $(git rev-parse HEAD)
```

### Monitoring and Alerting

#### Key Metrics to Monitor
- **PDF Loading Failures**: Alert when > 5% failure rate
- **Form Submission Errors**: Alert when > 2% failure rate  
- **Performance Degradation**: Alert when average load time > 5 seconds
- **JavaScript Errors**: Alert on new error patterns
- **Feature Flag Failures**: Alert on Unleash connectivity issues

#### Custom Dashboards
- PDF Processing Performance
- Form Completion Success Rates
- Error Distribution by Browser/Device
- Feature Flag Usage Analytics
- User Flow Analysis

This comprehensive error monitoring strategy ensures high reliability and quick issue resolution for the Sprkz PDF platform.