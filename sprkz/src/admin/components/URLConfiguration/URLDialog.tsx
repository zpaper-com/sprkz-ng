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
import { Layout } from '../../types/layout';
import { Webhook } from '../../types/webhook';
import { Automation } from '../../types/automation';

interface URLDialogProps {
  open: boolean;
  url?: URLConfig | null;
  pdfs: PDFFile[];
  layouts: Layout[];
  webhooks: Webhook[];
  automations: Automation[];
  onClose: () => void;
  onSave: (url: Omit<URLConfig, 'id' | 'createdAt'>) => void;
}

const RESERVED_PATHS = ['/mobile', '/health', '/admin', '/'];

const URLDialog: React.FC<URLDialogProps> = ({
  open,
  url,
  pdfs,
  layouts,
  webhooks,
  automations,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    path: '',
    pdfPath: '',
    desktopLayoutId: undefined as number | undefined,
    mobileLayoutId: undefined as number | undefined,
    webhookId: undefined as number | undefined,
    automationId: undefined as number | undefined,
  });
  const [pathError, setPathError] = useState('');

  useEffect(() => {
    if (url) {
      setFormData({
        path: url.path,
        pdfPath: url.pdfPath || '',
        desktopLayoutId: url.desktopLayoutId,
        mobileLayoutId: url.mobileLayoutId,
        webhookId: url.webhookId,
        automationId: url.automationId,
      });
    } else {
      setFormData({
        path: '',
        pdfPath: '',
        desktopLayoutId: undefined,
        mobileLayoutId: undefined,
        webhookId: undefined,
        automationId: undefined,
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
    setFormData((prev) => ({ ...prev, path: newPath }));
    setPathError(validatePath(newPath));
  };

  const handlePDFChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFormData((prev) => ({ ...prev, pdfPath: event.target.value as string }));
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
      desktopLayoutId: formData.desktopLayoutId,
      mobileLayoutId: formData.mobileLayoutId,
      webhookId: formData.webhookId,
      automationId: formData.automationId,
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

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Desktop Layout (Optional)</InputLabel>
            <Select
              value={formData.desktopLayoutId || ''}
              label="Desktop Layout (Optional)"
              onChange={(e) => setFormData(prev => ({ ...prev, desktopLayoutId: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <MenuItem value="">
                <em>Use default desktop layout</em>
              </MenuItem>
              {layouts.filter(layout => layout.is_active && (layout.type === 'desktop' || layout.type === 'custom')).map((layout) => (
                <MenuItem key={layout.id} value={layout.id}>
                  {layout.name} ({layout.type})
                  {layout.is_default && ' - Default'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Mobile Layout (Optional)</InputLabel>
            <Select
              value={formData.mobileLayoutId || ''}
              label="Mobile Layout (Optional)"
              onChange={(e) => setFormData(prev => ({ ...prev, mobileLayoutId: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <MenuItem value="">
                <em>Use default mobile layout</em>
              </MenuItem>
              {layouts.filter(layout => layout.is_active && (layout.type === 'mobile' || layout.type === 'tablet' || layout.type === 'custom')).map((layout) => (
                <MenuItem key={layout.id} value={layout.id}>
                  {layout.name} ({layout.type})
                  {layout.is_default && ' - Default'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Form Submission Webhook (Optional)</InputLabel>
            <Select
              value={formData.webhookId || ''}
              label="Form Submission Webhook (Optional)"
              onChange={(e) => setFormData(prev => ({ ...prev, webhookId: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <MenuItem value="">
                <em>No webhook - forms will not trigger HTTP calls</em>
              </MenuItem>
              {webhooks.filter(webhook => webhook.is_active).map((webhook) => (
                <MenuItem key={webhook.id} value={webhook.id}>
                  {webhook.name} ({webhook.method} → {webhook.url})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Form Submission Automation (Optional)</InputLabel>
            <Select
              value={formData.automationId || ''}
              label="Form Submission Automation (Optional)"
              onChange={(e) => setFormData(prev => ({ ...prev, automationId: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <MenuItem value="">
                <em>No automation - forms will not trigger automated workflows</em>
              </MenuItem>
              {automations.filter(automation => automation.is_active).map((automation) => (
                <MenuItem key={automation.id} value={automation.id}>
                  {automation.name} ({automation.trigger_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {RESERVED_PATHS.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Reserved paths that cannot be used:</strong>
              <br />
              {RESERVED_PATHS.join(', ')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!isValid}>
          {url ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default URLDialog;
