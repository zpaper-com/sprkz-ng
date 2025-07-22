import React, { useState, useRef, useEffect } from 'react';
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
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onClose,
  onSave,
  fieldName = 'Signature',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // Initialize canvas
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open]);

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
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
      }
    }
  };

  // Generate typed signature as canvas
  const generateTypedSignature = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    if (ctx && typedSignature.trim()) {
      ctx.fillStyle = '#000';
      ctx.font = `32px ${fonts.find((f) => f.value === selectedFont)?.style || 'cursive'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
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

  // Clear and close
  const handleClose = () => {
    setTypedSignature('');
    clearCanvas();
    setActiveTab(0);
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

            {/* Preview */}
            {typedSignature && (
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  p: 2,
                  textAlign: 'center',
                  minHeight: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <Typography
                  sx={{
                    fontFamily:
                      fonts.find((f) => f.value === selectedFont)?.style ||
                      'cursive',
                    fontSize: '2rem',
                  }}
                >
                  {typedSignature}
                </Typography>
              </Box>
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
                width={600}
                height={200}
                style={{
                  border: '1px dashed #999',
                  borderRadius: '4px',
                  cursor: 'crosshair',
                  display: 'block',
                  width: '100%',
                  height: '200px',
                  maxWidth: '600px',
                }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
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
