import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { formFieldService, FormField } from '../../../services/formFieldService';
import { pdfService } from '../../../services/pdfService';

interface PDFEditDialogProps {
  filename: string | null;
  open: boolean;
  onClose: () => void;
  onSave?: (filename: string, updates: PDFEditData) => void;
}

interface PDFEditData {
  filename?: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modDate?: string;
  };
  fieldConfigs: {
    [fieldName: string]: {
      status: 'normal' | 'read-only' | 'hidden';
      label?: string;
      required?: boolean;
      placeholder?: string;
    };
  };
}

const PDFEditDialog: React.FC<PDFEditDialogProps> = ({
  filename,
  open,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFields, setPdfFields] = useState<FormField[]>([]);
  // Removed unused pdfMetadata state
  const [editData, setEditData] = useState<PDFEditData>({
    filename: '',
    metadata: {},
    fieldConfigs: {},
  });
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    fields: true,
  });
  const [editingField, setEditingField] = useState<string | null>(null);

  const loadPDFData = useCallback(async () => {
    if (!filename) return;

    setLoading(true);
    setError(null);

    try {
      // Construct full PDF URL from filename - handle both absolute and relative paths
      const pdfUrl = filename.startsWith('/') ? filename : `/pdfs/${filename}`;
      console.log('🔄 PDFEditDialog: Loading PDF from URL:', pdfUrl);
      
      // Load PDF document for metadata
      console.log('📄 PDFEditDialog: Loading PDF document...');
      const pdfDoc = await pdfService.loadPDF(pdfUrl);
      console.log('✅ PDFEditDialog: PDF document loaded successfully');
      
      // Extract metadata
      console.log('📊 PDFEditDialog: Extracting metadata...');
      const metadata = await pdfDoc.getMetadata();
      console.log('✅ PDFEditDialog: Metadata extracted:', metadata);
      
      setEditData(prev => ({
        ...prev,
        metadata: {
          title: metadata.info?.Title || '',
          author: metadata.info?.Author || '',
          subject: metadata.info?.Subject || '',
          keywords: metadata.info?.Keywords || '',
          creator: metadata.info?.Creator || '',
          producer: metadata.info?.Producer || '',
          creationDate: metadata.info?.CreationDate || '',
          modDate: metadata.info?.ModDate || '',
        },
      }));

      // Extract form fields using URL-based method (same as PDFFieldConfig)
      console.log('🔍 PDFEditDialog: Extracting form fields...');
      const fieldsResult = await formFieldService.extractAllFormFields(pdfUrl);
      console.log('✅ PDFEditDialog: Form fields extracted:', fieldsResult);
      
      // Convert the fields result to the expected format
      const formFields: FormField[] = fieldsResult.fields.map((fieldName, index) => {
        const details = fieldsResult.fieldDetails[fieldName];
        return {
          id: `field_${index}`,
          name: fieldName,
          type: details.type as FormField['type'],
          required: details.required,
          pageNumber: details.pages[0] || 1,
          readOnly: false,
          rect: [0, 0, 0, 0], // Default rect since we don't have this info
        };
      });
      
      console.log('🗂️ PDFEditDialog: Converted form fields:', formFields);
      setPdfFields(formFields);

      // Initialize field configs
      const initialConfigs: PDFEditData['fieldConfigs'] = {};
      formFields.forEach(field => {
        initialConfigs[field.name] = {
          status: field.readOnly ? 'read-only' : (field.hidden ? 'hidden' : 'normal'),
          label: field.name,
          required: field.required,
          placeholder: field.placeholder || '',
        };
      });
      setEditData(prev => ({
        ...prev,
        fieldConfigs: initialConfigs,
      }));

      console.log('🎉 PDFEditDialog: All data loaded successfully');

    } catch (err) {
      console.error('❌ PDFEditDialog Error loading PDF data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load PDF data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    if (open && filename) {
      // Initialize filename in edit data (remove .pdf extension for editing)
      const filenameWithoutExtension = filename.replace(/\.pdf$/i, '');
      setEditData(prev => ({
        ...prev,
        filename: filenameWithoutExtension
      }));
      loadPDFData();
    }
  }, [open, filename, loadPDFData]);

  const handleFilenameChange = (value: string) => {
    setEditData(prev => ({
      ...prev,
      filename: value,
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
      },
    }));
  };

  const handleFieldConfigChange = (fieldName: string, property: string, value: string | boolean) => {
    setEditData(prev => ({
      ...prev,
      fieldConfigs: {
        ...prev.fieldConfigs,
        [fieldName]: {
          ...prev.fieldConfigs[fieldName],
          [property]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    if (onSave) {
      // Use the edited filename if available, otherwise fall back to original
      let finalFilename = editData.filename || filename || '';
      // Ensure .pdf extension is present
      if (finalFilename && !finalFilename.toLowerCase().endsWith('.pdf')) {
        finalFilename += '.pdf';
      }
      onSave(finalFilename, editData);
    }
    onClose();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // PDF dates are often in format "D:YYYYMMDDHHmmSSOHH'mm'"
      const cleanDate = dateString.replace(/^D:/, '').substring(0, 14);
      const year = cleanDate.substring(0, 4);
      const month = cleanDate.substring(4, 6);
      const day = cleanDate.substring(6, 8);
      const hour = cleanDate.substring(8, 10);
      const minute = cleanDate.substring(10, 12);
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}`).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getFieldTypeChip = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'default'> = {
      text: 'primary',
      checkbox: 'secondary',
      radio: 'info',
      dropdown: 'warning',
      signature: 'success',
    };
    return <Chip label={type} color={colors[type] || 'default'} size="small" />;
  };

  if (!open || !filename) return null;

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon />
            <Typography variant="h6">Edit PDF File</Typography>
            {filename && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({filename})
              </Typography>
            )}
          </Box>
          <IconButton 
            onClick={onClose}
            size="large"
            edge="end"
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* PDF Filename Section */}
            <Box mb={3}>
              <Typography variant="h6" sx={{ mb: 2 }}>PDF File Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="PDF Filename"
                    value={editData.filename || ''}
                    onChange={(e) => handleFilenameChange(e.target.value)}
                    size="small"
                    helperText="Change the PDF filename (without .pdf extension)"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="File Extension"
                    value=".pdf"
                    size="small"
                    InputProps={{ readOnly: true }}
                    helperText="File type (read-only)"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* PDF Metadata Section */}
            <Box mt={3} mb={3}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1} 
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleSection('metadata')}
              >
                <Typography variant="h6">PDF Metadata</Typography>
                {expandedSections.metadata ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedSections.metadata}>
                <Box mt={2}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={editData.metadata.title || ''}
                        onChange={(e) => handleMetadataChange('title', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Author"
                        value={editData.metadata.author || ''}
                        onChange={(e) => handleMetadataChange('author', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={editData.metadata.subject || ''}
                        onChange={(e) => handleMetadataChange('subject', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Keywords"
                        value={editData.metadata.keywords || ''}
                        onChange={(e) => handleMetadataChange('keywords', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Creator"
                        value={editData.metadata.creator || ''}
                        onChange={(e) => handleMetadataChange('creator', e.target.value)}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Producer"
                        value={editData.metadata.producer || ''}
                        onChange={(e) => handleMetadataChange('producer', e.target.value)}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Creation Date"
                        value={formatDate(editData.metadata.creationDate || '')}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Modified Date"
                        value={formatDate(editData.metadata.modDate || '')}
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </Box>

            <Divider />

            {/* PDF Fields Section */}
            <Box mt={3}>
              <Box 
                display="flex" 
                alignItems="center" 
                gap={1} 
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleSection('fields')}
              >
                <Typography variant="h6">
                  PDF Form Fields ({pdfFields.length})
                </Typography>
                {expandedSections.fields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>

              <Collapse in={expandedSections.fields}>
                <Box mt={2}>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Field Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Page</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Label</TableCell>
                          <TableCell>Placeholder</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pdfFields.map((field) => {
                          const config = editData.fieldConfigs[field.name] || {};
                          const isEditing = editingField === field.name;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Typography variant="body2" fontFamily="monospace">
                                  {field.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {getFieldTypeChip(field.type)}
                              </TableCell>
                              <TableCell>{field.pageNumber}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={config.required ? 'Yes' : 'No'}
                                  color={config.required ? 'error' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                  <Select
                                    value={config.status || 'normal'}
                                    onChange={(e) => 
                                      handleFieldConfigChange(field.name, 'status', e.target.value)
                                    }
                                  >
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="read-only">Read-only</MenuItem>
                                    <MenuItem value="hidden">Hidden</MenuItem>
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell sx={{ minWidth: 150 }}>
                                {isEditing ? (
                                  <TextField
                                    size="small"
                                    value={config.label || field.name}
                                    onChange={(e) =>
                                      handleFieldConfigChange(field.name, 'label', e.target.value)
                                    }
                                    fullWidth
                                  />
                                ) : (
                                  <Typography variant="body2">
                                    {config.label || field.name}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ minWidth: 150 }}>
                                {isEditing ? (
                                  <TextField
                                    size="small"
                                    value={config.placeholder || ''}
                                    onChange={(e) =>
                                      handleFieldConfigChange(field.name, 'placeholder', e.target.value)
                                    }
                                    fullWidth
                                  />
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    {config.placeholder || 'None'}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => 
                                    setEditingField(isEditing ? null : field.name)
                                  }
                                >
                                  {isEditing ? <SaveIcon /> : <EditIcon />}
                                </IconButton>
                                {isEditing && (
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingField(null)}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Collapse>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFEditDialog;