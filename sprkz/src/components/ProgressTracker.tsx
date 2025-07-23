import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Stack,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Draw as SignatureIcon,
  Warning as RequiredIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Navigation as NavigateIcon,
} from '@mui/icons-material';
import { useForm } from '../contexts/FormContext';
import { WizardService } from '../services/wizardService';

interface ProgressTrackerProps {
  variant?: 'compact' | 'detailed' | 'stepper';
  showSteps?: boolean;
  allowNavigation?: boolean;
  collapsible?: boolean;
  maxHeight?: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  variant = 'compact',
  showSteps = true,
  allowNavigation = true,
  collapsible = false,
  maxHeight = 400,
}) => {
  const {
    state: { allPageFields, completedFields, wizard, currentFieldId },
    getFormProgress,
    navigateToField,
  } = useForm();

  const [expanded, setExpanded] = React.useState(!collapsible);
  const progress = getFormProgress();
  const wizardSteps = WizardService.generateWizardSteps(allPageFields, completedFields);

  const handleStepClick = (stepFieldId: string) => {
    if (allowNavigation && wizard.isWizardMode) {
      navigateToField(stepFieldId);
    }
  };

  const getStepIcon = (step: any, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return <CompletedIcon color="success" />;
    }
    
    if (step.type === 'signature') {
      return <SignatureIcon color={isCurrent ? 'primary' : 'disabled'} />;
    }
    
    if (step.type === 'required') {
      return <RequiredIcon color={isCurrent ? 'warning' : 'disabled'} />;
    }
    
    return <IncompleteIcon color={isCurrent ? 'primary' : 'disabled'} />;
  };

  // Compact variant - just progress bar and summary
  if (variant === 'compact') {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: wizard.isWizardMode ? 'primary.light' : 'background.paper',
          color: wizard.isWizardMode ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Form Progress
          </Typography>
          <Typography variant="body2">
            {progress.completed} of {progress.total} completed
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={progress.percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: wizard.isWizardMode ? 'primary.dark' : 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: wizard.isWizardMode ? 'background.paper' : 'primary.main',
            },
          }}
        />
        
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
          {progress.percentage}% complete
        </Typography>
      </Paper>
    );
  }

  // Detailed variant with step list
  if (variant === 'detailed') {
    return (
      <Paper elevation={2} sx={{ mb: 2 }}>
        {collapsible && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: expanded ? 1 : 0,
              borderColor: 'divider',
              cursor: 'pointer',
            }}
            onClick={() => setExpanded(!expanded)}
          >
            <Typography variant="h6">
              Form Progress ({progress.percentage}%)
            </Typography>
            <IconButton size="small">
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          </Box>
        )}
        
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            {/* Progress summary */}
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress.percentage}
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {progress.completed} of {progress.total} fields completed
              </Typography>
            </Box>

            {/* Step list */}
            {showSteps && (
              <Box
                sx={{
                  maxHeight: maxHeight,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,.2)',
                    borderRadius: 3,
                  },
                }}
              >
                {wizardSteps.map((step) => {
                  const isCompleted = completedFields.has(step.fieldId);
                  const isCurrent = currentFieldId === step.fieldId;
                  
                  return (
                    <Box
                      key={step.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        bgcolor: isCurrent ? 'action.selected' : 'transparent',
                        cursor: allowNavigation && wizard.isWizardMode ? 'pointer' : 'default',
                        '&:hover': {
                          bgcolor: allowNavigation && wizard.isWizardMode ? 'action.hover' : 'transparent',
                        },
                      }}
                      onClick={() => handleStepClick(step.fieldId)}
                    >
                      <Box sx={{ mr: 2 }}>
                        {getStepIcon(step, isCompleted, isCurrent)}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isCurrent ? 'bold' : 'normal',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Page {step.pageNumber} • {step.description}
                        </Typography>
                      </Box>
                      
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label={step.type}
                          size="small"
                          variant="outlined"
                          color={
                            step.type === 'required' ? 'warning' :
                            step.type === 'signature' ? 'secondary' : 'default'
                          }
                        />
                        {allowNavigation && wizard.isWizardMode && (
                          <Tooltip title="Navigate to field">
                            <IconButton size="small">
                              <NavigateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    );
  }

  // Stepper variant - Material-UI stepper
  if (variant === 'stepper') {
    const currentStepIndex = wizardSteps.findIndex(step => step.fieldId === currentFieldId);
    
    return (
      <Paper elevation={2} sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Form Progress
          </Typography>
          
          <Stepper
            activeStep={currentStepIndex >= 0 ? currentStepIndex : 0}
            orientation="vertical"
            sx={{
              maxHeight: maxHeight,
              overflowY: 'auto',
            }}
          >
            {wizardSteps.map((step) => {
              const isCompleted = completedFields.has(step.fieldId);
              const isCurrent = currentFieldId === step.fieldId;
              
              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    icon={getStepIcon(step, isCompleted, isCurrent)}
                    onClick={() => handleStepClick(step.fieldId)}
                    sx={{
                      cursor: allowNavigation && wizard.isWizardMode ? 'pointer' : 'default',
                      '&:hover': {
                        bgcolor: allowNavigation && wizard.isWizardMode ? 'action.hover' : 'transparent',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrent ? 'bold' : 'normal',
                      }}
                    >
                      {step.title}
                    </Typography>
                  </StepLabel>
                  
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`Page ${step.pageNumber}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={step.type}
                        size="small"
                        variant="outlined"
                        color={
                          step.type === 'required' ? 'warning' :
                          step.type === 'signature' ? 'secondary' : 'default'
                        }
                        sx={{ ml: 0.5 }}
                      />
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </Paper>
    );
  }

  return null;
};

// Mini progress indicator for toolbar
export const MiniProgressIndicator: React.FC = () => {
  const { getFormProgress, state: { wizard } } = useForm();
  const progress = getFormProgress();

  return (
    <Tooltip title={`${progress.completed} of ${progress.total} fields completed (${progress.percentage}%)`}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: wizard.isWizardMode ? 'warning.light' : 'background.paper',
          border: 1,
          borderColor: wizard.isWizardMode ? 'warning.main' : 'divider',
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(${
                wizard.isWizardMode ? '#ff9800' : '#1976d2'
              } ${progress.percentage * 3.6}deg, #e0e0e0 0deg)`,
            }}
          />
          <Typography variant="caption" sx={{ fontSize: '0.625rem', fontWeight: 'bold' }}>
            {progress.percentage}%
          </Typography>
        </Box>
        <Typography variant="caption">
          {progress.completed}/{progress.total}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default ProgressTracker;