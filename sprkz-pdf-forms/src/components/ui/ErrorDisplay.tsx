import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Error,
  Warning,
  Info,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Refresh,
  BugReport,
  NetworkCheck,
  Description,
  CloudOff,
  WifiOff
} from '@mui/icons-material';
import * as Sentry from '@sentry/react';
import { microInteractionStyles, presets } from '../../utils/microInteractions';

export type ErrorType = 
  | 'network' 
  | 'pdf_processing' 
  | 'validation' 
  | 'server' 
  | 'permission' 
  | 'timeout'
  | 'unknown';

export type ErrorSeverity = 'error' | 'warning' | 'info' | 'success';

export interface ErrorInfo {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  details?: string;
  timestamp: number;
  context?: Record<string, any>;
  actionable?: boolean;
  retryable?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

export interface ErrorDisplayProps {
  error?: ErrorInfo | null;
  errors?: ErrorInfo[];
  onClose?: (errorId: string) => void;
  onRetry?: (errorId: string) => void;
  onDismissAll?: () => void;
  showDetails?: boolean;
  maxErrors?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  variant?: 'snackbar' | 'alert' | 'dialog';
  className?: string;
}

const ERROR_ICONS: Record<ErrorType, React.ReactElement> = {
  network: <WifiOff />,
  pdf_processing: <Description />,
  validation: <Warning />,
  server: <CloudOff />,
  permission: <Error />,
  timeout: <NetworkCheck />,
  unknown: <BugReport />
};

const SEVERITY_COLORS: Record<ErrorSeverity, 'error' | 'warning' | 'info' | 'success'> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success'
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errors = [],
  onClose,
  onRetry,
  onDismissAll,
  showDetails = false,
  maxErrors = 5,
  position = 'top-right',
  variant = 'snackbar',
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Combine single error and errors array
  const allErrors = React.useMemo(() => {
    const errorList = [...errors];
    if (error) {
      errorList.unshift(error);
    }
    return errorList.slice(0, maxErrors);
  }, [error, errors, maxErrors]);

  // Auto-hide errors with autoHide flag
  useEffect(() => {
    allErrors.forEach(err => {
      if (err.autoHide && err.hideDelay) {
        const timer = setTimeout(() => {
          onClose?.(err.id);
        }, err.hideDelay);
        
        return () => clearTimeout(timer);
      }
    });
  }, [allErrors, onClose]);

  // Handle error expansion
  const handleToggleExpand = useCallback((errorId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  }, []);

  // Handle error close
  const handleClose = useCallback((errorId: string) => {
    onClose?.(errorId);
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(errorId);
      return newSet;
    });
  }, [onClose]);

  // Handle retry action
  const handleRetry = useCallback((errorId: string) => {
    console.log(`Retrying error: ${errorId}`);
    onRetry?.(errorId);
  }, [onRetry]);

  // Report error to Sentry
  const reportError = useCallback((errorInfo: ErrorInfo) => {
    try {
      Sentry.withScope(scope => {
        scope.setTag('errorType', errorInfo.type);
        scope.setTag('errorSeverity', errorInfo.severity);
        scope.setLevel(errorInfo.severity === 'error' ? 'error' : 'warning');
        
        if (errorInfo.context) {
          scope.setContext('errorContext', errorInfo.context);
        }
        
        scope.addBreadcrumb({
          message: errorInfo.title,
          data: {
            message: errorInfo.message,
            details: errorInfo.details,
            timestamp: errorInfo.timestamp
          },
          level: errorInfo.severity === 'error' ? 'error' : 'warning'
        });

        const errorToReport = new (Error as any)(`${errorInfo.title}: ${errorInfo.message}`);
        errorToReport.name = `${errorInfo.type.toUpperCase()}_ERROR`;
        
        Sentry.captureException(errorToReport);
      });

      console.group(`🚨 ${errorInfo.severity.toUpperCase()}: ${errorInfo.title}`);
      console.error('Message:', errorInfo.message);
      if (errorInfo.details) {
        console.error('Details:', errorInfo.details);
      }
      if (errorInfo.context) {
        console.error('Context:', errorInfo.context);
      }
      console.error('Timestamp:', new Date(errorInfo.timestamp).toISOString());
      console.groupEnd();
      
    } catch (reportingError) {
      console.error('Failed to report error to Sentry:', reportingError);
    }
  }, []);

  // Report all new errors
  useEffect(() => {
    allErrors.forEach(err => {
      if (err.severity === 'error') {
        reportError(err);
      }
    });
  }, [allErrors, reportError]);

  // Get user-friendly error messages
  const getErrorMessage = (errorInfo: ErrorInfo): { title: string; message: string; suggestion?: string } => {
    switch (errorInfo.type) {
      case 'network':
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection.',
          suggestion: 'Try refreshing the page or check your network connection.'
        };
      
      case 'pdf_processing':
        return {
          title: 'PDF Processing Error',
          message: 'There was a problem processing the PDF document.',
          suggestion: 'The PDF file may be corrupted or in an unsupported format.'
        };
      
      case 'validation':
        return {
          title: 'Form Validation Error',
          message: errorInfo.message || 'Please correct the highlighted fields.',
          suggestion: 'Check that all required fields are filled out correctly.'
        };
      
      case 'server':
        return {
          title: 'Server Error',
          message: 'The server encountered an unexpected error.',
          suggestion: 'Please try again in a few moments. If the problem persists, contact support.'
        };
      
      case 'permission':
        return {
          title: 'Permission Error',
          message: 'You do not have permission to perform this action.',
          suggestion: 'Contact your administrator if you believe this is an error.'
        };
      
      case 'timeout':
        return {
          title: 'Request Timeout',
          message: 'The request took too long to complete.',
          suggestion: 'Please try again. Large files may take longer to process.'
        };
      
      default:
        return {
          title: errorInfo.title || 'Unknown Error',
          message: errorInfo.message || 'An unexpected error occurred.',
          suggestion: 'Please try refreshing the page.'
        };
    }
  };

  // Render single error alert
  const renderError = (errorInfo: ErrorInfo) => {
    const { title, message, suggestion } = getErrorMessage(errorInfo);
    const isExpanded = expandedErrors.has(errorInfo.id);
    const hasDetails = Boolean(errorInfo.details || suggestion);

    return (
      <Alert
        key={errorInfo.id}
        severity={SEVERITY_COLORS[errorInfo.severity]}
        variant="filled"
        sx={{
          mb: 1,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasDetails && (
              <IconButton
                size="small"
                color="inherit"
                onClick={() => handleToggleExpand(errorInfo.id)}
                aria-label={isExpanded ? 'hide details' : 'show details'}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
            
            {errorInfo.retryable && (
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => handleRetry(errorInfo.id)}
                sx={{ 
                  borderColor: 'currentColor',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Retry
              </Button>
            )}
            
            <IconButton
              size="small"
              color="inherit"
              onClick={() => handleClose(errorInfo.id)}
              aria-label="close"
            >
              <Close />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {ERROR_ICONS[errorInfo.type]}
          {title}
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {message}
        </Typography>

        {hasDetails && (
          <Collapse in={isExpanded} timeout="auto">
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              {suggestion && (
                <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                  💡 {suggestion}
                </Typography>
              )}
              
              {errorInfo.details && (
                <Typography 
                  variant="body2" 
                  component="pre" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    p: 1,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 200
                  }}
                >
                  {errorInfo.details}
                </Typography>
              )}
              
              {showDetails && errorInfo.context && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                    Technical Details
                  </summary>
                  <Typography 
                    variant="caption" 
                    component="pre"
                    sx={{ 
                      fontSize: '0.7rem',
                      mt: 1,
                      p: 1,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: 1,
                      overflow: 'auto'
                    }}
                  >
                    {JSON.stringify(errorInfo.context, null, 2)}
                  </Typography>
                </details>
              )}
            </Box>
          </Collapse>
        )}
      </Alert>
    );
  };

  if (allErrors.length === 0) {
    return null;
  }

  // Snackbar variant for single errors
  if (variant === 'snackbar' && allErrors.length === 1) {
    const errorInfo = allErrors[0];
    const { message } = getErrorMessage(errorInfo);
    
    return (
      <Snackbar
        open={true}
        autoHideDuration={errorInfo.autoHide ? errorInfo.hideDelay : null}
        onClose={() => handleClose(errorInfo.id)}
        anchorOrigin={{
          vertical: position.includes('top') ? 'top' : 'bottom',
          horizontal: position.includes('right') ? 'right' : 'left'
        }}
        className={className}
      >
        <Alert
          severity={SEVERITY_COLORS[errorInfo.severity]}
          onClose={() => handleClose(errorInfo.id)}
          action={
            errorInfo.retryable ? (
              <Button
                size="small"
                color="inherit"
                onClick={() => handleRetry(errorInfo.id)}
              >
                Retry
              </Button>
            ) : undefined
          }
          sx={{ minWidth: isMobile ? 280 : 400 }}
        >
          <AlertTitle>{getErrorMessage(errorInfo).title}</AlertTitle>
          {message}
        </Alert>
      </Snackbar>
    );
  }

  // Dialog variant for complex error display
  if (variant === 'dialog') {
    return (
      <Dialog
        open={allErrors.length > 0}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        className={className}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Error color="error" />
              Error Details ({allErrors.length})
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allErrors.map(errorInfo => renderError(errorInfo))}
          </Box>
        </DialogContent>
        
        <DialogActions>
          {onDismissAll && (
            <Button onClick={onDismissAll} variant="outlined">
              Dismiss All
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Default alert variant
  return (
    <Box 
      className={className}
      sx={{
        position: 'fixed',
        zIndex: theme.zIndex.snackbar,
        ...(position === 'top-right' && { top: 24, right: 24 }),
        ...(position === 'top-left' && { top: 24, left: 24 }),
        ...(position === 'bottom-right' && { bottom: 24, right: 24 }),
        ...(position === 'bottom-left' && { bottom: 24, left: 24 }),
        ...(position === 'center' && { 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        }),
        maxWidth: isMobile ? '90vw' : 500,
        width: '100%'
      }}
    >
      <Paper elevation={8} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
        {/* Header for multiple errors */}
        {allErrors.length > 1 && (
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'error.main', 
            color: 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Error />
              {allErrors.length} Error{allErrors.length !== 1 ? 's' : ''} Found
            </Typography>
            
            {onDismissAll && (
              <Button 
                size="small" 
                color="inherit" 
                variant="outlined"
                onClick={onDismissAll}
                sx={{ borderColor: 'currentColor' }}
              >
                Dismiss All
              </Button>
            )}
          </Box>
        )}

        {/* Error list */}
        <Box sx={{ p: allErrors.length > 1 ? 2 : 0 }}>
          {allErrors.map(errorInfo => renderError(errorInfo))}
        </Box>
      </Paper>
    </Box>
  );
};