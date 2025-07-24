import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button, Tooltip } from '@mui/material';
import { Height, SwapHoriz, Visibility, VisibilityOff } from '@mui/icons-material';
import { PDFViewer } from './PDFViewer';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { FormProvider, useForm } from '../../contexts/FormContext';
import { WizardButton, WizardStatus } from '../WizardButton';
import { ProgressTracker } from '../ProgressTracker';
import { FieldTooltip } from '../FieldTooltip';
import { getPDFUrlFromParams } from '../../utils/urlParams';
import { pdfService } from '../../services/pdfService';
import { usePDFViewerFeatures, useWizardFeatures, useFormFeatures } from '../../hooks/useFeatureFlags';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { FormField as EnhancedFormField } from '../../services/formFieldService';

export interface DynamicConfig {
  pdfPath: string;
  features: { [featureId: number]: boolean };
  pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
}

export interface PDFFormContainerProps {
  onFormFieldsDetected?: (fields: EnhancedFormField[]) => void;
  dynamicConfig?: DynamicConfig;
}

// Inner component that uses the form context
const PDFFormContainerInner: React.FC<PDFFormContainerProps> = ({
  onFormFieldsDetected,
  dynamicConfig,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFieldNames, setShowFieldNames] = useState<boolean>(false);
  const [fieldsAlreadySet, setFieldsAlreadySet] = useState<boolean>(false);
  const [pdfFitMode, setPdfFitMode] = useState<'default' | 'width' | 'height'>('default');
  
  // Feature flag hooks
  const pdfViewerFeatures = usePDFViewerFeatures();
  const wizardFeatures = useWizardFeatures();
  const formFeatures = useFormFeatures();

  // Use form context
  const {
    setFieldValue,
    setCurrentField,
    setCurrentPage: setFormCurrentPage,
    setFormFields,
    state: { formData, validationErrors, currentFieldId, wizard },
  } = useForm();

  // Initialize PDF URL from parameters or dynamic config
  useEffect(() => {
    if (dynamicConfig?.pdfPath) {
      // Use PDF path from dynamic config
      setPdfUrl(dynamicConfig.pdfPath);
    } else {
      // Fallback to URL parameters
      const url = getPDFUrlFromParams();
      setPdfUrl(url);
    }
  }, [dynamicConfig]);

  // Debug feature flags in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎌 PDFFormContainer Feature Flags:', {
        pdfViewerFeatures,
        wizardFeatures,
        formFeatures,
        route: window.location.pathname
      });
    }
  }, [pdfViewerFeatures, wizardFeatures, formFeatures]);

  // Load PDF document when URL changes
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        setFieldsAlreadySet(false); // Reset field detection flag for new PDF

        const doc = await pdfService.loadPDF(pdfUrl);
        setPdfDocument(doc);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Error loading PDF. Please check the file path.');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  const handlePageSelect = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setFormCurrentPage(pageNumber);
  };

  const handleFormFieldsDetected = (fields: EnhancedFormField[]) => {
    // Prevent re-detection loop - only process fields once
    if (fieldsAlreadySet || fields.length === 0) {
      console.log('🔄 Skipping field detection - already processed or no fields');
      return;
    }
    
    console.log('🔗 PDFFormContainer received fields:', fields.length);
    
    // Convert fields to PageFormFields format for FormContext
    const pageFieldsMap = new Map<number, EnhancedFormField[]>();
    
    // Group fields by page number
    fields.forEach(field => {
      if (!pageFieldsMap.has(field.pageNumber)) {
        pageFieldsMap.set(field.pageNumber, []);
      }
      pageFieldsMap.get(field.pageNumber)!.push(field);
    });
    
    // Convert to PageFormFields array
    const allPageFields = Array.from(pageFieldsMap.entries())
      .sort(([a], [b]) => a - b) // Sort by page number
      .map(([pageNumber, pageFields]) => ({
        pageNumber,
        fields: pageFields,
        radioGroups: [], // TODO: Handle radio groups if needed
      }));
    
    console.log('🔗 Converted to PageFormFields:', {
      pages: allPageFields.length,
      totalFields: fields.length,
      pageBreakdown: allPageFields.map(p => ({ page: p.pageNumber, fields: p.fields.length }))
    });
    
    // Set fields in FormContext (only once)
    setFormFields(allPageFields);
    setFieldsAlreadySet(true);
    
    // Also call the original callback if provided
    if (onFormFieldsDetected) {
      onFormFieldsDetected(fields);
    }
  };

  const handleFieldFocus = (fieldId: string) => {
    console.log('Field focused:', fieldId);
    setCurrentField(fieldId);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    console.log('Field changed:', fieldId, value);
    setFieldValue(fieldId, value);
  };

  const handleFieldBlur = (fieldId: string) => {
    console.log('Field blurred:', fieldId);
    // Don't clear current field on blur - let the wizard manage focus
  };

  if (loading) {
    return (
      <Box
        data-testid="pdf-form-container"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
        p={3}
      >
        <Typography variant="h6">Loading PDF...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box data-testid="pdf-form-container" p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Make sure the PDF file exists in the /pdfs/ directory and is
          accessible.
        </Typography>
      </Box>
    );
  }

  if (!pdfDocument) {
    return (
      <Box data-testid="pdf-form-container" p={3}>
        <Alert severity="warning">No PDF document loaded.</Alert>
      </Box>
    );
  }

  return (
    <Box
      data-testid="pdf-form-container"
      sx={{
        display: 'flex',
        minHeight: '100vh',
        height: pdfFitMode === 'width' ? 'auto' : '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail Sidebar */}
      {pdfViewerFeatures.showThumbnailNavigation && (
        <ThumbnailSidebar
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          width={180}
        />
      )}

      {/* Main PDF Viewer Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: pdfFitMode === 'width' ? 'visible' : 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 200 }}>
            {pdfViewerFeatures.showTitleDisplay && (
              <Typography variant="h6" component="h1">
                Sprkz PDF Form - Page {currentPage} of {pdfDocument.numPages}
              </Typography>
            )}
            {pdfViewerFeatures.showFilenameDisplay && (
              <Typography variant="body2" color="text.secondary">
                {pdfUrl.replace('/pdfs/', '')}
              </Typography>
            )}
          </Box>

          {/* Wizard Status */}
          {wizard.isWizardMode && wizardFeatures.showStatusIndicator && (
            <WizardStatus />
          )}


          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Show/Hide Field Names with Eye Icon */}
            {pdfViewerFeatures.showFieldsToggle && (
              <Tooltip title={showFieldNames ? 'Hide field names' : 'Show field names'}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowFieldNames(!showFieldNames)}
                  sx={{
                    fontSize: '12px',
                    minWidth: 'auto',
                    px: 1,
                  }}
                  startIcon={showFieldNames ? <Visibility /> : <VisibilityOff />}
                >
                  Fields
                </Button>
              </Tooltip>
            )}

            {/* PDF Fit Controls */}
            {pdfViewerFeatures.showFitWidthButton && (
              <Tooltip title="Fit PDF to width">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setPdfFitMode(pdfFitMode === 'width' ? 'default' : 'width');
                  }}
                  color={pdfFitMode === 'width' ? 'primary' : 'inherit'}
                  sx={{ 
                    minWidth: 'auto',
                    px: 1,
                  }}
                  startIcon={<SwapHoriz />}
                >
                  Width
                </Button>
              </Tooltip>
            )}

            {pdfViewerFeatures.showFitHeightButton && (
              <Tooltip title="Fit PDF to height">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setPdfFitMode(pdfFitMode === 'height' ? 'default' : 'height');
                  }}
                  color={pdfFitMode === 'height' ? 'primary' : 'inherit'}
                  sx={{ 
                    minWidth: 'auto',
                    px: 1,
                  }}
                  startIcon={<Height />}
                >
                  Height
                </Button>
              </Tooltip>
            )}
            
            {/* Wizard Button */}
            {wizardFeatures.showWizardButton && (
              <WizardButton 
                size="medium"
                showProgress={wizardFeatures.showMiniProgress}
              />
            )}
          </Box>
        </Box>

        {/* Progress Tracker */}
        {wizardFeatures.showProgressTracker && (
          <ProgressTracker />
        )}

        {/* PDF Viewer */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: pdfFitMode === 'width' ? 1 : 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: pdfFitMode === 'width' ? 'flex-start' : 'center',
            justifyContent: 'flex-start',
            backgroundColor: 'grey.50',
            position: 'relative',
            width: '100%',
            minHeight: '100%',
          }}
        >
          <PDFViewer
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            scale={1.0}
            onFormFieldsDetected={handleFormFieldsDetected}
            onPageChange={setCurrentPage}
            onFieldFocus={handleFieldFocus}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            currentFieldId={currentFieldId}
            formData={formData}
            validationErrors={validationErrors}
            showFieldNames={showFieldNames}
            fitMode={pdfFitMode}
            fieldConfigs={dynamicConfig?.pdfFields}
          />

        </Box>
      </Box>

      {/* Sidebar Progress Tracker for detailed view */}
      {wizard.isWizardMode && wizardFeatures.showProgressTracker && (
        <Box
          sx={{
            width: 300,
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <ProgressTracker 
            variant="detailed" 
            showSteps={true}
            allowNavigation={true}
            collapsible={false}
            maxHeight={400}
          />
        </Box>
      )}

      {/* Field Tooltip */}
      {formFeatures.showTooltips && <FieldTooltip />}
    </Box>
  );
};

// Main component wrapped with FormProvider
export const PDFFormContainer: React.FC<PDFFormContainerProps> = (props) => {
  const handleSubmit = async (formData: Record<string, any>) => {
    console.log('Form submitted:', formData);
    // TODO: Implement form submission to server
  };

  return (
    <FormProvider onSubmit={handleSubmit}>
      <PDFFormContainerInner {...props} />
    </FormProvider>
  );
};
