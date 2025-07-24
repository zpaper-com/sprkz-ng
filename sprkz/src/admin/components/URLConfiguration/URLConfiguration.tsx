import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAdmin } from '../../contexts/AdminContext';
import URLList from './URLList';
import URLDialog from './URLDialog';

const URLConfiguration: React.FC = () => {
  const { state, actions } = useAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingURL, setEditingURL] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleCreateURL = () => {
    setEditingURL(null);
    setDialogOpen(true);
  };

  const handleEditURL = (url: URLConfig) => {
    setEditingURL(url);
    setDialogOpen(true);
  };

  const handleDeleteURL = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this URL configuration?')) {
      try {
        await actions.deleteURL(id);
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Failed to delete URL:', error);
      }
    }
  };

  const handleSaveURL = async (urlData: Omit<URLConfig, 'id' | 'createdAt'>) => {
    try {
      if (editingURL) {
        await actions.updateURL(editingURL.id, urlData);
      } else {
        await actions.createURL(urlData);
      }
      setDialogOpen(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save URL:', error);
    }
  };

  const handleUpdateFeatures = async (urlId: number, features: { [featureId: number]: boolean }) => {
    try {
      // Update the URL in state with new feature configuration
      const updatedURL = state.urls.find(u => u.id === urlId);
      if (updatedURL) {
        // Send complete URL object with updated features to avoid database constraint violations
        await actions.updateURL(urlId, {
          path: updatedURL.path,
          pdfPath: updatedURL.pdfPath,
          features,
          pdfFields: updatedURL.pdfFields
        });
        
        // Show success message
        setSnackbarMessage('Feature settings updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Failed to update features:', error);
      setSnackbarMessage('Failed to update feature settings. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUpdatePDFFields = async (urlId: number, pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }) => {
    try {
      // Update the URL in state with new PDF field configuration
      const updatedURL = state.urls.find(u => u.id === urlId);
      if (updatedURL) {
        await actions.updateURL(urlId, { ...updatedURL, pdfFields });
        
        // Show success message
        setSnackbarMessage('PDF field settings updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Failed to update PDF fields:', error);
      setSnackbarMessage('Failed to update PDF field settings. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          URL Configuration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateURL}
        >
          Add URL
        </Button>
      </Box>

      <URLList
        urls={state.urls}
        features={state.features}
        pdfs={state.pdfs}
        loading={state.loading}
        onEdit={handleEditURL}
        onDelete={handleDeleteURL}
        onUpdateFeatures={handleUpdateFeatures}
        onUpdatePDFFields={handleUpdatePDFFields}
      />

      <URLDialog
        open={dialogOpen}
        url={editingURL}
        pdfs={state.pdfs}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveURL}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage || 'Operation completed successfully!'}
        </Alert>
      </Snackbar>

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

export default URLConfiguration;