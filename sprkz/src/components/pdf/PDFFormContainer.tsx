import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import { PDFViewer } from './PDFViewer';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { FormProvider, useForm } from '../../contexts/FormContext';
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

  // Use form context
  const {
    setFieldValue,
    setCurrentField,
    setCurrentPage: setFormCurrentPage,
    state: { formData, validationErrors, currentFieldId },
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
          }}
        >
          <Box>
            <Typography variant="h6" component="h1">
              Sprkz PDF Form - Page {currentPage} of {pdfDocument.numPages}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pdfUrl.replace('/pdfs/', '')}
            </Typography>
          </Box>
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
        </Box>

        {/* PDF Viewer */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'grey.50',
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
        </Box>
      </Box>
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
