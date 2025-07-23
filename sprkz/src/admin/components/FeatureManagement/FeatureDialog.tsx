import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { Feature } from '../../contexts/AdminContext';

interface FeatureDialogProps {
  open: boolean;
  feature?: Feature | null;
  onClose: () => void;
  onSave: (feature: Omit<Feature, 'id' | 'creationDate'>) => void;
}

const FeatureDialog: React.FC<FeatureDialogProps> = ({
  open,
  feature,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name,
        description: feature.description || '',
        notes: feature.notes || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        notes: '',
      });
    }
  }, [feature, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  const isValid = formData.name.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {feature ? 'Edit Feature' : 'Create New Feature'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Feature Name"
            value={formData.name}
            onChange={handleChange('name')}
            margin="normal"
            required
            error={!formData.name.trim()}
            helperText={!formData.name.trim() ? 'Feature name is required' : ''}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            margin="normal"
            multiline
            rows={3}
            placeholder="Brief description of what this feature does"
          />
          <TextField
            fullWidth
            label="Notes"
            value={formData.notes}
            onChange={handleChange('notes')}
            margin="normal"
            multiline
            rows={3}
            placeholder="Additional notes or implementation details"
          />
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
          {feature ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureDialog;