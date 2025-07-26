import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
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
  Webhook as WebhookIcon,
  SmartToy as AutomationIcon,
} from '@mui/icons-material';
import { URLConfig, PDFFile } from '../../contexts/AdminContext';
import { Layout } from '../../types/layout';
import PDFFieldConfig from './PDFFieldConfig';

interface URLPanelProps {
  url: URLConfig;
  layouts: Layout[];
  pdfs: PDFFile[];
  onEdit: (url: URLConfig) => void;
  onDelete: (id: number) => void;
  onUpdatePDFFields: (
    urlId: number,
    pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }
  ) => void;
}

const URLPanel: React.FC<URLPanelProps> = ({
  url,
  layouts,
  pdfs,
  onEdit,
  onDelete,
  onUpdatePDFFields,
}) => {
  const [selectedPDF, setSelectedPDF] = useState(url.pdfPath || '');

  const desktopLayout = layouts.find((l) => l.id === url.desktopLayoutId);
  const mobileLayout = layouts.find((l) => l.id === url.mobileLayoutId);
  const currentPDF = pdfs.find((p) => p.filename === selectedPDF);
  const desktopFeaturesCount = desktopLayout ? Object.keys(desktopLayout.features).filter(key => desktopLayout.features[parseInt(key)]).length : 0;
  const mobileFeaturesCount = mobileLayout ? Object.keys(mobileLayout.features).filter(key => mobileLayout.features[parseInt(key)]).length : 0;

  const handlePDFChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newPDF = event.target.value as string;
    setSelectedPDF(newPDF);
    // Update URL configuration with new PDF
    onEdit({ ...url, pdfPath: newPDF });
  };

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center' } }}
      >
        <Box display="flex" alignItems="center" width="100%" sx={{ pr: 1 }}>
          <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {url.path}
          </Typography>
          <Box sx={{ mr: 2, display: 'flex', gap: 1 }}>
            {desktopLayout ? (
              <Chip
                label={`Desktop: ${desktopLayout.name}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            ) : (
              <Chip
                label="Desktop: Default"
                size="small"
                variant="outlined"
              />
            )}
            {mobileLayout ? (
              <Chip
                label={`Mobile: ${mobileLayout.name}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            ) : (
              <Chip
                label="Mobile: Default"
                size="small"
                variant="outlined"
              />
            )}
            {url.webhookName && (
              <Chip
                icon={<WebhookIcon fontSize="small" />}
                label={url.webhookName}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {url.automationName && (
              <Chip
                icon={<AutomationIcon fontSize="small" />}
                label={url.automationName}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
          </Box>
          <Box 
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', gap: 0.5 }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                onEdit(url);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <EditIcon fontSize="small" />
            </Box>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                onDelete(url.id);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: 'white',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <DeleteIcon fontSize="small" />
            </Box>
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
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mt: 1, display: 'block' }}
              >
                Size: {(currentPDF.size / 1024 / 1024).toFixed(2)} MB •
                Uploaded: {new Date(currentPDF.uploadDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Form Submission Triggers */}
          {(url.webhookName || url.automationName) && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Form Submission Triggers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When a form is submitted to this URL, the following will be triggered:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {url.webhookName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <WebhookIcon color="secondary" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Webhook: {url.webhookName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Direct HTTP call will be made
                      </Typography>
                    </Box>
                  </Box>
                )}
                {url.automationName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <AutomationIcon color="info" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Automation: {url.automationName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Multi-step workflow will be executed
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {(!url.webhookName && !url.automationName) && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Form Submission Triggers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No webhook or automation configured. Forms will be processed but no external calls will be made.
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Two-Column Layout: Features (Left) and Fields (Right) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 3,
              '@media (max-width: 900px)': {
                gridTemplateColumns: '1fr',
                gap: 2,
              },
            }}
          >
            {/* Left Column - Layout Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Layout Configuration
              </Typography>
              
              {/* Desktop Layout */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  🖥️ Desktop Layout
                </Typography>
                {desktopLayout ? (
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {desktopLayout.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {desktopLayout.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={desktopLayout.type} size="small" />
                      <Chip label={`${desktopLayout.components.length} components`} size="small" variant="outlined" />
                      <Chip label={`${desktopFeaturesCount} features`} size="small" variant="outlined" />
                      {desktopLayout.is_default && <Chip label="Default" size="small" color="primary" />}
                    </Box>
                    {desktopLayout.viewport && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1, display: 'block' }}>
                        Viewport: {desktopLayout.viewport}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>
                    Using default desktop layout
                  </Typography>
                )}
              </Box>

              {/* Mobile Layout */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                  📱 Mobile Layout
                </Typography>
                {mobileLayout ? (
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {mobileLayout.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mobileLayout.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={mobileLayout.type} size="small" />
                      <Chip label={`${mobileLayout.components.length} components`} size="small" variant="outlined" />
                      <Chip label={`${mobileFeaturesCount} features`} size="small" variant="outlined" />
                      {mobileLayout.is_default && <Chip label="Default" size="small" color="primary" />}
                    </Box>
                    {mobileLayout.viewport && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 1, display: 'block' }}>
                        Viewport: {mobileLayout.viewport}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>
                    Using default mobile layout
                  </Typography>
                )}
              </Box>
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
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  Select a PDF file above to configure field settings
                </Typography>
              )}
            </Box>
          </Box>

          {/* URL Info */}
          <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Created:</strong>{' '}
              {new Date(url.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Full URL:</strong> {window.location.origin}
              {url.path}
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default URLPanel;
