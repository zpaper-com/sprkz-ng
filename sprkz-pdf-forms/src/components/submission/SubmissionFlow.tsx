import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  Collapse,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Send,
  Description,
  CloudUpload,
  Done,
  Refresh,
  GetApp,
  Close
} from '@mui/icons-material';
import { useForm } from '../../contexts/FormContext';
import { useWizard } from '../../contexts/WizardContext';
import { PDFGenerationService } from '../../services/pdfGenerationService';
import { SubmissionService, SubmissionProgress, SubmissionResult } from '../../services/submissionService';
import { SignatureData } from '../signature/SignatureModal';
import * as Sentry from '@sentry/react';

export interface SubmissionFlowProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: SubmissionResult) => void;
  onError?: (errors: string[]) => void;
  signatures?: Record<string, SignatureData>;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface SubmissionState {
  stage: 'idle' | 'validating' | 'generating' | 'submitting' | 'success' | 'error';
  progress: number;
  message: string;
  details?: string;
  errors: string[];
  warnings: string[];
  submissionResult?: SubmissionResult;
  pdfGenerated: boolean;
  validationPassed: boolean;
}

const SUBMISSION_STEPS = [
  'Validate Form',
  'Generate PDF',
  'Submit Data',
  'Complete'
];

export const SubmissionFlow: React.FC<SubmissionFlowProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  signatures = {},
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const form = useForm();
  const wizard = useWizard();
  
  const [state, setState] = useState<SubmissionState>({
    stage: 'idle',
    progress: 0,
    message: 'Ready to submit',
    errors: [],
    warnings: [],
    pdfGenerated: false,
    validationPassed: false
  });

  const [showDetails, setShowDetails] = useState(false);
  const submissionStartedRef = useRef(false);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle submission process
  const handleSubmit = useCallback(async () => {
    if (submissionStartedRef.current) return;
    
    submissionStartedRef.current = true;
    
    try {
      setState(prev => ({
        ...prev,
        stage: 'validating',
        progress: 0,
        message: 'Starting submission...',
        errors: [],
        warnings: []
      }));

      // Step 1: Validate all form fields
      const validationResults = await form.validateAllFields();
      const hasValidationErrors = Object.values(validationResults).some(result => !result.isValid);

      setState(prev => ({
        ...prev,
        stage: 'validating',
        progress: 20,
        message: 'Validating form fields...',
        validationPassed: !hasValidationErrors
      }));

      if (hasValidationErrors) {
        const validationErrors = Object.entries(validationResults)
          .filter(([_, result]) => !result.isValid)
          .map(([fieldName, result]) => `${fieldName}: ${result.errors.join(', ')}`);

        setState(prev => ({
          ...prev,
          stage: 'error',
          progress: 0,
          message: 'Form validation failed',
          errors: validationErrors
        }));

        onError?.(validationErrors);
        submissionStartedRef.current = false;
        return;
      }

      // Step 2: Generate PDF with form data
      setState(prev => ({
        ...prev,
        stage: 'generating',
        progress: 40,
        message: 'Generating completed PDF...'
      }));

      // Get form fields and values
      const formFields = Array.from(form.state.fields.entries()).map(([name, fieldValue]) => ({
        name,
        type: 'text' as const, // This should be enhanced with actual field type detection
        value: fieldValue.value,
        required: form.state.requiredFields.includes(name),
        readOnly: false,
        page: fieldValue.page,
        rect: [0, 0, 100, 20] as [number, number, number, number],
        isComplete: form.state.completedFields.includes(name),
        validationErrors: fieldValue.errors,
        id: name,
        subtype: ''
      }));

      const formValues: Record<string, any> = {};
      form.state.fields.forEach((fieldValue, fieldName) => {
        formValues[fieldName] = fieldValue.value;
      });

      // This would need the original PDF bytes - for now we'll skip PDF generation
      // In a real implementation, you would get the original PDF bytes from your PDF service
      let generatedPdf: Awaited<ReturnType<typeof PDFGenerationService.generateCompletedPDF>> | undefined;
      try {
        // For demonstration, create a blank PDF
        const blankPdfBytes = await PDFGenerationService.createBlankPDF();
        generatedPdf = await PDFGenerationService.generateCompletedPDF(
          blankPdfBytes,
          formFields,
          formValues,
          signatures,
          {
            includeSignatures: Object.keys(signatures).length > 0,
            flattenForm: true,
            validateBeforeGeneration: false // Already validated above
          }
        );
      } catch (pdfError) {
        console.warn('PDF generation failed, submitting without PDF:', pdfError);
        generatedPdf = undefined;
      }

      setState(prev => ({
        ...prev,
        stage: 'generating',
        progress: 60,
        message: 'PDF generation complete',
        pdfGenerated: !!generatedPdf?.success,
        warnings: generatedPdf?.warnings || []
      }));

      // Step 3: Submit form data
      const progressCallback = (progress: SubmissionProgress) => {
        setState(prev => ({
          ...prev,
          stage: 'submitting',
          progress: 60 + (progress.progress * 0.3), // Map 0-100 to 60-90
          message: progress.message,
          details: progress.details
        }));
      };

      const submissionData = {
        formData: formValues,
        signatures,
        metadata: {
          completedAt: Date.now(),
          totalFields: formFields.length,
          requiredFields: form.state.requiredFields.length,
          completedFields: form.state.completedFields.length,
          validationPassed: true
        }
      };

      const submissionResult = await SubmissionService.submitForm(
        submissionData,
        generatedPdf,
        {}, // Use default config
        progressCallback
      );

      if (submissionResult.success) {
        setState(prev => ({
          ...prev,
          stage: 'success',
          progress: 100,
          message: 'Form submitted successfully!',
          details: submissionResult.submissionId 
            ? `Submission ID: ${submissionResult.submissionId}`
            : undefined,
          submissionResult,
          warnings: [...prev.warnings, ...submissionResult.warnings]
        }));

        onSuccess?.(submissionResult);

        // Auto-close if requested
        if (autoClose) {
          autoCloseTimeoutRef.current = setTimeout(() => {
            handleClose();
          }, autoCloseDelay);
        }

        // Track success event
        Sentry.addBreadcrumb({
          message: 'Form submission completed successfully',
          data: {
            submissionId: submissionResult.submissionId,
            duration: submissionResult.duration,
            fieldsCount: formFields.length
          },
          level: 'info'
        });

      } else {
        setState(prev => ({
          ...prev,
          stage: 'error',
          progress: 0,
          message: 'Submission failed',
          errors: submissionResult.errors,
          warnings: submissionResult.warnings,
          submissionResult
        }));

        onError?.(submissionResult.errors);
      }

    } catch (error: unknown) {
      console.error('Submission process failed:', error);
      
      const getErrorMessage = (err: unknown): string => {
        if (err instanceof Error) return (err as Error).message;
        if (typeof err === 'string') return err as string;
        return 'Unknown error occurred';
      };
      
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({
        ...prev,
        stage: 'error',
        progress: 0,
        message: 'Submission failed',
        errors: [errorMessage],
        warnings: []
      }));

      onError?.([errorMessage]);

      // Report error to Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'SubmissionFlow',
          operation: 'handleSubmit'
        }
      });
    } finally {
      submissionStartedRef.current = false;
    }
  }, [form, signatures, onSuccess, onError, autoClose, autoCloseDelay]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      stage: 'idle',
      progress: 0,
      message: 'Ready to submit',
      errors: [],
      warnings: [],
      submissionResult: undefined
    }));
    
    // Clear any auto-close timeout
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    
    submissionStartedRef.current = false;
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    // Clear any auto-close timeout
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    
    submissionStartedRef.current = false;
    onClose();
  }, [onClose]);

  // Handle download PDF
  const handleDownloadPdf = useCallback(() => {
    if (state.submissionResult?.responseData?.pdfUrl) {
      window.open(state.submissionResult.responseData.pdfUrl, '_blank');
    }
  }, [state.submissionResult]);

  // Get current step index
  const getCurrentStepIndex = () => {
    switch (state.stage) {
      case 'validating': return 0;
      case 'generating': return 1;
      case 'submitting': return 2;
      case 'success': 
      case 'error': return 3;
      default: return 0;
    }
  };

  // Get step color
  const getStepColor = (stepIndex: number) => {
    const currentStep = getCurrentStepIndex();
    if (stepIndex < currentStep) return 'success';
    if (stepIndex === currentStep && state.stage === 'error') return 'error';
    if (stepIndex === currentStep) return 'primary';
    return 'disabled';
  };

  const isSubmitting = ['validating', 'generating', 'submitting'].includes(state.stage);
  const canRetry = state.stage === 'error';
  const canClose = !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={canClose ? handleClose : undefined}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : 500
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Send color="primary" />
            Submit Form
          </Typography>
          
          {canClose && (
            <Button onClick={handleClose} size="small" color="inherit">
              <Close />
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress Stepper */}
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={getCurrentStepIndex()} orientation={isMobile ? 'vertical' : 'horizontal'}>
            {SUBMISSION_STEPS.map((label, index) => (
              <Step key={label} completed={index < getCurrentStepIndex() && state.stage !== 'error'}>
                <StepLabel 
                  error={index === getCurrentStepIndex() && state.stage === 'error'}
                  color={getStepColor(index)}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Progress Bar */}
        {isSubmitting && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={state.progress} 
              sx={{ height: 8, borderRadius: 4 }}
              color={state.stage === 'error' ? 'error' : 'primary'}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="textSecondary">
                {state.message}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {Math.round(state.progress)}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Status Message */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {state.stage === 'success' && <CheckCircle color="success" />}
            {state.stage === 'error' && <Error color="error" />}
            {isSubmitting && <CircularProgress size={24} />}
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {state.message}
              </Typography>
              
              {state.details && (
                <Typography variant="body2" color="textSecondary">
                  {state.details}
                </Typography>
              )}

              {/* Validation Status */}
              {state.validationPassed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main">
                    All form fields validated successfully
                  </Typography>
                </Box>
              )}

              {/* PDF Generation Status */}
              {state.pdfGenerated && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Description color="info" fontSize="small" />
                  <Typography variant="body2" color="info.main">
                    PDF generated and ready for submission
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Warnings */}
        {state.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Warnings ({state.warnings.length})</AlertTitle>
            <Collapse in={showDetails} timeout="auto">
              <List dense>
                {state.warnings.map((warning, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Warning fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
            
            <Button 
              size="small" 
              onClick={() => setShowDetails(!showDetails)}
              sx={{ mt: 1 }}
            >
              {showDetails ? 'Hide Details' : `Show Details (${state.warnings.length})`}
            </Button>
          </Alert>
        )}

        {/* Errors */}
        {state.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Errors ({state.errors.length})</AlertTitle>
            <List dense>
              {state.errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Error fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={error} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Success Details */}
        {state.stage === 'success' && state.submissionResult && (
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Done />
              Submission Successful
            </Typography>
            
            <Divider sx={{ my: 2, borderColor: 'success.main' }} />
            
            <Box sx={{ display: 'grid', gap: 1 }}>
              {state.submissionResult.submissionId && (
                <Typography variant="body2">
                  <strong>Submission ID:</strong> {state.submissionResult.submissionId}
                </Typography>
              )}
              
              <Typography variant="body2">
                <strong>Submitted at:</strong> {new Date(state.submissionResult.submittedAt).toLocaleString()}
              </Typography>
              
              <Typography variant="body2">
                <strong>Processing time:</strong> {Math.round(state.submissionResult.duration)}ms
              </Typography>

              {state.submissionResult.responseData?.pdfUrl && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<GetApp />}
                    onClick={handleDownloadPdf}
                    size="small"
                    sx={{ color: 'success.contrastText', borderColor: 'success.contrastText' }}
                  >
                    Download Completed PDF
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        {state.stage === 'idle' && (
          <>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" startIcon={<Send />}>
              Submit Form
            </Button>
          </>
        )}

        {canRetry && (
          <>
            <Button onClick={handleClose} variant="outlined">
              Close
            </Button>
            <Button onClick={handleRetry} variant="contained" startIcon={<Refresh />} color="warning">
              Try Again
            </Button>
          </>
        )}

        {state.stage === 'success' && (
          <Button onClick={handleClose} variant="contained" color="success">
            Done
          </Button>
        )}

        {isSubmitting && (
          <Button disabled variant="contained">
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Processing...
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};