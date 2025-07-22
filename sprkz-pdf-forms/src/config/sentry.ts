import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Sentry configuration for error tracking and performance monitoring
export const initSentry = () => {
  // Only initialize in production or when explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
  const enableInDev = process.env.REACT_APP_SENTRY_ENABLE_DEV === 'true';

  if (!sentryDsn || (isDevelopment && !enableInDev)) {
    console.log('Sentry not initialized:', {
      hasDsn: !!sentryDsn,
      isDevelopment,
      enableInDev
    });
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.REACT_APP_VERSION || 'development',
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Capture interactions and navigation
        tracingOrigins: [
          window.location.hostname,
          /^https:\/\/api\.sprkz\.com/,
          /^https:\/\/unleash\./
        ],
        
        // React Router integration
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          // @ts-ignore - React.useEffect and useLocation will be available
          React.useEffect,
          // @ts-ignore - useLocation from react-router
          () => ({ pathname: window.location.pathname })
        ),
      }),
    ],

    // Performance sampling
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,

    // Error sampling
    sampleRate: 1.0,

    // Session sampling
    replaysSessionSampleRate: isDevelopment ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Additional configuration
    beforeSend(event, hint) {
      // Filter out development errors we don't want to track
      if (isDevelopment) {
        const error = hint.originalException;
        
        // Filter out React warnings in development
        if (error && error instanceof Error) {
          if (error.message.includes('Warning:')) {
            return null;
          }
        }
      }

      // Filter out network errors for external resources
      if (event.exception) {
        const exception = event.exception.values?.[0];
        if (exception?.value?.includes('NetworkError') || 
            exception?.value?.includes('Failed to fetch')) {
          return null;
        }
      }

      return event;
    },

    // User context
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      
      if (breadcrumb.category === 'xhr' && breadcrumb.data?.url?.includes('/health')) {
        return null;
      }

      return breadcrumb;
    },

    // Tags for better organization
    initialScope: {
      tags: {
        component: 'sprkz-pdf-forms',
        version: process.env.REACT_APP_VERSION || 'development',
      },
    },
  });

  console.log('Sentry initialized successfully', {
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT,
    release: process.env.REACT_APP_VERSION,
    tracesSampleRate: isDevelopment ? 1.0 : 0.1
  });

  return true;
};

// React Error Boundary integration
export const ErrorBoundary = Sentry.withErrorBoundary;

// Performance transaction helpers
export const performance = {
  // Start a performance transaction
  startTransaction: (name: string, op: string = 'navigation') => {
    return Sentry.startTransaction({
      name,
      op,
      tags: {
        component: 'sprkz-pdf-forms'
      }
    });
  },

  // Measure function performance
  measureFunction: async <T>(
    name: string,
    fn: () => Promise<T> | T,
    tags?: Record<string, string>
  ): Promise<T> => {
    const transaction = Sentry.startTransaction({
      name,
      op: 'function',
      tags: { component: 'sprkz-pdf-forms', ...tags }
    });

    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  },

  // Add spans to existing transaction
  addSpan: (description: string, op: string = 'http') => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      return transaction.startChild({
        description,
        op,
      });
    }
    return null;
  }
};

// PDF-specific error tracking
export const pdfErrors = {
  // Track PDF loading errors
  trackLoadError: (url: string, error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'pdf_load_error',
        pdfUrl: url
      },
      extra: {
        url,
        errorMessage: error.message
      }
    });
  },

  // Track form field extraction errors
  trackFieldExtractionError: (pdfUrl: string, error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'field_extraction_error'
      },
      extra: {
        pdfUrl,
        errorMessage: error.message
      }
    });
  },

  // Track signature creation errors
  trackSignatureError: (signatureType: string, error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'signature_error',
        signatureType
      },
      extra: {
        signatureType,
        errorMessage: error.message
      }
    });
  },

  // Track form submission errors
  trackSubmissionError: (formData: Record<string, any>, error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'form_submission_error'
      },
      extra: {
        fieldCount: Object.keys(formData).length,
        errorMessage: error.message,
        // Don't send actual form data for privacy
        hasSignature: Object.values(formData).some(v => 
          typeof v === 'object' && v?.type === 'signature'
        )
      }
    });
  }
};

// Feature flag error tracking
export const featureFlagErrors = {
  // Track feature flag initialization errors
  trackInitError: (error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'feature_flag_init_error'
      }
    });
  },

  // Track flag evaluation errors
  trackEvaluationError: (flagName: string, error: Error) => {
    Sentry.captureException(error, {
      tags: {
        errorType: 'feature_flag_evaluation_error',
        flagName
      }
    });
  }
};

// User interaction tracking
export const userInteractions = {
  // Track wizard navigation
  trackWizardNavigation: (action: 'start' | 'next' | 'back' | 'submit', fieldIndex: number) => {
    Sentry.addBreadcrumb({
      message: `Wizard ${action}`,
      category: 'user-interaction',
      data: {
        action,
        fieldIndex
      }
    });
  },

  // Track signature creation
  trackSignatureCreation: (type: 'draw' | 'type' | 'upload') => {
    Sentry.addBreadcrumb({
      message: 'Signature created',
      category: 'user-interaction',
      data: {
        signatureType: type
      }
    });
  },

  // Track form completion
  trackFormCompletion: (fieldCount: number, completionTime: number) => {
    Sentry.captureMessage('Form completed', {
      level: 'info',
      tags: {
        eventType: 'form_completion'
      },
      extra: {
        fieldCount,
        completionTimeMs: completionTime
      }
    });
  }
};

// Validation error tracking
export const validationErrors = {
  // Track validation failures
  trackValidationError: (fieldName: string, errors: string[]) => {
    Sentry.addBreadcrumb({
      message: 'Field validation failed',
      category: 'validation',
      data: {
        fieldName,
        errors
      }
    });
  },

  // Track form-wide validation issues
  trackFormValidationError: (fieldErrors: Record<string, string[]>) => {
    const errorCount = Object.keys(fieldErrors).length;
    const totalErrors = Object.values(fieldErrors).flat().length;
    
    Sentry.captureMessage('Form validation failed', {
      level: 'warning',
      tags: {
        eventType: 'form_validation_error'
      },
      extra: {
        fieldsWithErrors: errorCount,
        totalErrors,
        fieldNames: Object.keys(fieldErrors)
      }
    });
  }
};

export default Sentry;