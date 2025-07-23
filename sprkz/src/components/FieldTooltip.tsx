import React, { useEffect, useState } from 'react';
import {
  Popper,
  Paper,
  Typography,
  Box,
  Fade,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Draw as SignatureIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useForm } from '../contexts/FormContext';
import { WizardService } from '../services/wizardService';

interface FieldTooltipProps {
  anchorEl?: HTMLElement | null;
  fieldId?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  showCloseButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  anchorEl,
  fieldId,
  placement = 'top',
  showCloseButton = true,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const {
    state: { wizard, completedFields },
    findFieldById,
    hideTooltip,
    getNextRequiredField,
    navigateToField,
  } = useForm();

  const [localAnchorEl, setLocalAnchorEl] = useState<HTMLElement | null>(null);

  // Use provided anchorEl or try to find the field element
  useEffect(() => {
    if (anchorEl) {
      setLocalAnchorEl(anchorEl);
    } else if (wizard.tooltipFieldId) {
      const element = document.querySelector(`[data-field-id="${wizard.tooltipFieldId}"]`) as HTMLElement;
      setLocalAnchorEl(element);
    } else {
      setLocalAnchorEl(null);
    }
  }, [anchorEl, wizard.tooltipFieldId]);

  // Auto-hide tooltip after delay
  useEffect(() => {
    if (autoHide && wizard.showTooltip && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        hideTooltip();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [wizard.showTooltip, autoHide, autoHideDelay, hideTooltip]);

  if (!wizard.showTooltip || !wizard.tooltipFieldId) {
    return null;
  }

  const targetFieldId = fieldId || wizard.tooltipFieldId;
  const field = findFieldById(targetFieldId);
  
  if (!field) {
    return null;
  }

  const isCompleted = completedFields.has(targetFieldId);
  const isRequired = field.required;
  const isSignature = field.type === 'signature';
  
  // Get validation hints
  const validationHints = WizardService.getValidationHints(field);
  
  // Determine tooltip color and icon
  const getTooltipProps = () => {
    if (isCompleted) {
      return {
        color: 'success.main',
        bgcolor: 'success.light',
        icon: <CheckIcon color="success" />,
        borderColor: 'success.main',
      };
    }
    
    if (isRequired) {
      return {
        color: 'warning.main',
        bgcolor: 'warning.light',
        icon: <WarningIcon color="warning" />,
        borderColor: 'warning.main',
      };
    }
    
    return {
      color: 'info.main',
      bgcolor: 'info.light',
      icon: <InfoIcon color="info" />,
      borderColor: 'info.main',
    };
  };

  const tooltipProps = getTooltipProps();

  const handleNextField = () => {
    const nextField = getNextRequiredField();
    if (nextField) {
      navigateToField(nextField.id);
    } else {
      hideTooltip();
    }
  };

  return (
    <Popper
      open={wizard.showTooltip}
      anchorEl={localAnchorEl}
      placement={placement}
      transition
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
      ]}
      style={{ zIndex: 1500 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Paper
            elevation={8}
            sx={{
              p: 2,
              maxWidth: 300,
              bgcolor: tooltipProps.bgcolor,
              border: 2,
              borderColor: tooltipProps.borderColor,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ flexShrink: 0, mt: 0.25 }}>
                {isSignature ? <SignatureIcon color="secondary" /> : tooltipProps.icon}
              </Box>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    color: tooltipProps.color,
                    mb: 0.5,
                  }}
                >
                  {field.name || 'Form Field'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {wizard.tooltipMessage}
                </Typography>

                {/* Field status chips */}
                <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                  {isRequired && (
                    <Chip
                      label="Required"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {isSignature && (
                    <Chip
                      label="Signature"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  {isCompleted && (
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Stack>

                {/* Validation hints */}
                {validationHints.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {validationHints.map((hint, index) => (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'text.secondary',
                          fontStyle: 'italic',
                        }}
                      >
                        • {hint}
                      </Typography>
                    ))}
                  </Box>
                )}

                {/* Action buttons */}
                {wizard.isWizardMode && !isCompleted && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {getNextRequiredField() && (
                      <IconButton
                        size="small"
                        onClick={handleNextField}
                        sx={{
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'background.default',
                          },
                        }}
                        title="Next field"
                      >
                        <NextIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>

              {/* Close button */}
              {showCloseButton && (
                <IconButton
                  size="small"
                  onClick={hideTooltip}
                  sx={{
                    color: tooltipProps.color,
                    p: 0.5,
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

// Hook to show tooltip for a specific field
export const useFieldTooltip = () => {
  const { showTooltip, hideTooltip, findFieldById } = useForm();

  const showFieldTooltip = (
    fieldId: string,
    customMessage?: string,
    element?: HTMLElement
  ) => {
    const field = findFieldById(fieldId);
    if (!field) return;

    const message = customMessage || WizardService.getTooltipMessage(
      field,
      field.required ? 'required' : field.type === 'signature' ? 'signature' : 'optional'
    );

    showTooltip(fieldId, message);

    // Scroll field into view if element provided
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  };

  return {
    showFieldTooltip,
    hideTooltip,
  };
};

export default FieldTooltip;