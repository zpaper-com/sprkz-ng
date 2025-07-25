import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  TextFields as TextIcon,
} from '@mui/icons-material';

export interface TextAreaDialogProps {
  open: boolean;
  onClose: () => void;
  onTextAreaCreate: (
    text: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    backgroundColor: string | undefined,
    borderColor: string | undefined,
    textAlign: 'left' | 'center' | 'right',
    bold: boolean,
    italic: boolean,
    underline: boolean,
    width: number,
    height: number
  ) => void;
  initialText?: string;
  initialFontSize?: number;
  initialFontFamily?: string;
  initialColor?: string;
  initialBackgroundColor?: string;
  initialBorderColor?: string;
  initialTextAlign?: 'left' | 'center' | 'right';
  initialBold?: boolean;
  initialItalic?: boolean;
  initialUnderline?: boolean;
  initialWidth?: number;
  initialHeight?: number;
}

// Font families
const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
];

// Predefined colors
const TEXT_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Green', value: '#008000' },
  { name: 'Orange', value: '#ffa500' },
  { name: 'Purple', value: '#800080' },
  { name: 'Gray', value: '#808080' },
];

const BACKGROUND_COLORS = [
  { name: 'None', value: '' },
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f0f0f0' },
  { name: 'Yellow', value: '#ffff99' },
  { name: 'Light Blue', value: '#add8e6' },
  { name: 'Light Green', value: '#90ee90' },
  { name: 'Light Pink', value: '#ffb6c1' },
  { name: 'Light Orange', value: '#ffd700' },
];

export const TextAreaDialog: React.FC<TextAreaDialogProps> = ({
  open,
  onClose,
  onTextAreaCreate,
  initialText = '',
  initialFontSize = 14,
  initialFontFamily = 'Arial, sans-serif',
  initialColor = '#000000',
  initialBackgroundColor = '',
  initialBorderColor = '',
  initialTextAlign = 'left',
  initialBold = false,
  initialItalic = false,
  initialUnderline = false,
  initialWidth = 200,
  initialHeight = 100,
}) => {
  const [text, setText] = useState<string>(initialText);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [fontFamily, setFontFamily] = useState<string>(initialFontFamily);
  const [textColor, setTextColor] = useState<string>(initialColor);
  const [backgroundColor, setBackgroundColor] = useState<string>(initialBackgroundColor);
  const [borderColor, setBorderColor] = useState<string>(initialBorderColor);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(initialTextAlign);
  const [bold, setBold] = useState<boolean>(initialBold);
  const [italic, setItalic] = useState<boolean>(initialItalic);
  const [underline, setUnderline] = useState<boolean>(initialUnderline);
  const [showBorder, setShowBorder] = useState<boolean>(!!initialBorderColor);
  const [textBoxWidth, setTextBoxWidth] = useState<number>(initialWidth);
  const [textBoxHeight, setTextBoxHeight] = useState<number>(initialHeight);

  // Update state when initial values change (for edit mode)
  useEffect(() => {
    setText(initialText);
    setFontSize(initialFontSize);
    setFontFamily(initialFontFamily);
    setTextColor(initialColor);
    setBackgroundColor(initialBackgroundColor);
    setBorderColor(initialBorderColor);
    setTextAlign(initialTextAlign);
    setBold(initialBold);
    setItalic(initialItalic);
    setUnderline(initialUnderline);
    setShowBorder(!!initialBorderColor);
    setTextBoxWidth(initialWidth);
    setTextBoxHeight(initialHeight);
  }, [initialText, initialFontSize, initialFontFamily, initialColor, initialBackgroundColor, 
      initialBorderColor, initialTextAlign, initialBold, initialItalic, initialUnderline, 
      initialWidth, initialHeight]);

  // Update border color when showBorder changes
  useEffect(() => {
    if (showBorder && !borderColor) {
      setBorderColor('#cccccc');
    } else if (!showBorder) {
      setBorderColor('');
    }
  }, [showBorder, borderColor]);

  // Handle format button toggles
  const handleFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setBold(newFormats.includes('bold'));
    setItalic(newFormats.includes('italic'));
    setUnderline(newFormats.includes('underline'));
  };

  // Handle text alignment
  const handleAlignmentChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: 'left' | 'center' | 'right' | null,
  ) => {
    if (newAlignment !== null) {
      setTextAlign(newAlignment);
    }
  };

  // Get current format array for ToggleButtonGroup
  const getCurrentFormats = (): string[] => {
    const formats: string[] = [];
    if (bold) formats.push('bold');
    if (italic) formats.push('italic');
    if (underline) formats.push('underline');
    return formats;
  };

  // Handle text area creation
  const handleCreateTextArea = () => {
    if (text.trim()) {
      onTextAreaCreate(
        text,
        fontSize,
        fontFamily,
        textColor,
        backgroundColor || undefined,
        borderColor || undefined,
        textAlign,
        bold,
        italic,
        underline,
        textBoxWidth,
        textBoxHeight
      );
    }
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset to defaults
    setText(initialText);
    setFontSize(14);
    setFontFamily('Arial, sans-serif');
    setTextColor('#000000');
    setBackgroundColor('');
    setBorderColor('');
    setTextAlign('left');
    setBold(false);
    setItalic(false);
    setUnderline(false);
    setShowBorder(false);
    setTextBoxWidth(200);
    setTextBoxHeight(100);
    onClose();
  };

  // Calculate estimated text height based on content
  const getEstimatedTextHeight = (): number => {
    const lines = text.split('\n').length;
    const lineHeight = fontSize * 1.2;
    return Math.max(lines * lineHeight + 20, 50); // Add padding
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextIcon />
          Add Text Area
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Text Content */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Text Content
            </Typography>
            <TextField
              label="Enter your text"
              multiline
              rows={4}
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your text here... Use Enter for line breaks."
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Font Settings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Font Settings
            </Typography>
            
            {/* Font Family */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Font Family</InputLabel>
              <Select
                value={fontFamily}
                label="Font Family"
                onChange={(e) => setFontFamily(e.target.value)}
              >
                {FONT_FAMILIES.map((font) => (
                  <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                    {font.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Font Size */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Font Size: {fontSize}px
              </Typography>
              <Slider
                value={fontSize}
                onChange={(_, value) => setFontSize(value as number)}
                min={8}
                max={72}
                valueLabelDisplay="auto"
                marks={[
                  { value: 8, label: '8px' },
                  { value: 12, label: '12px' },
                  { value: 16, label: '16px' },
                  { value: 24, label: '24px' },
                  { value: 36, label: '36px' },
                  { value: 72, label: '72px' },
                ]}
              />
            </Box>

            {/* Text Formatting */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Text Formatting
              </Typography>
              <ToggleButtonGroup
                value={getCurrentFormats()}
                onChange={handleFormatChange}
                aria-label="text formatting"
                size="small"
              >
                <ToggleButton value="bold" aria-label="bold">
                  <BoldIcon />
                </ToggleButton>
                <ToggleButton value="italic" aria-label="italic">
                  <ItalicIcon />
                </ToggleButton>
                <ToggleButton value="underline" aria-label="underline">
                  <UnderlineIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Text Alignment */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Text Alignment
              </Typography>
              <ToggleButtonGroup
                value={textAlign}
                exclusive
                onChange={handleAlignmentChange}
                aria-label="text alignment"
                size="small"
              >
                <ToggleButton value="left" aria-label="left aligned">
                  <AlignLeftIcon />
                </ToggleButton>
                <ToggleButton value="center" aria-label="centered">
                  <AlignCenterIcon />
                </ToggleButton>
                <ToggleButton value="right" aria-label="right aligned">
                  <AlignRightIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          {/* Colors and Appearance */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Colors & Appearance
            </Typography>

            {/* Text Color */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Text Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {TEXT_COLORS.map((color) => (
                  <Box
                    key={color.value}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color.value,
                      border: textColor === color.value ? '3px solid blue' : '1px solid #ccc',
                      cursor: 'pointer',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => setTextColor(color.value)}
                    title={color.name}
                  >
                    {color.value === '#ffffff' && (
                      <Typography variant="caption" sx={{ color: '#000', fontSize: '10px' }}>
                        T
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: 40, height: 32, border: 'none', borderRadius: 4 }}
              />
            </Box>

            {/* Background Color */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Background Color
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {BACKGROUND_COLORS.map((color) => (
                  <Box
                    key={color.value || 'none'}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color.value || 'transparent',
                      border: backgroundColor === color.value ? '3px solid blue' : '1px solid #ccc',
                      cursor: 'pointer',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: color.value === '' 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : 'none',
                      backgroundSize: color.value === '' ? '8px 8px' : 'auto',
                      backgroundPosition: color.value === '' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
                    }}
                    onClick={() => setBackgroundColor(color.value)}
                    title={color.name}
                  />
                ))}
              </Box>
              <input
                type="color"
                value={backgroundColor || '#ffffff'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ width: 40, height: 32, border: 'none', borderRadius: 4 }}
              />
            </Box>

            {/* Border */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                  />
                }
                label="Show Border"
              />
              {showBorder && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Border Color
                  </Typography>
                  <input
                    type="color"
                    value={borderColor || '#cccccc'}
                    onChange={(e) => setBorderColor(e.target.value)}
                    style={{ width: 40, height: 32, border: 'none', borderRadius: 4 }}
                  />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Size Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Text Box Size
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Width: {textBoxWidth}px
                </Typography>
                <Slider
                  value={textBoxWidth}
                  onChange={(_, value) => setTextBoxWidth(value as number)}
                  min={50}
                  max={500}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Height: {textBoxHeight}px
                </Typography>
                <Slider
                  value={textBoxHeight}
                  onChange={(_, value) => setTextBoxHeight(value as number)}
                  min={30}
                  max={300}
                  valueLabelDisplay="auto"
                />
                <Button
                  size="small"
                  onClick={() => setTextBoxHeight(getEstimatedTextHeight())}
                  sx={{ mt: 1 }}
                >
                  Auto-fit Height
                </Button>
              </Grid>
            </Grid>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            
            <Paper
              sx={{
                p: 2,
                backgroundColor: 'grey.50',
                minHeight: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {text ? (
                <Box
                  sx={{
                    width: Math.min(textBoxWidth, 400),
                    height: Math.min(textBoxHeight, 200),
                    backgroundColor: backgroundColor || 'transparent',
                    border: borderColor ? `1px solid ${borderColor}` : 'none',
                    borderRadius: 1,
                    padding: 1,
                    display: 'flex',
                    alignItems: textAlign === 'center' ? 'center' : 'flex-start',
                    justifyContent: textAlign,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: `${Math.min(fontSize, 20)}px`,
                      fontFamily: fontFamily,
                      color: textColor,
                      fontWeight: bold ? 'bold' : 'normal',
                      fontStyle: italic ? 'italic' : 'normal',
                      textDecoration: underline ? 'underline' : 'none',
                      textAlign: textAlign,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                    }}
                  >
                    {text}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Preview will appear here when you enter text
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateTextArea}
          variant="contained"
          startIcon={<TextIcon />}
          disabled={!text.trim()}
        >
          Add Text Area
        </Button>
      </DialogActions>
    </Dialog>
  );
};