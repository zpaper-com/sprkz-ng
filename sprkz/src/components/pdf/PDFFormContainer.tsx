import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { PDFViewer } from './PDFViewer';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { FormProvider, useForm } from '../../contexts/FormContext';
import { WizardButton, WizardStatus } from '../WizardButton';
import { FieldTooltip } from '../FieldTooltip';
import { ProgressTracker, MiniProgressIndicator } from '../ProgressTracker';
import { getPDFUrlFromParams } from '../../utils/urlParams';
import { pdfService } from '../../services/pdfService';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { FormField as EnhancedFormField } from '../../services/formFieldService';

export interface PDFFormContainerProps {
  onFormFieldsDetected?: (fields: EnhancedFormField[]) => void;
}

// Inner component that uses the form context
const PDFFormContainerInner: React.FC<PDFFormContainerProps> = ({
  onFormFieldsDetected,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFieldNames, setShowFieldNames] = useState<boolean>(false);
  const [fieldsAlreadySet, setFieldsAlreadySet] = useState<boolean>(false);

  // Use form context
  const {
    setFieldValue,
    setCurrentField,
    setCurrentPage: setFormCurrentPage,
    setFormFields,
    state: { formData, validationErrors, currentFieldId, wizard },
  } = useForm();

  // Initialize PDF URL from parameters
  useEffect(() => {
    const url = getPDFUrlFromParams();
    setPdfUrl(url);
  }, []);

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
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail Sidebar */}
      <ThumbnailSidebar
        pdfDocument={pdfDocument}
        currentPage={currentPage}
        onPageSelect={handlePageSelect}
        width={180}
      />

      {/* Main PDF Viewer Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
            <Typography variant="h6" component="h1">
              Sprkz PDF Form - Page {currentPage} of {pdfDocument.numPages}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pdfUrl.replace('/pdfs/', '')}
            </Typography>
          </Box>

          {/* Wizard Status */}
          {wizard.isWizardMode && (
            <WizardStatus />
          )}

          {/* Mini Progress Indicator */}
          <MiniProgressIndicator />

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowFieldNames(!showFieldNames)}
              sx={{
                fontSize: '12px',
              }}
            >
              {showFieldNames ? 'Hide' : 'Show'} Field Names
            </Button>
            
            {/* Wizard Button */}
            <WizardButton 
              size="medium"
              showProgress={false}
            />
          </Box>
        </Box>

        {/* Progress Tracker - only show when wizard is active */}
        {wizard.isWizardMode && (
          <ProgressTracker 
            variant="compact" 
            showSteps={false}
          />
        )}

        {/* PDF Viewer */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'grey.50',
            position: 'relative',
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
          />

          {/* Field Tooltip */}
          <FieldTooltip 
            placement="top"
            autoHide={true}
            autoHideDelay={8000}
          />
        </Box>
      </Box>

      {/* Sidebar Progress Tracker for detailed view */}
      {wizard.isWizardMode && (
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
