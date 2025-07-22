import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { pdfService, FormField } from '../../services/pdfService';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface PDFViewerProps {
  pdfUrl: string;
  currentPage?: number;
  scale?: number;
  onFormFieldsDetected?: (fields: FormField[]) => void;
  onPageChange?: (pageNumber: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  currentPage = 1,
  scale = 1.0,
  onFormFieldsDetected,
  onPageChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setFormFields] = useState<FormField[]>([]);
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPDF = async () => {
      try {
        console.log('Loading PDF from:', pdfUrl);
        setLoading(true);
        setError(null);
        
        const doc = await pdfService.loadPDF(pdfUrl);
        console.log('PDF loaded successfully, pages:', doc.numPages);
        setPdfDocument(doc);
        
        // Load first page by default
        console.log('Loading page:', currentPage);
        const page = await pdfService.getPage(doc, currentPage);
        console.log('Page loaded successfully');
        setCurrentPageObj(page);
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Error loading PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, currentPage]);

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !currentPageObj || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel any existing render task
        if (renderTaskRef.current) {
          console.log('Canceling previous render task...');
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        console.log('Rendering page...', currentPageObj.pageNumber);
        
        // Start new render task with cancellation tracking
        const task = pdfService.renderPageWithCancellation(
          currentPageObj, 
          canvasRef.current!, 
          scale
        );
        
        renderTaskRef.current = task;
        
        // Wait for render completion
        await task.promise;
        renderTaskRef.current = null;

        console.log('Page rendered successfully');

        // Create text layer for text selection
        if (textLayerRef.current) {
          const viewport = currentPageObj.getViewport({ scale });
          await pdfService.createTextLayer(
            currentPageObj,
            textLayerRef.current,
            viewport
          );
        }

        // Extract form fields from annotations
        const fields = await pdfService.getFormFields(currentPageObj);
        setFormFields(fields);
        
        if (onFormFieldsDetected) {
          onFormFieldsDetected(fields);
        }

      } catch (err) {
        // Don't show error for cancelled renders
        if (err instanceof Error && err.message.includes('cancelled')) {
          console.log('Render cancelled (expected):', err.message);
          return;
        }
        
        console.error('Error rendering page:', err);
        setError(`Error rendering PDF page: ${err instanceof Error ? err.message : 'Unknown error'}`);
        renderTaskRef.current = null;
      }
    };

    renderPage();

    // Cleanup function to cancel render on unmount
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPageObj, scale, onFormFieldsDetected]);

  // Handle page changes
  useEffect(() => {
    if (!pdfDocument || currentPage < 1 || currentPage > pdfDocument.numPages) return;

    const loadPage = async () => {
      try {
        const page = await pdfService.getPage(pdfDocument, currentPage);
        setCurrentPageObj(page);
        
        if (onPageChange) {
          onPageChange(currentPage);
        }
      } catch (err) {
        console.error('Error loading page:', err);
      }
    };

    loadPage();
  }, [pdfDocument, currentPage, onPageChange]);

  if (loading) {
    return (
      <Box
        data-testid="pdf-viewer"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress />
        <Box ml={2}>Loading PDF...</Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box data-testid="pdf-viewer" p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      data-testid="pdf-viewer"
      position="relative"
      display="inline-block"
      sx={{
        border: '1px solid #ccc',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {/* Canvas Layer - Visual PDF content */}
      <canvas
        ref={canvasRef}
        data-testid="pdf-canvas"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      {/* Text Layer - Text selection support */}
      <div
        ref={textLayerRef}
        data-testid="pdf-text-layer"
        className="textLayer"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          opacity: 0,
          lineHeight: 1.0,
          pointerEvents: 'auto'
        }}
      />
      
      {/* Annotation Layer - Interactive form fields */}
      <div
        ref={annotationLayerRef}
        data-testid="pdf-annotation-layer"
        className="annotationLayer"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto'
        }}
      />
    </Box>
  );
};