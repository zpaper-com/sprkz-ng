import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Paper,
  useTheme
} from '@mui/material';

export interface TypedSignatureProps {
  width?: number;
  height?: number;
  text?: string;
  font?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  onTextChange?: (text: string) => void;
  onFontChange?: (font: string) => void;
  onFontSizeChange?: (fontSize: number) => void;
  onSignatureChange?: (signature: string, text: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface TypedSignatureRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  getText: () => string;
  getFont: () => string;
  getFontSize: () => number;
}

// Available signature fonts
const SIGNATURE_FONTS = [
  { name: 'Dancing Script', value: 'Dancing Script, cursive', category: 'Cursive' },
  { name: 'Great Vibes', value: 'Great Vibes, cursive', category: 'Cursive' },
  { name: 'Pacifico', value: 'Pacifico, cursive', category: 'Cursive' },
  { name: 'Satisfy', value: 'Satisfy, cursive', category: 'Cursive' },
  { name: 'Caveat', value: 'Caveat, cursive', category: 'Handwriting' },
  { name: 'Kalam', value: 'Kalam, cursive', category: 'Handwriting' },
  { name: 'Permanent Marker', value: 'Permanent Marker, cursive', category: 'Handwriting' },
  { name: 'Times New Roman', value: 'Times New Roman, serif', category: 'Serif' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'Serif' },
  { name: 'Arial', value: 'Arial, sans-serif', category: 'Sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif', category: 'Sans-serif' },
];

export const TypedSignature = forwardRef<TypedSignatureRef, TypedSignatureProps>(({
  width = 400,
  height = 150,
  text = '',
  font = 'Dancing Script, cursive',
  fontSize = 32,
  textColor = '#000000',
  backgroundColor = '#ffffff',
  onTextChange,
  onFontChange,
  onFontSizeChange,
  onSignatureChange,
  disabled = false,
  className
}, ref) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localText, setLocalText] = useState(text);
  const [localFont, setLocalFont] = useState(font);
  const [localFontSize, setLocalFontSize] = useState(fontSize);

  // Generate signature on canvas
  const generateSignature = useCallback((
    canvasText: string = localText,
    canvasFont: string = localFont,
    canvasFontSize: number = localFontSize
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasText.trim()) {
      onSignatureChange?.('', canvasText);
      return '';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configure text rendering
    ctx.font = `${canvasFontSize}px ${canvasFont}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.imageSmoothingEnabled = true;

    // Handle text wrapping if needed
    const maxWidth = canvas.width - 20; // 10px padding on each side
    const words = canvasText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate vertical positioning
    const lineHeight = canvasFontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

    // Draw each line
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      ctx.fillText(line, canvas.width / 2, y);
    });

    // Generate data URL
    const dataURL = canvas.toDataURL('image/png', 0.92);
    onSignatureChange?.(dataURL, canvasText);
    return dataURL;
  }, [localText, localFont, localFontSize, textColor, backgroundColor, onSignatureChange]);

  // Handle text change
  const handleTextChange = useCallback((newText: string) => {
    setLocalText(newText);
    onTextChange?.(newText);
    generateSignature(newText, localFont, localFontSize);
  }, [localFont, localFontSize, onTextChange, generateSignature]);

  // Handle font change
  const handleFontChange = useCallback((newFont: string) => {
    setLocalFont(newFont);
    onFontChange?.(newFont);
    generateSignature(localText, newFont, localFontSize);
  }, [localText, localFontSize, onFontChange, generateSignature]);

  // Handle font size change
  const handleFontSizeChange = useCallback((newFontSize: number) => {
    setLocalFontSize(newFontSize);
    onFontSizeChange?.(newFontSize);
    generateSignature(localText, localFont, newFontSize);
  }, [localText, localFont, onFontSizeChange, generateSignature]);

  // Update canvas when props change
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    setLocalFont(font);
  }, [font]);

  useEffect(() => {
    setLocalFontSize(fontSize);
  }, [fontSize]);

  // Regenerate signature when canvas dimensions change
  useEffect(() => {
    const timer = setTimeout(() => {
      generateSignature();
    }, 100);
    return () => clearTimeout(timer);
  }, [width, height, generateSignature]);

  // Load Google Fonts dynamically
  useEffect(() => {
    const googleFonts = SIGNATURE_FONTS
      .filter(f => f.category === 'Cursive' || f.category === 'Handwriting')
      .map(f => f.name.replace(/\s+/g, '+'));

    if (googleFonts.length > 0) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f}:wght@400`).join('&')}&display=swap`;
      link.rel = 'stylesheet';
      
      // Check if already loaded
      const existingLink = document.querySelector(`link[href="${link.href}"]`);
      if (!existingLink) {
        document.head.appendChild(link);
      }
    }
  }, []);

  // Expose ref methods
  useImperativeHandle(ref, () => ({
    clear: () => {
      setLocalText('');
      onTextChange?.('');
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      onSignatureChange?.('', '');
    },
    
    isEmpty: () => {
      return !localText.trim();
    },
    
    toDataURL: (type = 'image/png', encoderOptions = 0.92) => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL(type, encoderOptions) : '';
    },
    
    getText: () => localText,
    getFont: () => localFont,
    getFontSize: () => localFontSize
  }), [localText, localFont, localFontSize, backgroundColor, onTextChange, onSignatureChange]);

  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Text input */}
      <TextField
        fullWidth
        label="Your Name"
        placeholder="Type your name here"
        value={localText}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled}
        variant="outlined"
        size="small"
        inputProps={{ maxLength: 100 }}
        helperText="Enter your name as you want it to appear in your signature"
      />

      {/* Font and size controls */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
          <InputLabel>Signature Font</InputLabel>
          <Select
            value={localFont}
            label="Signature Font"
            onChange={(e) => handleFontChange(e.target.value)}
            disabled={disabled}
          >
            {SIGNATURE_FONTS.map((fontOption) => (
              <MenuItem 
                key={fontOption.value} 
                value={fontOption.value}
                sx={{ fontFamily: fontOption.value, fontSize: '1.1rem' }}
              >
                {fontOption.name} <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>({fontOption.category})</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ minWidth: 120, flex: 1 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Font Size: {localFontSize}px
          </Typography>
          <Slider
            value={localFontSize}
            onChange={(_, newValue) => handleFontSizeChange(newValue as number)}
            disabled={disabled}
            min={16}
            max={48}
            step={2}
            marks={[
              { value: 16, label: '16' },
              { value: 24, label: '24' },
              { value: 32, label: '32' },
              { value: 40, label: '40' },
              { value: 48, label: '48' }
            ]}
            size="small"
            valueLabelDisplay="auto"
          />
        </Box>
      </Box>

      {/* Signature preview */}
      <Paper
        variant="outlined"
        sx={{
          p: 1,
          backgroundColor: backgroundColor,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          ...(disabled && {
            opacity: 0.6
          })
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        
        {/* Empty state message */}
        {!localText.trim() && (
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'text.secondary',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2">
              Type your name above to see your signature preview
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Font preview */}
      {localText.trim() && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            color="textSecondary" 
            gutterBottom
          >
            Preview:
          </Typography>
          <Typography
            sx={{
              fontFamily: localFont,
              fontSize: `${Math.min(localFontSize, 24)}px`,
              color: textColor,
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            {localText}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

TypedSignature.displayName = 'TypedSignature';