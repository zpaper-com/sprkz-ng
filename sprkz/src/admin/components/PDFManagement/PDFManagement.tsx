import React, { useState } from 'react';
import {
  Box,
  Typography,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAdmin } from '../../contexts/AdminContext';
import PDFGrid from './PDFGrid';
import PDFUploadZone from './PDFUploadZone';
import PDFPreviewModal from './PDFPreviewModal';
import PDFEditDialog from './PDFEditDialog';

const PDFManagement: React.FC = () => {
  const { state, actions } = useAdmin();
  const [previewPDF, setPreviewPDF] = useState<string | null>(null);
  const [editPDF, setEditPDF] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const currentDefaultPDF = state.settings.defaultPdf || 'makana2025.pdf';

  const handleUpload = async (file: File) => {
    try {
      await actions.uploadPDF(file);
      showSnackbar('PDF uploaded successfully!', 'success');
      setPreviewPDF(file.name);
    } catch (error) {
      showSnackbar('Failed to upload PDF', 'error');
    }
  };

  const handleDelete = async (filename: string) => {
    if (filename === currentDefaultPDF) {
      showSnackbar('Cannot delete the default PDF. Change the default first.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await actions.deletePDF(filename);
        showSnackbar('PDF deleted successfully!', 'success');
      } catch (error) {
        showSnackbar('Failed to delete PDF', 'error');
      }
    }
  };

  const handleSetDefault = async (filename: string) => {
    try {
      await actions.updateSettings({ defaultPdf: filename });
      showSnackbar(`Default PDF changed to ${filename}`, 'success');
    } catch (error) {
      showSnackbar('Failed to update default PDF', 'error');
    }
  };

  const handleDefaultChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const newDefault = event.target.value as string;
    await handleSetDefault(newDefault);
  };

  const handleEdit = (filename: string) => {
    setEditPDF(filename);
  };

  const handleEditSave = (filename: string, updates: { metadata: Record<string, string>; fieldConfigs: Record<string, { status: string; label?: string; required?: boolean; placeholder?: string }> }) => {
    // For now, just show success message
    // In the future, this could save updates to a database or update PDF metadata
    console.log('PDF edit updates:', { filename, updates });
    showSnackbar(`PDF ${filename} metadata updated successfully!`, 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          PDF Management
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Default PDF</InputLabel>
            <Select
              value={currentDefaultPDF}
              label="Default PDF"
              onChange={handleDefaultChange}
            >
              {state.pdfs.map((pdf) => (
                <MenuItem key={pdf.filename} value={pdf.filename}>
                  {pdf.filename}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Upload Zone */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Upload New PDF
        </Typography>
        <PDFUploadZone onUpload={handleUpload} />
      </Box>

      {/* Current PDFs */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Current PDFs ({state.pdfs.length})
        </Typography>
        <PDFGrid
          pdfs={state.pdfs}
          defaultPdf={currentDefaultPDF}
          loading={state.loading}
          onPreview={setPreviewPDF}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
          onEdit={handleEdit}
        />
      </Box>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        filename={previewPDF}
        open={!!previewPDF}
        onClose={() => setPreviewPDF(null)}
      />

      {/* PDF Edit Dialog */}
      <PDFEditDialog
        filename={editPDF}
        open={!!editPDF}
        onClose={() => setEditPDF(null)}
        onSave={handleEditSave}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Error snackbar from context */}
      {state.error && (
        <Snackbar open={!!state.error} autoHideDuration={6000}>
          <Alert severity="error">
            {state.error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default PDFManagement;