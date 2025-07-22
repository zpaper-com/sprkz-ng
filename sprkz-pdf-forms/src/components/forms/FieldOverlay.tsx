import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Tooltip,
  Paper,
  Typography,
  Button,
  Portal,
  Fade,
  useTheme
} from '@mui/material';
import { NavigateNext, Edit, CheckCircle } from '@mui/icons-material';
import { FormField } from '../../types/pdf';

export interface FieldOverlayProps {
  field: FormField;
  isHighlighted: boolean;
  isCurrentField: boolean;
  container?: Element;
  onNavigateToField?: () => void;
  onEditField?: () => void;
  className?: string;
}

/**
 * Overlay component that highlights form fields in the PDF viewer
 * Provides visual indicators and navigation tooltips
 */
export const FieldOverlay: React.FC<FieldOverlayProps> = ({
  field,
  isHighlighted,
  isCurrentField,
  container,
  onNavigateToField,
  onEditField,
  className
}) => {
  const theme = useTheme();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Calculate position based on field rect and PDF viewport
  useEffect(() => {
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const [x1, y1, x2, y2] = field.rect;
    
    // Convert PDF coordinates to screen coordinates
    // Note: PDF coordinates are typically bottom-up, screen coordinates are top-down
    const pdfViewport = {
      width: containerRect.width,
      height: containerRect.height
    };
    
    const screenX = x1;
    const screenY = pdfViewport.height - y2; // Flip Y coordinate
    const screenWidth = x2 - x1;
    const screenHeight = y2 - y1;

    setPosition({
      x: screenX,
      y: screenY,
      width: Math.max(screenWidth, 50), // Minimum width
      height: Math.max(screenHeight, 20) // Minimum height
    });
  }, [field.rect, container]);

  // Handle tooltip open/close
  useEffect(() => {
    if (isCurrentField) {
      const timer = setTimeout(() => setTooltipOpen(true), 500);
      return () => clearTimeout(timer);
    } else {
      setTooltipOpen(false);
    }
  }, [isCurrentField]);

  // Auto-hide tooltip after delay
  useEffect(() => {
    if (tooltipOpen && !isCurrentField) {
      const timer = setTimeout(() => setTooltipOpen(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [tooltipOpen, isCurrentField]);

  // Get field status color and icon
  const getFieldStatusColor = () => {
    if (field.isComplete) return theme.palette.success.main;
    if (field.required && field.validationErrors.length > 0) return theme.palette.error.main;
    if (field.required) return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  const getFieldStatusIcon = () => {
    if (field.isComplete) return <CheckCircle fontSize="small" />;
    if (field.type === 'signature') return <Edit fontSize="small" />;
    return <NavigateNext fontSize="small" />;
  };

  // Get field display name
  const getFieldDisplayName = () => {
    return field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle field click
  const handleFieldClick = () => {
    if (onNavigateToField) {
      onNavigateToField();
    }
    setTooltipOpen(true);
  };

  // Handle edit button click
  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEditField) {
      onEditField();
    }
  };

  if (!isHighlighted && !isCurrentField) {
    return null;
  }

  const overlayStyle = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    width: position.width,
    height: position.height,
    pointerEvents: 'auto' as const,
    zIndex: isCurrentField ? 1000 : 999,
    cursor: 'pointer'
  };

  const tooltipContent = (
    <Paper
      elevation={4}
      sx={{
        p: 2,
        maxWidth: 250,
        backgroundColor: 'background.paper',
        border: `2px solid ${getFieldStatusColor()}`
      }}
    >
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {getFieldDisplayName()}
          {field.required && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
          {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field on page {field.page}
        </Typography>
        
        {field.isComplete ? (
          <Typography variant="caption" color="success.main" display="block">
            ✓ Completed
          </Typography>
        ) : (
          <Typography variant="caption" color="warning.main" display="block">
            {field.required ? 'Required - needs completion' : 'Optional field'}
          </Typography>
        )}

        {field.validationErrors.length > 0 && (
          <Typography variant="caption" color="error.main" display="block" sx={{ mt: 1 }}>
            {field.validationErrors[0]}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {!field.isComplete && (
            <Button
              size="small"
              variant="contained"
              startIcon={field.type === 'signature' ? <Edit /> : <NavigateNext />}
              onClick={handleEditClick}
              sx={{ fontSize: '0.75rem' }}
            >
              {field.type === 'signature' ? 'Sign' : 'Fill'}
            </Button>
          )}
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => setTooltipOpen(false)}
            sx={{ fontSize: '0.75rem' }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <Portal container={container}>
      <Box
        ref={overlayRef}
        className={className}
        sx={overlayStyle}
        onClick={handleFieldClick}
      >
        {/* Field highlight overlay */}
        <Fade in={isHighlighted || isCurrentField}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: getFieldStatusColor(),
              opacity: isCurrentField ? 0.3 : 0.15,
              border: `2px solid ${getFieldStatusColor()}`,
              borderRadius: 1,
              pointerEvents: 'none',
              animation: isCurrentField 
                ? `pulse 2s ease-in-out infinite` 
                : undefined,
              '@keyframes pulse': {
                '0%': { opacity: 0.3 },
                '50%': { opacity: 0.1 },
                '100%': { opacity: 0.3 }
              }
            }}
          />
        </Fade>

        {/* Field status indicator */}
        {(isHighlighted || isCurrentField) && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              backgroundColor: getFieldStatusColor(),
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              boxShadow: theme.shadows[2]
            }}
          >
            {getFieldStatusIcon()}
          </Box>
        )}

        {/* Tooltip */}
        {tooltipOpen && (
          <Portal>
            <Box
              sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1300,
                pointerEvents: 'auto'
              }}
            >
              <Fade in={tooltipOpen}>
                {tooltipContent}
              </Fade>
            </Box>
          </Portal>
        )}
      </Box>
    </Portal>
  );
};