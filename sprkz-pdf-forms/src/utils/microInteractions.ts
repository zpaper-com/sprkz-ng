import { keyframes } from '@mui/system';
import { SxProps, Theme } from '@mui/material/styles';

// Animation keyframes
export const microAnimations = {
  // Hover effects
  hoverLift: keyframes`
    0% { transform: translateY(0); }
    100% { transform: translateY(-2px); }
  `,
  
  hoverScale: keyframes`
    0% { transform: scale(1); }
    100% { transform: scale(1.02); }
  `,
  
  hoverGlow: keyframes`
    0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
    100% { box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2); }
  `,
  
  // Button interactions
  buttonPress: keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(0.98); }
    100% { transform: scale(1); }
  `,
  
  ripple: keyframes`
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  `,
  
  // Loading states
  pulse: keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  `,
  
  shimmer: keyframes`
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  `,
  
  // Success/error states
  bounceIn: keyframes`
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  `,
  
  shake: keyframes`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  `,
  
  // Page transitions
  slideInFromBottom: keyframes`
    0% {
      transform: translateY(20px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  `,
  
  slideInFromLeft: keyframes`
    0% {
      transform: translateX(-20px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  slideInFromRight: keyframes`
    0% {
      transform: translateX(20px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  fadeIn: keyframes`
    0% { opacity: 0; }
    100% { opacity: 1; }
  `,
  
  fadeInUp: keyframes`
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  // Progress animations
  progressFill: keyframes`
    0% { width: 0%; }
    100% { width: var(--progress-width); }
  `,
  
  rotateIn: keyframes`
    0% {
      transform: rotate(-200deg);
      opacity: 0;
    }
    100% {
      transform: rotate(0deg);
      opacity: 1;
    }
  `,
};

// Pre-defined micro-interaction styles
export const microInteractionStyles = {
  // Hover lift effect for cards and buttons
  hoverLift: {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
      transform: 'translateY(0)',
      transition: 'all 0.1s',
    },
  } as SxProps<Theme>,
  
  // Scale hover effect
  hoverScale: {
    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.02)',
    },
    '&:active': {
      transform: 'scale(0.98)',
      transition: 'transform 0.1s',
    },
  } as SxProps<Theme>,
  
  // Glow hover effect
  hoverGlow: {
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.2)',
    },
  } as SxProps<Theme>,
  
  // Tap feedback
  tapFeedback: {
    transition: 'all 0.1s ease',
    '&:active': {
      transform: 'scale(0.98)',
      opacity: 0.8,
    },
  } as SxProps<Theme>,
  
  // Smooth focus
  focusRing: {
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: '2px',
      borderRadius: '4px',
    },
  } as SxProps<Theme>,
  
  // Stagger animation (for lists)
  staggerFadeIn: (index: number, baseDelay: number = 100) => ({
    animation: `${microAnimations.fadeInUp} 0.5s ease-out ${index * baseDelay}ms both`,
  } as SxProps<Theme>),
  
  // Loading shimmer
  shimmerLoading: {
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      animation: `${microAnimations.shimmer} 1.5s infinite`,
    },
  } as SxProps<Theme>,
  
  // Success state
  successBounce: {
    animation: `${microAnimations.bounceIn} 0.6s ease-out`,
  } as SxProps<Theme>,
  
  // Error shake
  errorShake: {
    animation: `${microAnimations.shake} 0.5s ease-in-out`,
  } as SxProps<Theme>,
  
  // Slide in from bottom (for modals, sheets)
  slideInFromBottom: {
    animation: `${microAnimations.slideInFromBottom} 0.3s ease-out`,
  } as SxProps<Theme>,
  
  // Slide in from left (for sidebars)
  slideInFromLeft: {
    animation: `${microAnimations.slideInFromLeft} 0.3s ease-out`,
  } as SxProps<Theme>,
  
  // Slide in from right
  slideInFromRight: {
    animation: `${microAnimations.slideInFromRight} 0.3s ease-out`,
  } as SxProps<Theme>,
  
  // Fade in
  fadeIn: {
    animation: `${microAnimations.fadeIn} 0.3s ease-out`,
  } as SxProps<Theme>,
  
  // Pulse loading
  pulseLoading: {
    animation: `${microAnimations.pulse} 2s ease-in-out infinite`,
  } as SxProps<Theme>,
};

// Utility functions for dynamic animations
export const createMicroInteraction = {
  // Create a custom hover lift with specific height
  hoverLift: (height: number = 2, shadow: string = '0 4px 12px rgba(0, 0, 0, 0.15)') => ({
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: `translateY(-${height}px)`,
      boxShadow: shadow,
    },
    '&:active': {
      transform: 'translateY(0)',
      transition: 'all 0.1s',
    },
  } as SxProps<Theme>),
  
  // Create a custom scale animation
  scale: (scaleAmount: number = 1.02, duration: number = 200) => ({
    transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    '&:hover': {
      transform: `scale(${scaleAmount})`,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  } as SxProps<Theme>),
  
  // Create a custom glow effect with specific color
  glow: (color: string = 'rgba(33, 150, 243, 0.2)', intensity: number = 2) => ({
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: `0 0 0 ${intensity}px ${color}`,
    },
  } as SxProps<Theme>),
  
  // Create staggered animation for lists
  stagger: (totalItems: number, baseDelay: number = 50, animation: string = 'fadeInUp') => {
    const staggerStyles: Record<string, SxProps<Theme>> = {};
    
    for (let i = 0; i < totalItems; i++) {
      staggerStyles[`&:nth-of-type(${i + 1})`] = {
        animation: `${microAnimations[animation as keyof typeof microAnimations]} 0.5s ease-out ${i * baseDelay}ms both`,
      };
    }
    
    return staggerStyles as SxProps<Theme>;
  },
  
  // Create a loading state with custom pulse timing
  loading: (duration: number = 2000) => ({
    animation: `${microAnimations.pulse} ${duration}ms ease-in-out infinite`,
  } as SxProps<Theme>),
  
  // Create a progress fill animation
  progressFill: (width: string | number, duration: number = 1000) => ({
    '--progress-width': typeof width === 'number' ? `${width}%` : width,
    animation: `${microAnimations.progressFill} ${duration}ms ease-out forwards`,
  } as SxProps<Theme>),
};

// Touch-friendly interaction styles for mobile
export const touchInteractions = {
  // Minimum touch target size (44x44px)
  touchTarget: {
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as SxProps<Theme>,
  
  // Enhanced tap feedback for mobile
  mobileTap: {
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.1s ease',
    '&:active': {
      transform: 'scale(0.95)',
      opacity: 0.7,
    },
  } as SxProps<Theme>,
  
  // Swipe-friendly elements
  swipeTarget: {
    touchAction: 'pan-x pan-y',
    userSelect: 'none',
  } as SxProps<Theme>,
};

// Presets for common UI elements
export const presets = {
  card: {
    ...microInteractionStyles.hoverLift,
    borderRadius: '12px',
    overflow: 'hidden',
  } as SxProps<Theme>,
  
  button: {
    ...microInteractionStyles.tapFeedback,
    ...microInteractionStyles.focusRing,
    borderRadius: '8px',
    fontWeight: 600,
  } as SxProps<Theme>,
  
  iconButton: {
    ...microInteractionStyles.hoverScale,
    ...touchInteractions.touchTarget,
    ...touchInteractions.mobileTap,
    borderRadius: '50%',
  } as SxProps<Theme>,
  
  listItem: {
    ...microInteractionStyles.hoverGlow,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  } as SxProps<Theme>,
  
  input: {
    ...microInteractionStyles.focusRing,
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: 'primary.main',
    },
  } as SxProps<Theme>,
};

export default {
  animations: microAnimations,
  styles: microInteractionStyles,
  create: createMicroInteraction,
  touch: touchInteractions,
  presets,
};