import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { PDFService, PDFServiceError } from '../../services/pdfService';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFViewerProps {
  url: string;
  scale?: number;
  currentPage?: number;
  onDocumentLoad?: (document: PDFDocumentProxy) => void;
  onPageLoad?: (page: PDFPageProxy) => void;
  onError?: (error: PDFServiceError) => void;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  scale = 1.0,
  currentPage = 1,
  onDocumentLoad,
  onPageLoad,
  onError,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PDFServiceError | null>(null);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Loading PDF from: ${url}`);
        const document = await PDFService.loadDocument({ url });
        
        if (!isMounted) return;
        
        setPdfDoc(document);
        onDocumentLoad?.(document);
        
        console.log(`PDF loaded successfully. Pages: ${document.numPages}`);
      } catch (err) {
        if (!isMounted) return;
        
        const pdfError = err as PDFServiceError;
        setError(pdfError);
        onError?.(pdfError);
        console.error('Failed to load PDF document:', pdfError);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (url) {
      loadDocument();
    }

    return () => {
      isMounted = false;
    };
  }, [url, onDocumentLoad, onError]);

  // Render specific page
  const renderPage = useCallback(async (pageNumber: number) => {
    if (!pdfDoc || renderingPage) return;

    try {
      setRenderingPage(true);
      setError(null);

      console.log(`Rendering page ${pageNumber}...`);
      const page = await PDFService.getPage(pdfDoc, pageNumber);
      setCurrentPageObj(page);
      onPageLoad?.(page);

      const viewport = page.getViewport({ scale });

      // Clear previous content
      if (containerRef.current) {
        const canvas = canvasRef.current;
        const textLayer = textLayerRef.current;
        const annotationLayer = annotationLayerRef.current;

        if (canvas && textLayer && annotationLayer) {
          // Clear layers
          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
          textLayer.innerHTML = '';
          annotationLayer.innerHTML = '';

          // Set container dimensions
          containerRef.current.style.width = `${viewport.width}px`;
          containerRef.current.style.height = `${viewport.height}px`;

          // 1. Canvas Layer - Render visual content
          await PDFService.renderPageToCanvas(page, canvas, scale);

          // 2. Text Layer - Enable text selection
          try {
            const textContent = await page.getTextContent();
            
            // Set text layer dimensions and positioning
            textLayer.style.width = `${viewport.width}px`;
            textLayer.style.height = `${viewport.height}px`;
            textLayer.className = 'textLayer';

            // Create text spans for selection (simplified implementation)
            textContent.items.forEach((item: any, index: number) => {
              if ('str' in item && item.str) {
                const span = document.createElement('span');
                span.textContent = item.str;
                span.style.position = 'absolute';
                span.style.left = `${item.transform[4]}px`;
                span.style.top = `${viewport.height - item.transform[5]}px`;
                span.style.fontSize = `${item.height}px`;
                span.style.fontFamily = item.fontName || 'sans-serif';
                span.style.color = 'transparent';
                span.style.userSelect = 'text';
                textLayer.appendChild(span);
              }
            });
          } catch (textError) {
            console.warn('Failed to render text layer:', textError);
          }

          // 3. Annotation Layer - Handle interactive forms
          try {
            const annotations = await page.getAnnotations({ intent: 'display' });
            
            if (annotations.length > 0) {
              // Set annotation layer dimensions and positioning
              annotationLayer.style.width = `${viewport.width}px`;
              annotationLayer.style.height = `${viewport.height}px`;
              annotationLayer.className = 'annotationLayer';

              // Create form elements for annotations (simplified implementation)
              annotations.forEach((annotation: any) => {
                if (annotation.subtype === 'Widget') {
                  const rect = annotation.rect;
                  const element = document.createElement('div');
                  element.style.position = 'absolute';
                  element.style.left = `${rect[0]}px`;
                  element.style.top = `${viewport.height - rect[3]}px`;
                  element.style.width = `${rect[2] - rect[0]}px`;
                  element.style.height = `${rect[3] - rect[1]}px`;
                  element.style.backgroundColor = 'rgba(0, 54, 255, 0.13)';
                  element.style.border = '1px solid rgba(0, 54, 255, 0.5)';
                  element.title = `Form field: ${annotation.fieldName || 'Unknown'}`;
                  annotationLayer.appendChild(element);
                }
              });

              console.log(`Rendered ${annotations.length} annotations on page ${pageNumber}`);
            }
          } catch (annotationError) {
            console.warn('Failed to render annotation layer:', annotationError);
          }

          // Preload adjacent pages for smooth navigation
          PDFService.preloadAdjacentPages(pdfDoc, pageNumber, 1);
        }
      }

      console.log(`Page ${pageNumber} rendered successfully`);
    } catch (err) {
      const pdfError = err as PDFServiceError;
      setError(pdfError);
      onError?.(pdfError);
      console.error(`Failed to render page ${pageNumber}:`, pdfError);
    } finally {
      setRenderingPage(false);
    }
  }, [pdfDoc, scale, onPageLoad, onError, renderingPage]);

  // Render page when currentPage or scale changes
  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= pdfDoc.numPages) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Handle container resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (currentPageObj && !renderingPage) {
        // Re-render current page with new scale if needed
        renderPage(currentPage);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPageObj, currentPage, renderPage, renderingPage]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight={400}
        className={className}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading PDF document...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ minHeight: 400, display: 'flex', alignItems: 'center' }}
        className={className}
      >
        <Box>
          <Typography variant="h6" gutterBottom>
            Failed to load PDF
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {error.message}
          </Typography>
          {error.originalError && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Technical details: {error.originalError.message}
            </Typography>
          )}
        </Box>
      </Alert>
    );
  }

  return (
    <Box 
      className={className}
      sx={{ 
        position: 'relative',
        display: 'inline-block',
        border: '1px solid #ccc',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Loading overlay for page rendering */}
      {renderingPage && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255, 255, 255, 0.8)"
          zIndex={10}
        >
          <CircularProgress size={32} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Rendering page {currentPage}...
          </Typography>
        </Box>
      )}

      {/* PDF content container with multi-layer rendering */}
      <Box
        ref={containerRef}
        position="relative"
        sx={{
          '& .textLayer': {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            opacity: 0.2,
            lineHeight: 1.0,
            '& > span': {
              color: 'transparent',
              position: 'absolute',
              whiteSpace: 'pre',
              cursor: 'text',
              transformOrigin: '0% 0%'
            }
          },
          '& .annotationLayer': {
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            '& section': {
              position: 'absolute'
            },
            '& .linkAnnotation > a': {
              position: 'absolute',
              fontSize: '1em',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            },
            '& .textWidgetAnnotation input': {
              background: 'rgba(0, 54, 255, 0.13)',
              border: '1px solid transparent',
              boxSizing: 'border-box',
              fontSize: '9px',
              height: '100%',
              margin: 0,
              padding: 0,
              verticalAlign: 'top',
              width: '100%'
            },
            '& .textWidgetAnnotation textarea': {
              background: 'rgba(0, 54, 255, 0.13)',
              border: '1px solid transparent',
              boxSizing: 'border-box',
              fontSize: '9px',
              height: '100%',
              margin: 0,
              padding: 0,
              verticalAlign: 'top',
              width: '100%',
              resize: 'none'
            },
            '& .choiceWidgetAnnotation select': {
              background: 'rgba(0, 54, 255, 0.13)',
              border: '1px solid transparent',
              boxSizing: 'border-box',
              fontSize: '9px',
              height: '100%',
              margin: 0,
              padding: 0,
              verticalAlign: 'top',
              width: '100%'
            },
            '& .checkboxWidgetAnnotation input': {
              height: '100%',
              margin: 0,
              verticalAlign: 'top',
              width: '100%'
            }
          }
        }}
      >
        {/* Canvas Layer - Visual PDF content */}
        <canvas 
          ref={canvasRef}
          style={{ 
            display: 'block',
            backgroundColor: 'white'
          }}
        />
        
        {/* Text Layer - Text selection */}
        <div ref={textLayerRef} />
        
        {/* Annotation Layer - Interactive forms */}
        <div ref={annotationLayerRef} />
      </Box>
    </Box>
  );
};