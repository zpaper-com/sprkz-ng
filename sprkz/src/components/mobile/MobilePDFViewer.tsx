import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface MobilePDFViewerProps {
  pdfUrl: string;
  onFieldsDetected?: (fields: any[]) => void;
  onLoadComplete?: () => void;
  _onPageChange?: (pageNum: number) => void;
  currentPage?: number;
}

const MobilePDFViewer: React.FC<MobilePDFViewerProps> = ({
  pdfUrl,
  onFieldsDetected,
  onLoadComplete,
  _onPageChange,
  currentPage = 1,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadPDF = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading PDF from URL:', pdfUrl);
      
      // Add fetch options for better error handling
      const pdf = await pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: {
          'Cache-Control': 'no-cache',
        },
        withCredentials: false,
      }).promise;
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      
      console.log('PDF loaded successfully, pages:', pdf.numPages);
      
      // Load first page to detect fields
      const page = await pdf.getPage(1);
      const annotations = await page.getAnnotations({ intent: 'display' });
      
      console.log('Found annotations:', annotations.length);
      
      if (onFieldsDetected) {
        const formFields = annotations.filter((annotation: any) => 
          annotation.subtype === 'Widget' && !annotation.readOnly
        );
        console.log('Form fields detected:', formFields.length);
        onFieldsDetected(formFields);
      }
      
      if (onLoadComplete) {
        onLoadComplete();
      }
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Still call onLoadComplete to stop loading state
      if (onLoadComplete) {
        onLoadComplete();
      }
    } finally {
      setLoading(false);
    }
  }, [pdfUrl, onFieldsDetected, onLoadComplete]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      // Calculate scale to fit mobile screen width
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth - 32;
      const viewport = page.getViewport({ scale: 1 });
      const calculatedScale = (containerWidth / viewport.width) * scale;
      
      const scaledViewport = page.getViewport({ scale: calculatedScale });
      
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      await page.render(renderContext).promise;
      
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page.');
    }
  }, [pdfDocument, scale]);

  useEffect(() => {
    loadPDF();
  }, [loadPDF]);

  useEffect(() => {
    if (pdfDocument) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage, renderPage]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="300px"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading PDF...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        backgroundColor: theme.palette.grey[100],
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Zoom Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          gap: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          padding: 0.5,
        }}
      >
        <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.5}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Page Info */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 1,
          fontSize: '0.75rem',
        }}
      >
        {currentPage} / {totalPages}
      </Box>

      {/* PDF Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxWidth: '100%',
        }}
      />
    </Box>
  );
};

export default MobilePDFViewer;