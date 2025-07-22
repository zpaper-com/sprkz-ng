import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { PDFViewer } from './PDFViewer';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { getPDFUrlFromParams } from '../../utils/urlParams';
import { pdfService, FormField } from '../../services/pdfService';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface PDFFormContainerProps {
  onFormFieldsDetected?: (fields: FormField[]) => void;
}

export const PDFFormContainer: React.FC<PDFFormContainerProps> = ({
  onFormFieldsDetected
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
  };

  const handleFormFieldsDetected = (fields: FormField[]) => {
    if (onFormFieldsDetected) {
      onFormFieldsDetected(fields);
    }
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
          Make sure the PDF file exists in the /pdfs/ directory and is accessible.
        </Typography>
      </Box>
    );
  }

  if (!pdfDocument) {
    return (
      <Box data-testid="pdf-form-container" p={3}>
        <Alert severity="warning">
          No PDF document loaded.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      data-testid="pdf-form-container"
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden'
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
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="h6" component="h1">
            Sprkz PDF Form - Page {currentPage} of {pdfDocument.numPages}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pdfUrl.replace('/pdfs/', '')}
          </Typography>
        </Box>
        
        {/* PDF Viewer */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'grey.50'
          }}
        >
          <PDFViewer
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            scale={1.0}
            onFormFieldsDetected={handleFormFieldsDetected}
            onPageChange={setCurrentPage}
          />
        </Box>
      </Box>
    </Box>
  );
};