import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { URLConfig, PDFFile } from '../../contexts/AdminContext';

interface URLDialogProps {
  open: boolean;
  url?: URLConfig | null;
  pdfs: PDFFile[];
  onClose: () => void;
  onSave: (url: Omit<URLConfig, 'id' | 'createdAt'>) => void;
}

const RESERVED_PATHS = ['/mobile', '/health', '/admin', '/'];

const URLDialog: React.FC<URLDialogProps> = ({
  open,
  url,
  pdfs,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    path: '',
    pdfPath: '',
  });
  const [pathError, setPathError] = useState('');

  useEffect(() => {
    if (url) {
      setFormData({
        path: url.path,
        pdfPath: url.pdfPath || '',
      });
    } else {
      setFormData({
        path: '',
        pdfPath: '',
      });
    }
    setPathError('');
  }, [url, open]);

  const validatePath = (path: string): string => {
    if (!path.trim()) {
      return 'Path is required';
    }
    
    if (!path.startsWith('/')) {
      return 'Path must start with /';
    }
    
    if (RESERVED_PATHS.includes(path)) {
      return `Path '${path}' is reserved and cannot be used`;
    }
    
    if (path.includes('//') || path.includes(' ')) {
      return 'Path contains invalid characters';
    }
    
    return '';
  };

  const handlePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = event.target.value;
    setFormData(prev => ({ ...prev, path: newPath }));
    setPathError(validatePath(newPath));
  };

  const handlePDFChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFormData(prev => ({ ...prev, pdfPath: event.target.value as string }));
  };

  const handleSave = () => {
    const pathValidationError = validatePath(formData.path);
    if (pathValidationError) {
      setPathError(pathValidationError);
      return;
    }

    onSave({
      path: formData.path.trim(),
      pdfPath: formData.pdfPath || undefined,
      features: url?.features || {},
      pdfFields: url?.pdfFields || {},
    });
  };

  const isValid = formData.path.trim().length > 0 && !pathError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {url ? 'Edit URL Configuration' : 'Create New URL Configuration'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="URL Path"
            value={formData.path}
            onChange={handlePathChange}
            margin="normal"
            required
            error={!!pathError}
            helperText={pathError || 'Enter the URL path (e.g., /my-form)'}
            placeholder="/my-form"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>PDF File</InputLabel>
            <Select
              value={formData.pdfPath}
              label="PDF File"
              onChange={handlePDFChange}
            >
              <MenuItem value="">
                <em>Use default PDF (makana2025.pdf)</em>
              </MenuItem>
              {pdfs.map((pdf) => (
                <MenuItem key={pdf.filename} value={pdf.filename}>
                  {pdf.filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {RESERVED_PATHS.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Reserved paths that cannot be used:</strong><br />
              {RESERVED_PATHS.join(', ')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isValid}
        >
          {url ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default URLDialog;