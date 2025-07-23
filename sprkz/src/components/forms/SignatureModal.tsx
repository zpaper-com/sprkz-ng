import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

export interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  fieldName?: string;
  fieldDimensions?: { width: number; height: number };
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onClose,
  onSave,
  fieldName = 'Signature',
  fieldDimensions,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  // Calculate optimal canvas dimensions based on field size
  const getCanvasDimensions = () => {
    if (fieldDimensions) {
      // Use field dimensions as base, with aggressive scaling for maximum size
      const aspectRatio = fieldDimensions.width / fieldDimensions.height;
      const minWidth = 600;
      const minHeight = 200;
      const dpiScale = 4; // Higher DPI for even crisper rendering and larger signatures
      
      let width = Math.max(fieldDimensions.width * dpiScale, minWidth);
      let height = Math.max(fieldDimensions.height * dpiScale, minHeight);
      
      // Maintain aspect ratio while respecting minimums
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
      
      return { 
        width: Math.round(width), 
        height: Math.round(height),
        displayWidth: Math.max(fieldDimensions.width * 1.5, 450), // Larger display
        displayHeight: Math.max(fieldDimensions.height * 1.5, 180)
      };
    }
    
    // Default canvas size - much larger
    return { 
      width: 1200, 
      height: 400, 
      displayWidth: 800, 
      displayHeight: 300 
    };
  };

  const canvasDimensions = useMemo(() => getCanvasDimensions(), [fieldDimensions]);

  const fonts = [
    { value: 'cursive', label: 'Cursive', style: 'cursive' },
    {
      value: 'dancing-script',
      label: 'Dancing Script',
      style: '"Dancing Script", cursive',
    },
    {
      value: 'great-vibes',
      label: 'Great Vibes',
      style: '"Great Vibes", cursive',
    },
    { value: 'allura', label: 'Allura', style: '"Allura", cursive' },
    { value: 'pacifico', label: 'Pacifico', style: '"Pacifico", cursive' },
    { value: 'satisfy', label: 'Satisfy', style: '"Satisfy", cursive' },
    {
      value: 'kaushan-script',
      label: 'Kaushan Script',
      style: '"Kaushan Script", cursive',
    },
    {
      value: 'brush-script',
      label: 'Brush Script',
      style: '"Brush Script MT", cursive',
    },
  ];

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Initialize canvas only when modal opens
  useEffect(() => {
    if (open && canvasRef.current && !canvasInitialized) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas dimensions programmatically to avoid re-render clearing
        canvas.width = canvasDimensions.width;
        canvas.height = canvasDimensions.height;
        
        // Clear canvas and set up drawing properties
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        setCanvasInitialized(true);
      }
    }
  }, [open, canvasDimensions, canvasInitialized]);

  // Reinitialize canvas properties when dimensions change (without clearing)
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Just reset drawing properties, don't clear the canvas
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
    }
  }, [canvasDimensions, open]);

  // Get proper mouse coordinates accounting for canvas scaling
  const getMousePos = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Ensure drawing properties are set correctly
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const pos = getMousePos(canvas, e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pos = getMousePos(canvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Complete the current path
        ctx.stroke();
        ctx.beginPath();
      }
    }
  };

  // Calculate optimal font size for maximum space utilization
  const calculateOptimalFontSize = (
    ctx: CanvasRenderingContext2D,
    text: string,
    fontFamily: string,
    maxWidth: number,
    maxHeight: number
  ): number => {
    // Binary search approach for more efficient font size calculation
    let minSize = 12;
    let maxSize = Math.min(maxHeight * 0.9, 300); // Start very large
    let optimalSize = minSize;
    
    // Use binary search to find the largest font size that fits
    while (minSize <= maxSize) {
      const midSize = Math.floor((minSize + maxSize) / 2);
      ctx.font = `${midSize}px ${fontFamily}`;
      const textMetrics = ctx.measureText(text);
      
      // Calculate actual text height using multiple methods for accuracy
      let actualHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      
      // Fallback height calculation if browser doesn't support bounding box
      if (actualHeight === 0 || isNaN(actualHeight)) {
        // Use font size with typical font metrics
        const fontMetrics = {
          ascent: textMetrics.fontBoundingBoxAscent || midSize * 0.8,
          descent: textMetrics.fontBoundingBoxDescent || midSize * 0.2
        };
        actualHeight = fontMetrics.ascent + fontMetrics.descent;
      }
      
      // Additional fallback
      if (actualHeight === 0 || isNaN(actualHeight)) {
        actualHeight = midSize * 0.75; // Conservative estimate
      }
      
      // Check if text fits with small margins
      const widthFits = textMetrics.width <= maxWidth * 0.98;
      const heightFits = actualHeight <= maxHeight * 0.95;
      
      if (widthFits && heightFits) {
        optimalSize = midSize;
        minSize = midSize + 1; // Try larger
      } else {
        maxSize = midSize - 1; // Must go smaller
      }
    }
    
    // Final validation with the chosen size
    ctx.font = `${optimalSize}px ${fontFamily}`;
    const finalMetrics = ctx.measureText(text);
    
    // If still too wide, scale down proportionally
    if (finalMetrics.width > maxWidth * 0.98) {
      const scaleFactor = (maxWidth * 0.98) / finalMetrics.width;
      optimalSize = Math.floor(optimalSize * scaleFactor);
    }
    
    return Math.max(optimalSize, 12);
  };

  // Generate typed signature as canvas
  const generateTypedSignature = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;
    const ctx = canvas.getContext('2d');

    if (ctx && typedSignature.trim()) {
      // High-quality rendering settings
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const selectedFontStyle = fonts.find((f) => f.value === selectedFont)?.style || 'cursive';
      
      // Calculate the optimal font size for maximum space utilization
      const optimalFontSize = calculateOptimalFontSize(
        ctx,
        typedSignature,
        selectedFontStyle,
        canvasDimensions.width,
        canvasDimensions.height
      );
      
      ctx.font = `${optimalFontSize}px ${selectedFontStyle}`;
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    }

    return canvas.toDataURL();
  };

  // Save signature
  const handleSave = () => {
    let signatureDataUrl = '';

    if (activeTab === 0) {
      // Typed signature
      if (typedSignature.trim()) {
        signatureDataUrl = generateTypedSignature();
      }
    } else {
      // Drawn signature
      const canvas = canvasRef.current;
      if (canvas) {
        signatureDataUrl = canvas.toDataURL();
      }
    }

    if (signatureDataUrl) {
      onSave(signatureDataUrl);
    }
    handleClose();
  };

  // Live preview calculation for font size
  const getLivePreviewFontSize = (): number | null => {
    if (!typedSignature.trim()) return null;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      const selectedFontStyle = fonts.find((f) => f.value === selectedFont)?.style || 'cursive';
      return calculateOptimalFontSize(
        tempCtx,
        typedSignature,
        selectedFontStyle,
        canvasDimensions.width,
        canvasDimensions.height
      );
    }
    return null;
  };

  // Clear and close
  const handleClose = () => {
    setTypedSignature('');
    clearCanvas();
    setActiveTab(0);
    setCanvasInitialized(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Sign {fieldName}</DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Type Signature" />
          <Tab label="Draw Signature" />
        </Tabs>

        {/* Typed Signature Tab */}
        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Type your signature"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl sx={{ mb: 2, minWidth: 200 }}>
              <InputLabel>Font Style</InputLabel>
              <Select
                value={selectedFont}
                label="Font Style"
                onChange={(e) => setSelectedFont(e.target.value)}
              >
                {fonts.map((font) => (
                  <MenuItem
                    key={font.value}
                    value={font.value}
                    sx={{ fontFamily: font.style }}
                  >
                    {font.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Accurate Preview with exact proportions */}
            {typedSignature && (
              <>
                <Box
                  sx={{
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: '#f9f9f9',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto'
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: fieldDimensions ? 
                        `${Math.min(fieldDimensions.height * 0.8, 150)}px` : 
                        '100px',
                      aspectRatio: fieldDimensions ? 
                        `${fieldDimensions.width} / ${fieldDimensions.height}` : 
                        '3 / 1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #ccc',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily:
                          fonts.find((f) => f.value === selectedFont)?.style ||
                          'cursive',
                        fontSize: (() => {
                          // Get the actual calculated font size
                          const liveSize = getLivePreviewFontSize();
                          if (liveSize && fieldDimensions) {
                            // Scale it down proportionally to fit the preview box
                            const previewHeight = Math.min(fieldDimensions.height * 0.8, 150);
                            const scaleFactor = previewHeight / fieldDimensions.height;
                            return `${Math.max(liveSize * scaleFactor, 12)}px`;
                          }
                          return '24px';
                        })(),
                        color: '#000',
                        textAlign: 'center',
                        lineHeight: 1,
                        userSelect: 'none'
                      }}
                    >
                      {typedSignature}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Show calculated font size info */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {(() => {
                    const liveSize = getLivePreviewFontSize();
                    if (liveSize) {
                      return (
                        <>
                          Will render at {liveSize}px in {fieldDimensions ? 
                            `${Math.round(fieldDimensions.width)}×${Math.round(fieldDimensions.height)}px` : 
                            'signature'} field
                        </>
                      );
                    }
                    return (
                      <>
                        Font will be automatically sized to fill {fieldDimensions ? 
                          `${Math.round(fieldDimensions.width)}×${Math.round(fieldDimensions.height)}px` : 
                          'available'} space
                      </>
                    );
                  })()}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Draw Signature Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Draw your signature in the box below:
            </Typography>
            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
              <canvas
                ref={canvasRef}
                style={{
                  border: '1px dashed #999',
                  borderRadius: '4px',
                  cursor: 'crosshair',
                  display: 'block',
                  width: '100%',
                  height: `${canvasDimensions.displayHeight}px`,
                  maxWidth: `${canvasDimensions.displayWidth}px`,
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  startDrawing(mouseEvent as any);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                  });
                  draw(mouseEvent as any);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
              />
            </Box>
            <Button onClick={clearCanvas} sx={{ mt: 1 }} size="small">
              Clear
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={activeTab === 0 ? !typedSignature.trim() : false}
        >
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};
