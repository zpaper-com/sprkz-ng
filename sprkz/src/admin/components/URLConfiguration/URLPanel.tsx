import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { URLConfig, Feature, PDFFile } from '../../contexts/AdminContext';
import FeatureToggles from './FeatureToggles';
import PDFFieldConfig from './PDFFieldConfig';

interface URLPanelProps {
  url: URLConfig;
  features: Feature[];
  pdfs: PDFFile[];
  onEdit: (url: URLConfig) => void;
  onDelete: (id: number) => void;
  onUpdateFeatures: (urlId: number, features: { [featureId: number]: boolean }) => void;
  onUpdatePDFFields: (urlId: number, pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }) => void;
}

const URLPanel: React.FC<URLPanelProps> = ({
  url,
  features,
  pdfs,
  onEdit,
  onDelete,
  onUpdateFeatures,
  onUpdatePDFFields,
}) => {
  const [selectedPDF, setSelectedPDF] = useState(url.pdfPath || '');

  const enabledFeatures = features.filter(f => url.features[f.id]);
  const currentPDF = pdfs.find(p => p.filename === selectedPDF);

  const handlePDFChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newPDF = event.target.value as string;
    setSelectedPDF(newPDF);
    // Update URL configuration with new PDF
    onEdit({ ...url, pdfPath: newPDF });
  };

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" width="100%">
          <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {url.path}
          </Typography>
          <Box sx={{ mr: 2 }}>
            {enabledFeatures.length > 0 && (
              <Chip
                label={`${enabledFeatures.length} features enabled`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(url);
              }}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(url.id);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Box>
          {/* PDF Selection */}
          <Box mb={3}>
            <FormControl fullWidth>
              <InputLabel>PDF File</InputLabel>
              <Select
                value={selectedPDF}
                label="PDF File"
                onChange={handlePDFChange}
              >
                <MenuItem value="">
                  <em>Use default PDF</em>
                </MenuItem>
                {pdfs.map((pdf) => (
                  <MenuItem key={pdf.filename} value={pdf.filename}>
                    {pdf.filename}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {currentPDF && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Size: {(currentPDF.size / 1024 / 1024).toFixed(2)} MB • 
                Uploaded: {new Date(currentPDF.uploadDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Two-Column Layout: Features (Left) and Fields (Right) */}
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: 3,
              '@media (max-width: 900px)': {
                gridTemplateColumns: '1fr',
                gap: 2
              }
            }}
          >
            {/* Left Column - Feature Configuration */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Feature Configuration
              </Typography>
              <FeatureToggles
                features={features}
                enabledFeatures={url.features}
                onUpdateFeatures={(features) => onUpdateFeatures(url.id, features)}
              />
            </Box>

            {/* Right Column - PDF Field Configuration */}
            <Box>
              <Typography variant="h6" gutterBottom>
                PDF Field Configuration
              </Typography>
              {selectedPDF ? (
                <PDFFieldConfig
                  pdfPath={selectedPDF}
                  fieldConfig={url.pdfFields}
                  onUpdateFields={(fields) => onUpdatePDFFields(url.id, fields)}
                />
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                  Select a PDF file above to configure field settings
                </Typography>
              )}
            </Box>
          </Box>

          {/* URL Info */}
          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Created:</strong> {new Date(url.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Full URL:</strong> {window.location.origin}{url.path}
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default URLPanel;