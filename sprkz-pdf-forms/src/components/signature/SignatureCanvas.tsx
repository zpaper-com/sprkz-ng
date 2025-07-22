import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Box, useTheme } from '@mui/material';
import SignatureCanvasLib from 'react-signature-canvas';

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  penColor?: string;
  minWidth?: number;
  maxWidth?: number;
  velocityFilterWeight?: number;
  onSignatureChange?: (signature: string) => void;
  onBegin?: () => void;
  onEnd?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  fromDataURL: (dataURL: string, options?: { ratio?: number; width?: number; height?: number }) => void;
  getCanvas: () => HTMLCanvasElement | null;
  getTrimmedCanvas: () => HTMLCanvasElement | null;
  on: () => void;
  off: () => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(({
  width = 400,
  height = 150,
  backgroundColor = '#ffffff',
  penColor = '#000000',
  minWidth = 1,
  maxWidth = 3,
  velocityFilterWeight = 0.7,
  onSignatureChange,
  onBegin,
  onEnd,
  disabled = false,
  className
}, ref) => {
  const theme = useTheme();
  const canvasRef = useRef<SignatureCanvasLib>(null);

  // Handle signature change
  const handleEnd = useCallback(() => {
    if (canvasRef.current && onSignatureChange) {
      const isEmpty = canvasRef.current.isEmpty();
      if (!isEmpty) {
        const dataURL = canvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        onSignatureChange(dataURL);
      } else {
        onSignatureChange('');
      }
    }
    
    onEnd?.();
  }, [onSignatureChange, onEnd]);

  // Handle signature start
  const handleBegin = useCallback(() => {
    onBegin?.();
  }, [onBegin]);

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (canvasRef.current) {
        canvasRef.current.clear();
        onSignatureChange?.('');
      }
    },
    
    isEmpty: () => {
      return canvasRef.current ? canvasRef.current.isEmpty() : true;
    },
    
    toDataURL: (type = 'image/png', encoderOptions = 0.92) => {
      if (canvasRef.current) {
        return canvasRef.current.getTrimmedCanvas().toDataURL(type, encoderOptions);
      }
      return '';
    },
    
    fromDataURL: (dataURL: string, options?: { ratio?: number; width?: number; height?: number }) => {
      if (canvasRef.current && dataURL) {
        canvasRef.current.fromDataURL(dataURL, options);
      }
    },
    
    getCanvas: () => {
      return canvasRef.current ? canvasRef.current.getCanvas() : null;
    },
    
    getTrimmedCanvas: () => {
      return canvasRef.current ? canvasRef.current.getTrimmedCanvas() : null;
    },
    
    on: () => {
      if (canvasRef.current) {
        canvasRef.current.on();
      }
    },
    
    off: () => {
      if (canvasRef.current) {
        canvasRef.current.off();
      }
    }
  }), [onSignatureChange]);

  // Handle canvas touch/pointer events for better mobile support
  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    // Prevent scrolling when touching the canvas
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchend', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchend', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
    <Box
      className={className}
      sx={{
        border: `2px solid ${theme.palette.divider}`,
        borderRadius: 2,
        backgroundColor: backgroundColor,
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        ...(disabled && {
          opacity: 0.6,
          pointerEvents: 'none'
        })
      }}
    >
      <SignatureCanvasLib
        ref={canvasRef}
        canvasProps={{
          width: width,
          height: height,
          className: 'signature-canvas',
          style: {
            display: 'block',
            touchAction: 'none' // Prevent default touch actions
          }
        }}
        backgroundColor={backgroundColor}
        penColor={penColor}
        minWidth={minWidth}
        maxWidth={maxWidth}
        velocityFilterWeight={velocityFilterWeight}
        onBegin={handleBegin}
        onEnd={handleEnd}
      />
      
      {/* Overlay for disabled state */}
      {disabled && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        />
      )}
    </Box>
  );
});

SignatureCanvas.displayName = 'SignatureCanvas';