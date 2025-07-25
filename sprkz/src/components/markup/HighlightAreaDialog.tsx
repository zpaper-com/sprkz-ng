import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Rectangle as RectangleIcon,
  Gesture as FreeformIcon,
} from '@mui/icons-material';

export interface HighlightAreaDialogProps {
  open: boolean;
  onClose: () => void;
  onHighlightSelect: (color: string, opacity: number, shape: 'rectangle' | 'freeform') => void;
  defaultColor?: string;
  defaultOpacity?: number;
  defaultShape?: 'rectangle' | 'freeform';
}

// Predefined highlight colors
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#ffff00', description: 'Classic highlight' },
  { name: 'Green', value: '#00ff00', description: 'Success/approved' },
  { name: 'Blue', value: '#00bfff', description: 'Information' },
  { name: 'Orange', value: '#ffa500', description: 'Warning/attention' },
  { name: 'Pink', value: '#ff69b4', description: 'Important' },
  { name: 'Purple', value: '#9370db', description: 'Special note' },
  { name: 'Red', value: '#ff6b6b', description: 'Error/critical' },
  { name: 'Cyan', value: '#00ffff', description: 'Cool tone' },
];

export const HighlightAreaDialog: React.FC<HighlightAreaDialogProps> = ({
  open,
  onClose,
  onHighlightSelect,
  defaultColor = '#ffff00',
  defaultOpacity = 0.3,
  defaultShape = 'rectangle',
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [opacity, setOpacity] = useState<number>(defaultOpacity);
  const [shape, setShape] = useState<'rectangle' | 'freeform'>(defaultShape);

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  // Handle apply highlight
  const handleApplyHighlight = () => {
    onHighlightSelect(selectedColor, opacity, shape);
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset to defaults
    setSelectedColor(defaultColor);
    setOpacity(defaultOpacity);
    setShape(defaultShape);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Highlight Area Settings</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Color Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Highlight Color
            </Typography>
            
            <Grid container spacing={1}>
              {HIGHLIGHT_COLORS.map((color) => (
                <Grid item xs={3} sm={2} key={color.value}>
                  <Tooltip title={`${color.name}: ${color.description}`}>
                    <Paper
                      sx={{
                        width: '100%',
                        height: 60,
                        backgroundColor: color.value,
                        opacity: opacity,
                        cursor: 'pointer',
                        border: selectedColor === color.value ? '3px solid' : '1px solid',
                        borderColor: selectedColor === color.value ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'scale(1.05)',
                        },
                      }}
                      onClick={() => handleColorSelect(color.value)}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: color.value === '#ffff00' || color.value === '#00ffff' ? '#000' : '#fff',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        }}
                      >
                        {color.name}
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            {/* Custom color input */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Custom color:</Typography>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorSelect(e.target.value)}
                style={{
                  width: 40,
                  height: 40,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {selectedColor.toUpperCase()}
              </Typography>
            </Box>
          </Box>

          {/* Opacity Setting */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Opacity
            </Typography>
            <Slider
              value={opacity}
              onChange={(_, value) => setOpacity(value as number)}
              min={0.1}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              marks={[
                { value: 0.1, label: '10%' },
                { value: 0.3, label: '30%' },
                { value: 0.5, label: '50%' },
                { value: 0.7, label: '70%' },
                { value: 1, label: '100%' },
              ]}
            />
          </Box>

          {/* Shape Selection */}
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">
                <Typography variant="h6">Highlight Shape</Typography>
              </FormLabel>
              <RadioGroup
                value={shape}
                onChange={(e) => setShape(e.target.value as 'rectangle' | 'freeform')}
                sx={{ mt: 1 }}
              >
                <FormControlLabel
                  value="rectangle"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RectangleIcon />
                      <Box>
                        <Typography variant="body1">Rectangle</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Click and drag to create rectangular highlights
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="freeform"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FreeformIcon />
                      <Box>
                        <Typography variant="body1">Freeform</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Draw custom highlight shapes by hand
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Preview */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                position: 'relative',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Sample text */}
              <Typography variant="body1" sx={{ position: 'relative', zIndex: 1 }}>
                This is sample text that will be highlighted
              </Typography>
              
              {/* Highlight overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: shape === 'rectangle' ? '50%' : '40%',
                  left: '20%',
                  width: shape === 'rectangle' ? '60%' : '50%',
                  height: shape === 'rectangle' ? '30%' : '40%',
                  backgroundColor: selectedColor,
                  opacity: opacity,
                  borderRadius: shape === 'rectangle' ? 1 : '30% 70% 70% 30% / 30% 30% 70% 70%',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                }}
              />
            </Paper>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Selected: {selectedColor.toUpperCase()} at {Math.round(opacity * 100)}% opacity ({shape} shape)
            </Typography>
          </Box>

          {/* Usage Instructions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              How to use:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <Box component="li" sx={{ mb: 0.5 }}>
                  Click "Apply Settings" to activate the highlight tool
                </Box>
                <Box component="li" sx={{ mb: 0.5 }}>
                  {shape === 'rectangle' 
                    ? 'Click and drag on the PDF to create rectangular highlights'
                    : 'Click and drag on the PDF to draw freeform highlight shapes'
                  }
                </Box>
                <Box component="li" sx={{ mb: 0.5 }}>
                  Release the mouse button to complete the highlight
                </Box>
                <Box component="li">
                  Click on existing highlights to select and modify them
                </Box>
              </Box>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleApplyHighlight}
          variant="contained"
          startIcon={shape === 'rectangle' ? <RectangleIcon /> : <FreeformIcon />}
        >
          Apply Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};