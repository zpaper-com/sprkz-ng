import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAdmin } from '../../contexts/AdminContext';
import FeatureTable from './FeatureTable';
import FeatureDialog from './FeatureDialog';
import { Feature } from '../../contexts/AdminContext';

const FeatureManagement: React.FC = () => {
  const { state, actions } = useAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCreateFeature = () => {
    setEditingFeature(null);
    setDialogOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setDialogOpen(true);
  };

  const handleDeleteFeature = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      try {
        await actions.deleteFeature(id);
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Failed to delete feature:', error);
      }
    }
  };

  const handleSaveFeature = async (featureData: Omit<Feature, 'id' | 'creationDate'>) => {
    try {
      if (editingFeature) {
        await actions.updateFeature(editingFeature.id, featureData);
      } else {
        await actions.createFeature(featureData);
      }
      setDialogOpen(false);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save feature:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Feature Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateFeature}
        >
          Add Feature
        </Button>
      </Box>

      <Paper>
        <FeatureTable
          features={state.features}
          loading={state.loading}
          onEdit={handleEditFeature}
          onDelete={handleDeleteFeature}
        />
      </Paper>

      <FeatureDialog
        open={dialogOpen}
        feature={editingFeature}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveFeature}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Operation completed successfully!
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

export default FeatureManagement;