import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { formFieldService } from '../../../services/formFieldService';

interface PDFFieldConfigProps {
  pdfPath: string;
  fieldConfig: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
  onUpdateFields: (fields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }) => void;
}

const PDFFieldConfig: React.FC<PDFFieldConfigProps> = ({
  pdfPath,
  fieldConfig,
  onUpdateFields,
}) => {
  const [fields, setFields] = useState<string[]>([]);
  const [fieldDetails, setFieldDetails] = useState<{ [fieldName: string]: { type: string; required: boolean; pages: number[] } }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPDFFields = async () => {
      if (!pdfPath) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Construct full PDF URL from path
        const pdfUrl = pdfPath.startsWith('/') ? pdfPath : `/pdfs/${pdfPath}`;
        
        // Extract fields from the actual PDF
        const result = await formFieldService.extractAllFormFields(pdfUrl);
        
        setFields(result.fields);
        setFieldDetails(result.fieldDetails);
        
        console.log(`📋 Extracted ${result.fields.length} fields from ${pdfPath}:`, result.fields);
      } catch (err) {
        setError('Failed to load PDF fields. Please ensure the PDF file exists and is accessible.');
        console.error('Failed to load PDF fields:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPDFFields();
  }, [pdfPath]);

  const handleFieldStatusChange = (fieldName: string, status: 'read-only' | 'hidden' | 'normal') => {
    const updatedConfig = {
      ...fieldConfig,
      [fieldName]: status,
    };
    onUpdateFields(updatedConfig);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read-only':
        return 'warning';
      case 'hidden':
        return 'error';
      case 'normal':
      default:
        return 'success';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Analyzing PDF fields...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (fields.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          No form fields detected in this PDF.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Configure how each form field should behave for users accessing this URL.
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Field Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Required</strong></TableCell>
              <TableCell><strong>Pages</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Configuration</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((fieldName) => {
              const currentStatus = fieldConfig[fieldName] || 'normal';
              const details = fieldDetails[fieldName];
              return (
                <TableRow key={fieldName} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {fieldName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={details?.type || 'unknown'}
                      size="small"
                      variant="outlined"
                      color="default"
                    />
                  </TableCell>
                  <TableCell>
                    {details?.required ? (
                      <Chip label="Required" size="small" color="error" variant="outlined" />
                    ) : (
                      <Chip label="Optional" size="small" color="default" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {details?.pages?.join(', ') || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={currentStatus}
                      size="small"
                      color={getStatusColor(currentStatus) as 'success' | 'warning' | 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={currentStatus}
                        onChange={(e) => handleFieldStatusChange(fieldName, e.target.value as 'read-only' | 'hidden' | 'normal')}
                        variant="outlined"
                      >
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="read-only">Read Only</MenuItem>
                        <MenuItem value="hidden">Hidden</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="caption" color="textSecondary">
          <strong>Normal:</strong> Field is fully interactive<br />
          <strong>Read Only:</strong> Field is visible but cannot be edited<br />
          <strong>Hidden:</strong> Field is completely hidden from users
        </Typography>
      </Box>
    </Box>
  );
};

export default PDFFieldConfig;