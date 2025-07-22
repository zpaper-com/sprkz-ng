import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Backdrop,
  Paper,
  Fade,
  Skeleton
} from '@mui/material';
import { keyframes } from '@mui/system';
import { microAnimations, microInteractionStyles } from '../../utils/microInteractions';

export interface LoadingSpinnerProps {
  loading?: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'backdrop' | 'inline' | 'skeleton';
  fullScreen?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Custom loading animations
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const slideUpAnimation = keyframes`
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeInAnimation = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Spinner sizes
const spinnerSizes = {
  small: 24,
  medium: 40,
  large: 56
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loading = true,
  message,
  size = 'medium',
  variant = 'spinner',
  fullScreen = false,
  children,
  className
}) => {
  const theme = useTheme();
  const spinnerSize = spinnerSizes[size];

  // Skeleton loading variant
  if (variant === 'skeleton' && loading) {
    return (
      <Box className={className} sx={{ p: 2 }}>
        <Skeleton 
          variant="rectangular" 
          height={200} 
          sx={{ 
            borderRadius: 2,
            mb: 2,
            animation: `${fadeInAnimation} 0.3s ease-in-out`
          }} 
        />
        <Skeleton 
          variant="text" 
          height={24} 
          width="60%" 
          sx={{ mb: 1 }} 
        />
        <Skeleton 
          variant="text" 
          height={20} 
          width="40%" 
        />
      </Box>
    );
  }

  // Full screen backdrop variant
  if (variant === 'backdrop') {
    return (
      <Backdrop
        open={loading}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
        className={className}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: 'background.paper',
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            animation: `${microAnimations.slideInFromBottom} 0.3s ease-out`,
            maxWidth: '300px',
            textAlign: 'center'
          }}
        >
          <CircularProgress 
            size={spinnerSize} 
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              animation: `${microAnimations.pulse} 2s ease-in-out infinite`
            }}
          />
          {message && (
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{
                animation: `${microAnimations.fadeInUp} 0.5s ease-in-out 0.2s both`
              }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      </Backdrop>
    );
  }

  // Inline loading variant (shows loading state with children)
  if (variant === 'inline') {
    return (
      <Box className={className} sx={{ position: 'relative' }}>
        {loading && (
          <Fade in={loading}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(2px)',
                zIndex: 1,
                borderRadius: 'inherit',
                animation: `${fadeInAnimation} 0.2s ease-in-out`
              }}
            >
              <CircularProgress 
                size={spinnerSize} 
                thickness={4}
                sx={{
                  color: theme.palette.primary.main,
                  mb: message ? 2 : 0
                }}
              />
              {message && (
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ textAlign: 'center', maxWidth: '200px' }}
                >
                  {message}
                </Typography>
              )}
            </Box>
          </Fade>
        )}
        {children}
      </Box>
    );
  }

  // Default spinner variant
  if (!loading) return children ? <>{children}</> : null;

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
        ...(fullScreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: theme.zIndex.modal
        }),
        animation: `${fadeInAnimation} 0.3s ease-in-out`
      }}
    >
      <CircularProgress 
        size={spinnerSize} 
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          animation: size === 'large' ? `${pulseAnimation} 2s ease-in-out infinite` : undefined
        }}
      />
      {message && (
        <Typography 
          variant={size === 'large' ? 'body1' : 'body2'} 
          color="textSecondary"
          sx={{
            textAlign: 'center',
            maxWidth: '300px',
            animation: `${fadeInAnimation} 0.5s ease-in-out 0.2s both`
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Specialized loading components
export const LoadingButton: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  disabled?: boolean;
  className?: string;
}> = ({
  loading = false,
  children,
  onClick,
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  disabled = false,
  className
}) => {
  const theme = useTheme();
  
  return (
    <Box className={className} sx={{ position: 'relative', display: 'inline-block' }}>
      <Box
        component="button"
        onClick={!loading && !disabled ? onClick : undefined}
        disabled={loading || disabled}
        sx={{
          ...theme.components?.MuiButton?.styleOverrides?.root,
          backgroundColor: loading ? theme.palette.action.disabledBackground : 
                          variant === 'contained' ? theme.palette[color].main : 'transparent',
          color: loading ? theme.palette.action.disabled :
                 variant === 'contained' ? theme.palette[color].contrastText : theme.palette[color].main,
          border: variant === 'outlined' ? `2px solid ${theme.palette[color].main}` : 'none',
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          opacity: loading || disabled ? 0.6 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': !loading && !disabled ? {
            backgroundColor: variant === 'contained' ? theme.palette[color].dark : 
                            `${theme.palette[color].main}08`,
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[4]
          } : {},
        }}
      >
        <Box sx={{ 
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {children}
        </Box>
        
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: `${fadeInAnimation} 0.2s ease-in-out`
            }}
          >
            <CircularProgress 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              thickness={4}
              sx={{
                color: variant === 'contained' ? theme.palette[color].contrastText : theme.palette[color].main
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Progress loading component
export const ProgressLoading: React.FC<{
  progress: number;
  message?: string;
  subMessage?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({
  progress,
  message,
  subMessage,
  size = 'medium',
  className
}) => {
  const theme = useTheme();
  const spinnerSize = spinnerSizes[size];
  
  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 3,
        animation: `${slideUpAnimation} 0.3s ease-out`
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={spinnerSize}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            animation: `${rotateAnimation} 2s linear infinite`
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            color="textSecondary"
            sx={{ 
              fontWeight: 600,
              fontSize: size === 'large' ? '0.75rem' : '0.625rem'
            }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
      
      {message && (
        <Typography 
          variant={size === 'large' ? 'body1' : 'body2'}
          color="textPrimary"
          sx={{
            textAlign: 'center',
            fontWeight: 500,
            animation: `${fadeInAnimation} 0.5s ease-in-out 0.1s both`
          }}
        >
          {message}
        </Typography>
      )}
      
      {subMessage && (
        <Typography 
          variant="caption"
          color="textSecondary"
          sx={{
            textAlign: 'center',
            maxWidth: '250px',
            animation: `${fadeInAnimation} 0.5s ease-in-out 0.2s both`
          }}
        >
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;