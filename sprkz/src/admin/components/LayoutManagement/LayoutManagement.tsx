import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Phone as PhoneIcon,
  Computer as ComputerIcon,
  Tablet as TabletIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';
import { Layout, LayoutFormData, AVAILABLE_COMPONENTS } from '../../types/layout';
import { layoutService } from '../../services/layoutService';

const LayoutManagement: React.FC = () => {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLayout, setEditingLayout] = useState<Layout | null>(null);
  const [formData, setFormData] = useState<LayoutFormData>({
    name: '',
    type: 'desktop',
    description: '',
    viewport: '',
    components: [],
    notes: ''
  });

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      setLoading(true);
      const data = await layoutService.getAllLayouts();
      setLayouts(data);
    } catch (err) {
      setError('Failed to load layouts');
      console.error('Error loading layouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (layout?: Layout) => {
    if (layout) {
      setEditingLayout(layout);
      setFormData({
        name: layout.name,
        type: layout.type,
        description: layout.description,
        viewport: layout.viewport,
        components: [...layout.components],
        notes: layout.notes || ''
      });
    } else {
      setEditingLayout(null);
      setFormData({
        name: '',
        type: 'desktop',
        description: '',
        viewport: '',
        components: [],
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLayout(null);
  };

  const handleSave = async () => {
    try {
      if (editingLayout) {
        await layoutService.updateLayout(editingLayout.id, formData);
        setSuccess('Layout updated successfully');
      } else {
        await layoutService.createLayout(formData);
        setSuccess('Layout created successfully');
      }
      
      await loadLayouts();
      handleCloseDialog();
    } catch (err) {
      setError(editingLayout ? 'Failed to update layout' : 'Failed to create layout');
      console.error('Error saving layout:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this layout?')) {
      return;
    }

    try {
      await layoutService.deleteLayout(id);
      setSuccess('Layout deleted successfully');
      await loadLayouts();
    } catch (err) {
      setError('Failed to delete layout');
      console.error('Error deleting layout:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await layoutService.setDefaultLayout(id);
      setSuccess('Default layout updated');
      await loadLayouts();
    } catch (err) {
      setError('Failed to set default layout');
      console.error('Error setting default layout:', err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await layoutService.toggleLayoutActive(id);
      await loadLayouts();
    } catch (err) {
      setError('Failed to toggle layout status');
      console.error('Error toggling layout:', err);
    }
  };

  const handleComponentChange = (component: string) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.includes(component)
        ? prev.components.filter(c => c !== component)
        : [...prev.components, component]
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <PhoneIcon />;
      case 'tablet': return <TabletIcon />;
      case 'desktop': return <ComputerIcon />;
      default: return <ExtensionIcon />;
    }
  };

  if (loading) {
    return <Typography>Loading layouts...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Layout Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Layout
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Manage layout configurations for different device types and user experiences.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Viewport</TableCell>
              <TableCell>Components</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {layouts.map((layout) => (
              <TableRow key={layout.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTypeIcon(layout.type)}
                    <Box>
                      <Typography variant="subtitle2">
                        {layout.name}
                        {layout.isDefault && (
                          <Chip 
                            label="Default" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {layout.description}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={layout.type} 
                    variant="outlined"
                    color={layout.type === 'desktop' ? 'primary' : layout.type === 'mobile' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {layout.viewport}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {layout.components.length} components
                  </Typography>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={layout.isActive}
                    onChange={() => handleToggleActive(layout.id)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleSetDefault(layout.id)}
                      disabled={layout.isDefault}
                      title={layout.isDefault ? 'Already default' : 'Set as default'}
                    >
                      {layout.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(layout)}
                      title="Edit layout"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(layout.id)}
                      disabled={layout.isDefault}
                      title={layout.isDefault ? 'Cannot delete default layout' : 'Delete layout'}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLayout ? 'Edit Layout' : 'Add New Layout'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Layout Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="desktop">Desktop</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="tablet">Tablet</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Viewport"
                value={formData.viewport}
                onChange={(e) => setFormData(prev => ({ ...prev, viewport: e.target.value }))}
                placeholder="e.g., 1920x1080"
                helperText="Format: WIDTHxHEIGHT"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Components
              </Typography>
              <FormGroup row>
                {AVAILABLE_COMPONENTS.map((component) => (
                  <FormControlLabel
                    key={component}
                    control={
                      <Checkbox
                        checked={formData.components.includes(component)}
                        onChange={() => handleComponentChange(component)}
                      />
                    }
                    label={component}
                  />
                ))}
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Additional notes about this layout..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingLayout ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LayoutManagement;