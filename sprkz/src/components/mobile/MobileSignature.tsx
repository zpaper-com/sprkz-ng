import React, { useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SignatureCanvas from 'react-signature-canvas';
import ClearIcon from '@mui/icons-material/Clear';
import CreateIcon from '@mui/icons-material/Create';

interface MobileSignatureProps {
  open: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  fieldName?: string;
}

const MobileSignature: React.FC<MobileSignatureProps> = ({
  open,
  onClose,
  onSave,
  fieldName = 'Signature',
}) => {
  const theme = useTheme();
  const canvasRef = useRef<SignatureCanvas>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureFont, setSignatureFont] = useState('cursive');
  const [isEmpty, setIsEmpty] = useState(true);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDrawingChange = useCallback(() => {
    if (canvasRef.current) {
      setIsEmpty(canvasRef.current.isEmpty());
    }
  }, []);

  const handleClear = () => {
    if (activeTab === 0) {
      canvasRef.current?.clear();
      setIsEmpty(true);
    } else {
      setTypedSignature('');
    }
  };

  const handleSave = () => {
    let signatureData = '';

    if (activeTab === 0) {
      // Drawing signature
      if (canvasRef.current && !canvasRef.current.isEmpty()) {
        signatureData = canvasRef.current.toDataURL();
      }
    } else {
      // Typed signature
      if (typedSignature.trim()) {
        // Create a canvas with the typed signature
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 400;
          canvas.height = 100;
          
          // Set background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Set font style
          ctx.fillStyle = 'black';
          ctx.font = `32px ${signatureFont}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw text
          ctx.fillText(typedSignature.trim(), canvas.width / 2, canvas.height / 2);
          
          signatureData = canvas.toDataURL();
        }
      }
    }

    if (signatureData) {
      onSave(signatureData);
      onClose();
      handleClear();
    }
  };

  const canSave = activeTab === 0 ? !isEmpty : typedSignature.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen // Make it fullscreen on mobile for better experience
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {fieldName}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<CreateIcon />} label="Draw" />
          <Tab label="Type" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {activeTab === 0 ? (
            // Drawing Tab
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Draw your signature in the box below:
              </Typography>
              <Box
                sx={{
                  border: 2,
                  borderColor: theme.palette.grey[300],
                  borderRadius: 1,
                  backgroundColor: 'white',
                  mb: 2,
                  overflow: 'hidden',
                }}
              >
                <SignatureCanvas
                  ref={canvasRef}
                  canvasProps={{
                    width: window.innerWidth - 64, // Account for dialog padding
                    height: 200,
                    style: { width: '100%', height: '200px' },
                  }}
                  backgroundColor="white"
                  penColor="black"
                  onEnd={handleDrawingChange}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Use your finger or stylus to sign above
              </Typography>
            </Box>
          ) : (
            // Typing Tab
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type your signature:
              </Typography>
              <TextField
                fullWidth
                label="Your Name"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
                placeholder="Enter your full name"
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Font Style</InputLabel>
                <Select
                  value={signatureFont}
                  label="Font Style"
                  onChange={(e) => setSignatureFont(e.target.value)}
                >
                  <MenuItem value="cursive">Cursive</MenuItem>
                  <MenuItem value="serif">Serif</MenuItem>
                  <MenuItem value="sans-serif">Sans Serif</MenuItem>
                  <MenuItem value="monospace">Monospace</MenuItem>
                </Select>
              </FormControl>

              {typedSignature && (
                <Box
                  sx={{
                    border: 2,
                    borderColor: theme.palette.grey[300],
                    borderRadius: 1,
                    backgroundColor: 'white',
                    p: 2,
                    textAlign: 'center',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: signatureFont,
                      color: 'black',
                    }}
                  >
                    {typedSignature}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClear}
          variant="outlined"
          fullWidth
          disabled={activeTab === 0 ? isEmpty : !typedSignature.trim()}
        >
          Clear
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          fullWidth
          disabled={!canSave}
        >
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MobileSignature;