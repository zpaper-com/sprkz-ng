import React from 'react';
import {
  Button,
  Box,
  CircularProgress,
  Tooltip,
  Badge,
  Typography,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  NavigateNext as NextIcon,
  Draw as SignIcon,
  Send as SubmitIcon,
  AutoMode as WizardIcon,
} from '@mui/icons-material';
import { useForm } from '../contexts/FormContext';

interface WizardButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showIcon?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const WizardButton: React.FC<WizardButtonProps> = ({
  variant = 'contained',
  size = 'large',
  showProgress = true,
  showIcon = true,
  fullWidth = false,
  className,
}) => {
  const {
    getWizardButtonState,
    handleWizardButtonClick,
    getFormProgress,
    state: { isSubmitting, wizard },
  } = useForm();

  const buttonState = getWizardButtonState();
  const progress = getFormProgress();

  // Icon mapping for each button type
  const getButtonIcon = () => {
    if (!showIcon) return null;

    const iconProps = { sx: { mr: 1 } };
    
    switch (buttonState.type) {
      case 'start':
        return <StartIcon {...iconProps} />;
      case 'next':
        return <NextIcon {...iconProps} />;
      case 'sign':
        return <SignIcon {...iconProps} />;
      case 'submit':
        return <SubmitIcon {...iconProps} />;
      default:
        return <WizardIcon {...iconProps} />;
    }
  };

  // Color mapping for MUI colors
  const getButtonColor = (): 'primary' | 'secondary' | 'warning' | 'success' => {
    switch (buttonState.color) {
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'secondary':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  // Tooltip content
  const getTooltipContent = () => {
    switch (buttonState.type) {
      case 'start':
        return 'Begin guided form completion';
      case 'next':
        return 'Continue to next required field';
      case 'sign':
        return 'Add signature to complete form';
      case 'submit':
        return 'Submit completed form';
      default:
        return 'Continue with form wizard';
    }
  };

  const buttonContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isSubmitting && buttonState.type === 'submit' ? (
        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
      ) : (
        getButtonIcon()
      )}
      <Typography variant="button" sx={{ fontWeight: 'bold' }}>
        {isSubmitting && buttonState.type === 'submit' ? 'Submitting...' : buttonState.text}
      </Typography>
    </Box>
  );

  // Progress badge for wizard mode
  const withProgressBadge = showProgress && wizard.isWizardMode && (
    <Badge
      badgeContent={`${progress.completed}/${progress.total}`}
      color="info"
      sx={{
        '& .MuiBadge-badge': {
          fontSize: '0.75rem',
          minWidth: '24px',
          height: '20px',
        },
      }}
    >
      {buttonContent}
    </Badge>
  );

  return (
    <Tooltip title={getTooltipContent()} arrow>
      <span>
        <Button
          variant={variant}
          size={size}
          color={getButtonColor()}
          onClick={handleWizardButtonClick}
          disabled={buttonState.disabled || isSubmitting}
          fullWidth={fullWidth}
          className={className}
          sx={{
            minWidth: 120,
            minHeight: size === 'large' ? 48 : undefined,
            textTransform: 'none',
            fontSize: size === 'large' ? '1.1rem' : undefined,
            boxShadow: variant === 'contained' ? 3 : undefined,
            '&:hover': {
              boxShadow: variant === 'contained' ? 6 : undefined,
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {showProgress && wizard.isWizardMode ? withProgressBadge : buttonContent}
        </Button>
      </span>
    </Tooltip>
  );
};

// Additional utility component for wizard status display
export const WizardStatus: React.FC = () => {
  const {
    state: { wizard },
    getFormProgress,
  } = useForm();

  const progress = getFormProgress();

  if (!wizard.isWizardMode) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        borderRadius: 1,
        fontSize: '0.875rem',
      }}
    >
      <WizardIcon fontSize="small" />
      <Typography variant="body2">
        Wizard Mode: {progress.completed} of {progress.total} completed ({progress.percentage}%)
      </Typography>
    </Box>
  );
};

export default WizardButton;