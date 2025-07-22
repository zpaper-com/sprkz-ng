import React from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  PlayArrow,
  NavigateNext,
  Edit,
  Send,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useWizard, WizardState } from '../../contexts/WizardContext';
import { microInteractionStyles, presets, createMicroInteraction } from '../../utils/microInteractions';

export interface WizardButtonProps {
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showGuidance?: boolean;
  disabled?: boolean;
  className?: string;
}

export const WizardButton: React.FC<WizardButtonProps> = ({
  size = 'large',
  showProgress = true,
  showGuidance = true,
  disabled = false,
  className
}) => {
  const theme = useTheme();
  const wizard = useWizard();
  const buttonState = wizard.getCurrentButtonState();

  // Get button color mapping for Material-UI
  const getButtonColor = (color: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' => {
    switch (color) {
      case 'primary': return 'primary';   // Blue
      case 'secondary': return 'secondary'; // Orange  
      case 'success': return 'success';   // Green
      case 'info': return 'info';         // Purple
      case 'warning': return 'warning';   // Yellow
      case 'error': return 'error';       // Red
      default: return 'primary';
    }
  };

  // Get button icon based on wizard state
  const getButtonIcon = (wizardState: WizardState) => {
    switch (wizardState) {
      case 'start':
        return <PlayArrow />;
      case 'next':
        return <NavigateNext />;
      case 'sign':
        return <Edit />;
      case 'submit':
        return <Send />;
      case 'complete':
        return <CheckCircle />;
      default:
        return <PlayArrow />;
    }
  };

  // Get progress color based on completion
  const getProgressColor = () => {
    const percentage = wizard.state.completionPercentage;
    if (percentage >= 100) return theme.palette.success.main;
    if (percentage >= 75) return theme.palette.info.main;
    if (percentage >= 50) return theme.palette.warning.main;
    return theme.palette.primary.main;
  };

  // Get guidance text
  const getGuidanceText = (): string => {
    const state = wizard.state;
    
    switch (state.wizardState) {
      case 'start':
        return `Begin completing ${state.totalRequiredFields} required field${state.totalRequiredFields === 1 ? '' : 's'}`;
      
      case 'next':
        if (state.currentField) {
          return `Navigate to "${state.currentField.name}" on page ${state.currentField.page}`;
        }
        const remaining = state.totalRequiredFields - state.completedFields.length;
        return `${remaining} required field${remaining === 1 ? '' : 's'} remaining`;
      
      case 'sign':
        if (state.currentField) {
          return `Sign "${state.currentField.name}" on page ${state.currentField.page}`;
        }
        return `Complete signature fields`;
      
      case 'submit':
        return `All fields complete - ready to submit`;
      
      case 'complete':
        return `Form submitted successfully!`;
      
      default:
        return '';
    }
  };

  // Handle button click
  const handleClick = () => {
    if (!disabled && !buttonState.disabled) {
      buttonState.action();
    }
  };

  const isDisabled = disabled || buttonState.disabled;
  const buttonColor = getButtonColor(buttonState.color);

  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      {/* Progress indicator */}
      {showProgress && wizard.state.totalRequiredFields > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={wizard.state.completionPercentage}
              size={24}
              thickness={4}
              sx={{
                color: getProgressColor(),
                ...microInteractionStyles.pulseLoading,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="textSecondary"
                sx={{ fontSize: '0.625rem', fontWeight: 'bold' }}
              >
                {wizard.state.completionPercentage}%
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="caption" color="textSecondary">
            {wizard.state.completedFields.length} of {wizard.state.totalRequiredFields} completed
          </Typography>
        </Box>
      )}

      {/* Main wizard button */}
      <Tooltip 
        title={isDisabled ? "Complete current field to continue" : getGuidanceText()}
        arrow
        placement="top"
      >
        <span>
          <Button
            variant="contained"
            color={buttonColor}
            size={size}
            disabled={isDisabled}
            onClick={handleClick}
            startIcon={getButtonIcon(wizard.state.wizardState)}
            sx={{
              minWidth: size === 'large' ? 160 : size === 'medium' ? 120 : 100,
              minHeight: size === 'large' ? 48 : size === 'medium' ? 40 : 32,
              fontSize: size === 'large' ? '1.1rem' : size === 'medium' ? '0.9rem' : '0.8rem',
              fontWeight: 600,
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              ...createMicroInteraction.hoverLift(1, theme.shadows[6]),
              ...microInteractionStyles.focusRing,
              '&.Mui-disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              },
              // Color-specific enhancements
              ...(buttonColor === 'primary' && {
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              }),
              ...(buttonColor === 'secondary' && {
                background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
              }),
              ...(buttonColor === 'success' && {
                background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
              }),
              ...(buttonColor === 'info' && {
                background: `linear-gradient(45deg, ${theme.palette.info.main} 30%, ${theme.palette.info.light} 90%)`,
              })
            }}
          >
            {buttonState.text}
          </Button>
        </span>
      </Tooltip>

      {/* Guidance text */}
      {showGuidance && (
        <Typography 
          variant="caption" 
          color="textSecondary" 
          align="center"
          sx={{ 
            maxWidth: 200,
            lineHeight: 1.2,
            mt: 0.5,
            ...microInteractionStyles.fadeIn
          }}
        >
          {getGuidanceText()}
        </Typography>
      )}

      {/* Warning indicators */}
      {wizard.state.currentField && wizard.state.currentField.validationErrors.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          mt: 1,
          ...microInteractionStyles.errorShake
        }}>
          <Warning color="warning" fontSize="small" />
          <Typography variant="caption" color="warning.main">
            {wizard.state.currentField.validationErrors[0]}
          </Typography>
        </Box>
      )}
    </Box>
  );
};