import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  ZoomIn,
  ZoomOut,
  NavigateBefore,
  NavigateNext,
  GetApp
} from '@mui/icons-material';
import { PDFViewer } from './PDFViewer';
import { ThumbnailSidebar } from './ThumbnailSidebar';
import { PDFService, PDFServiceError } from '../../services/pdfService';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface PDFFormContainerProps {
  className?: string;
}

export const PDFFormContainer: React.FC<PDFFormContainerProps> = ({ className }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // PDF state
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Form tracking state
  const [completedPages, setCompletedPages] = useState<Set<number>>(new Set());
  const [pagesWithFormFields, setPagesWithFormFields] = useState<Set<number>>(new Set());
  
  // UI state
  const [error, setError] = useState<PDFServiceError | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Get PDF URL from environment or URL parameters
  const pdfUrl = PDFService.getDefaultPDFUrl();

  // Handle document load
  const handleDocumentLoad = useCallback((document: PDFDocumentProxy) => {
    setPdfDoc(document);
    setCurrentPage(1);
    console.log(`PDF document loaded: ${document.numPages} pages`);
    
    // Extract form fields from all pages
    const extractFormFields = async () => {
      const pagesWithForms = new Set<number>();
      
      for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
        try {
          const page = await PDFService.getPage(document, pageNum);
          const formFields = await PDFService.extractFormFields(page);
          
          if (formFields.length > 0) {
            pagesWithForms.add(pageNum);
            console.log(`Page ${pageNum} has ${formFields.length} form fields`);
          }
        } catch (error) {
          console.warn(`Failed to extract form fields from page ${pageNum}:`, error);
        }
      }
      
      setPagesWithFormFields(pagesWithForms);
      
      if (pagesWithForms.size > 0) {
        setSnackbarMessage(`Found form fields on ${pagesWithForms.size} page(s)`);
      } else {
        setSnackbarMessage('No form fields found in this PDF');
      }
    };
    
    extractFormFields();
  }, []);

  // Handle page load
  const handlePageLoad = useCallback((page: PDFPageProxy) => {
    console.log(`Page ${page.pageNumber} loaded and rendered`);
  }, []);

  // Handle PDF errors
  const handleError = useCallback((error: PDFServiceError) => {
    setError(error);
    console.error('PDF error:', error);
  }, []);

  // Navigation handlers
  const handlePageSelect = useCallback((pageNumber: number) => {
    if (pdfDoc && pageNumber >= 1 && pageNumber <= pdfDoc.numPages) {
      setCurrentPage(pageNumber);
      
      // Auto-close sidebar on mobile after selection
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  }, [pdfDoc, isMobile]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [pdfDoc, currentPage]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale * 1.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale / 1.25, 0.5));
  }, []);

  // Toggle sidebar
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        PDFService.cleanup(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Close error alert
  const handleCloseError = () => {
    setError(null);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarMessage('');
  };

  return (
    <Box className={className} sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top toolbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <IconButton
            edge="start"
            onClick={handleToggleSidebar}
            aria-label="toggle sidebar"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
            Sprkz PDF Forms
            {pdfDoc && (
              <Typography component="span" variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                Page {currentPage} of {pdfDoc.numPages}
              </Typography>
            )}
          </Typography>

          {/* Navigation controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              size="small"
            >
              <NavigateBefore />
            </IconButton>
            
            <IconButton
              onClick={handleNextPage}
              disabled={!pdfDoc || currentPage >= pdfDoc.numPages}
              size="small"
            >
              <NavigateNext />
            </IconButton>
            
            <Typography variant="body2" sx={{ mx: 1, minWidth: 60, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Typography>
            
            <IconButton onClick={handleZoomOut} disabled={scale <= 0.5} size="small">
              <ZoomOut />
            </IconButton>
            
            <IconButton onClick={handleZoomIn} disabled={scale >= 3.0} size="small">
              <ZoomIn />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Error alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={handleCloseError}
          sx={{ m: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {error.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </Typography>
          <Typography variant="body2">
            {error.message}
          </Typography>
        </Alert>
      )}

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <ThumbnailSidebar
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          completedPages={completedPages}
          pagesWithFormFields={pagesWithFormFields}
          onPageSelect={handlePageSelect}
          open={sidebarOpen}
          onToggle={handleToggleSidebar}
        />

        {/* PDF viewer */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflow: 'auto',
            backgroundColor: 'grey.100',
            p: 2
          }}
        >
          <PDFViewer
            url={pdfUrl}
            scale={scale}
            currentPage={currentPage}
            onDocumentLoad={handleDocumentLoad}
            onPageLoad={handlePageLoad}
            onError={handleError}
          />
        </Box>
      </Box>

      {/* Status snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};