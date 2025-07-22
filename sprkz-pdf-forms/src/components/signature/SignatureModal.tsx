import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Paper,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close,
  Brush,
  TextFields,
  Clear,
  Save,
  Undo,
  Redo
} from '@mui/icons-material';
import { SignatureCanvas } from './SignatureCanvas';
import { TypedSignature } from './TypedSignature';

export interface SignatureData {
  type: 'canvas' | 'typed';
  data: string; // Base64 image data
  metadata: {
    width: number;
    height: number;
    timestamp: number;
    font?: string;
    fontSize?: number;
    text?: string;
    optimized?: boolean;
    originalWidth?: number;
    originalHeight?: number;
  };
}

export interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signature: SignatureData) => void;
  fieldName?: string;
  existingSignature?: SignatureData;
  maxWidth?: number;
  maxHeight?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`signature-tabpanel-${index}`}
      aria-labelledby={`signature-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

export const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onClose,
  onSave,
  fieldName = 'Signature',
  existingSignature,
  maxWidth = 500,
  maxHeight = 200
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Signature state
  const [canvasSignature, setCanvasSignature] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState<string | null>(null);
  const [typedText, setTypedText] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>('Dancing Script');
  const [fontSize, setFontSize] = useState<number>(32);
  
  // Refs for signature components
  const canvasRef = useRef<any>(null);
  const typedRef = useRef<any>(null);
  
  // History for undo/redo (simplified)
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize with existing signature
  useEffect(() => {
    if (existingSignature) {
      if (existingSignature.type === 'canvas') {
        setCanvasSignature(existingSignature.data);
        setActiveTab(0);
      } else {
        setTypedSignature(existingSignature.data);
        setTypedText(existingSignature.metadata.text || '');
        setSelectedFont(existingSignature.metadata.font || 'Dancing Script');
        setFontSize(existingSignature.metadata.fontSize || 32);
        setActiveTab(1);
      }
    }
  }, [existingSignature]);

  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  // Handle canvas signature
  const handleCanvasSignature = useCallback((signature: string) => {
    setCanvasSignature(signature);
    // Add to history for undo/redo
    const newHistory = canvasHistory.slice(0, historyStep + 1);
    newHistory.push(signature);
    setCanvasHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [canvasHistory, historyStep]);

  // Handle typed signature
  const handleTypedSignature = useCallback((signature: string, text: string) => {
    setTypedSignature(signature);
    setTypedText(text);
  }, []);

  // Clear current signature
  const handleClear = useCallback(() => {
    if (activeTab === 0) {
      canvasRef.current?.clear();
      setCanvasSignature(null);
    } else {
      setTypedSignature(null);
      setTypedText('');
      typedRef.current?.clear();
    }
  }, [activeTab]);

  // Undo last action (canvas only)
  const handleUndo = useCallback(() => {
    if (activeTab === 0 && historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const previousSignature = canvasHistory[historyStep - 1];
      setCanvasSignature(previousSignature);
      canvasRef.current?.fromDataURL(previousSignature);
    }
  }, [activeTab, historyStep, canvasHistory]);

  // Redo last action (canvas only)
  const handleRedo = useCallback(() => {
    if (activeTab === 0 && historyStep < canvasHistory.length - 1) {
      setHistoryStep(historyStep + 1);
      const nextSignature = canvasHistory[historyStep + 1];
      setCanvasSignature(nextSignature);
      canvasRef.current?.fromDataURL(nextSignature);
    }
  }, [activeTab, historyStep, canvasHistory]);

  // Save signature
  const handleSave = useCallback(() => {
    const currentSignature = activeTab === 0 ? canvasSignature : typedSignature;
    
    if (!currentSignature) {
      return;
    }

    const signatureData: SignatureData = {
      type: activeTab === 0 ? 'canvas' : 'typed',
      data: currentSignature,
      metadata: {
        width: maxWidth,
        height: maxHeight,
        timestamp: Date.now(),
        ...(activeTab === 1 && {
          font: selectedFont,
          fontSize: fontSize,
          text: typedText
        })
      }
    };

    onSave(signatureData);
    handleClose();
  }, [activeTab, canvasSignature, typedSignature, maxWidth, maxHeight, selectedFont, fontSize, typedText, onSave]);

  // Close modal
  const handleClose = useCallback(() => {
    // Reset state
    setCanvasSignature(null);
    setTypedSignature(null);
    setTypedText('');
    setCanvasHistory([]);
    setHistoryStep(-1);
    setActiveTab(0);
    onClose();
  }, [onClose]);

  // Check if signature is ready to save
  const canSave = activeTab === 0 ? !!canvasSignature : !!typedSignature;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : 500,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Sign "{fieldName}"
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        {/* Mode tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="signature mode tabs"
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab
              icon={<Brush />}
              label="Draw"
              iconPosition="start"
              id="signature-tab-0"
              aria-controls="signature-tabpanel-0"
              sx={{ minHeight: 48 }}
            />
            <Tab
              icon={<TextFields />}
              label="Type"
              iconPosition="start"
              id="signature-tab-1"
              aria-controls="signature-tabpanel-1"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        {/* Drawing mode */}
        <TabPanel value={activeTab} index={0}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Use your mouse, finger, or stylus to draw your signature in the box below.
            </Typography>
            
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                mb: 2,
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'grey.50'
              }}
            >
              <SignatureCanvas
                ref={canvasRef}
                width={Math.min(maxWidth, isMobile ? 300 : 450)}
                height={Math.min(maxHeight, 150)}
                onSignatureChange={handleCanvasSignature}
                backgroundColor="#ffffff"
                penColor="#000000"
                minWidth={1}
                maxWidth={3}
              />
            </Paper>

            {/* Canvas controls */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                startIcon={<Clear />}
                onClick={handleClear}
                size="small"
                variant="outlined"
              >
                Clear
              </Button>
              <Button
                startIcon={<Undo />}
                onClick={handleUndo}
                size="small"
                variant="outlined"
                disabled={historyStep <= 0}
              >
                Undo
              </Button>
              <Button
                startIcon={<Redo />}
                onClick={handleRedo}
                size="small"
                variant="outlined"
                disabled={historyStep >= canvasHistory.length - 1}
              >
                Redo
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Typed mode */}
        <TabPanel value={activeTab} index={1}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Type your name below and select a font style for your signature.
            </Typography>
            
            <TypedSignature
              ref={typedRef}
              width={Math.min(maxWidth, isMobile ? 300 : 450)}
              height={Math.min(maxHeight, 150)}
              text={typedText}
              font={selectedFont}
              fontSize={fontSize}
              onTextChange={setTypedText}
              onFontChange={setSelectedFont}
              onFontSizeChange={setFontSize}
              onSignatureChange={handleTypedSignature}
            />
          </Box>
        </TabPanel>

        {/* Instructions */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> {
              activeTab === 0
                ? "For best results, sign slowly and use a steady hand. You can clear and redraw if needed."
                : "Choose a font that looks like your natural handwriting. You can preview different fonts before saving."
            }
          </Typography>
        </Alert>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<Save />}
          disabled={!canSave}
          color="primary"
        >
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};