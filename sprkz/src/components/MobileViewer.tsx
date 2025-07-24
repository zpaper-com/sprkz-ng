import React, { useEffect, useRef, useState } from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import { getPDFUrlFromParams } from '../utils/urlParams';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

const MobileViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [currentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderTask, setRenderTask] = useState<any>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pdfUrl = getPDFUrlFromParams();
        console.log('Loading PDF:', pdfUrl);
        
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, []);

  useEffect(() => {
    if (pdfDocument && canvasRef.current && textLayerRef.current && annotationLayerRef.current) {
      renderPage(currentPage);
    }
  }, [pdfDocument, currentPage]);

  const renderPage = async (pageNum: number) => {
    if (!pdfDocument || !canvasRef.current || !textLayerRef.current || !annotationLayerRef.current) {
      return;
    }

    try {
      // Cancel any ongoing render task
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
      }

      const page = await pdfDocument.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const textLayer = textLayerRef.current;
      const annotationLayer = annotationLayerRef.current;

      if (!context) return;

      // Calculate scale to fit mobile screen
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      // Clear previous layers
      textLayer.innerHTML = '';
      annotationLayer.innerHTML = '';

      // Set layer dimensions and positioning
      textLayer.style.width = canvas.style.width;
      textLayer.style.height = canvas.style.height;
      textLayer.style.setProperty('--scale-factor', scale.toString());
      annotationLayer.style.width = canvas.style.width;
      annotationLayer.style.height = canvas.style.height;

      // Render canvas layer (visual content)
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };
      
      const newRenderTask = page.render(renderContext);
      setRenderTask(newRenderTask);
      
      try {
        await newRenderTask.promise;
      } catch (renderError: any) {
        // Ignore cancellation errors, but throw other errors
        if (renderError.name !== 'RenderingCancelledException') {
          throw renderError;
        }
        console.log('Render task was cancelled (expected)');
        return; // Exit early if cancelled
      }

      // Render text layer (for text selection)
      const textContent = await page.getTextContent();
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: scaledViewport,
        textDivs: [],
        textContentItemsStr: [],
      });

      // Render annotation layer (forms and interactive elements)
      const annotations = await page.getAnnotations();
      if (annotations.length > 0) {
        console.log(`Rendering ${annotations.length} annotations`);
        
        // Create interactive form elements
        for (let index = 0; index < annotations.length; index++) {
          const annotation = annotations[index];
          if (annotation.subtype === 'Widget') {
            const rect = annotation.rect;
            if (!rect) {
              console.log('Skipping widget without rect data');
              continue; // Skip if no position data
            }
            
            let element: HTMLElement;
            
            // Create appropriate input element based on field type
            // Check multiple possible field type properties
            const fieldType = annotation.fieldType || annotation.type || annotation.formType;
            const isCheckbox = annotation.checkBox || annotation.isCheckbox;
            const isRadio = annotation.radioButton || annotation.isRadio;
            
            if (fieldType === 'Tx' || fieldType === 'text' || (!fieldType && !isCheckbox && !isRadio)) {
              // Text field (default for most widgets)
              element = document.createElement('input');
              (element as HTMLInputElement).type = 'text';
              (element as HTMLInputElement).value = annotation.fieldValue || '';
              (element as HTMLInputElement).placeholder = annotation.fieldName || '';
              element.style.fontSize = '12px';
              element.style.padding = '2px';
              element.style.border = '1px solid #ccc';
              element.style.backgroundColor = 'white';
            } else if (isCheckbox) {
              // Checkbox
              element = document.createElement('input');
              (element as HTMLInputElement).type = 'checkbox';
              (element as HTMLInputElement).checked = annotation.fieldValue === 'Yes' || annotation.fieldValue === true;
              element.style.transform = 'scale(1.2)';
            } else if (isRadio) {
              // Radio button
              element = document.createElement('input');
              (element as HTMLInputElement).type = 'radio';
              (element as HTMLInputElement).name = annotation.fieldName || `radio_${index}`;
              (element as HTMLInputElement).checked = annotation.fieldValue !== 'Off' && annotation.fieldValue !== false;
              element.style.transform = 'scale(1.2)';
            } else if (fieldType === 'Ch' || fieldType === 'choice') {
              // Choice field (dropdown)
              element = document.createElement('select');
              if (annotation.options && annotation.options.length > 0) {
                annotation.options.forEach((option: any) => {
                  const optionElement = document.createElement('option');
                  optionElement.value = option.exportValue || option.displayValue || option;
                  optionElement.textContent = option.displayValue || option;
                  (element as HTMLSelectElement).appendChild(optionElement);
                });
              } else {
                // Add default option if no options available
                const defaultOption = document.createElement('option');
                defaultOption.textContent = annotation.fieldName || 'Select...';
                (element as HTMLSelectElement).appendChild(defaultOption);
              }
              element.style.fontSize = '12px';
              element.style.backgroundColor = 'white';
              element.style.border = '1px solid #ccc';
            } else {
              // Default interactive div for unknown types
              element = document.createElement('input');
              (element as HTMLInputElement).type = 'text';
              (element as HTMLInputElement).placeholder = annotation.fieldName || `Field ${index + 1}`;
              element.style.fontSize = '12px';
              element.style.padding = '2px';
              element.style.border = '1px solid #007bff';
              element.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
            }
            
            // Set common positioning and styling
            element.style.position = 'absolute';
            element.style.left = `${rect[0] * scale}px`;
            element.style.top = `${(scaledViewport.height - rect[3] * scale)}px`;
            element.style.width = `${(rect[2] - rect[0]) * scale}px`;
            element.style.height = `${(rect[3] - rect[1]) * scale}px`;
            element.style.pointerEvents = 'auto';
            element.style.zIndex = '1000';
            
            // Add event listeners for form interactions
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
              element.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement | HTMLSelectElement;
                console.log(`Field changed: ${annotation.fieldName} = ${target.value || (target as HTMLInputElement).checked}`);
              });
              
              element.addEventListener('focus', () => {
                console.log(`Field focused: ${annotation.fieldName}`);
              });
            }
            
            annotationLayer.appendChild(element);
          }
        }
      }

      console.log(`Rendered page ${pageNum} with ${annotations.length} annotations`);
      setRenderTask(null);

    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render PDF page');
      setRenderTask(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Mobile PDF Viewer
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="calc(100vh - 64px)"
        >
          <Typography>Loading PDF...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Mobile PDF Viewer
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight="calc(100vh - 64px)"
          p={2}
        >
          <Typography color="error" align="center">
            {error}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Blue Toolbar */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Mobile PDF Viewer
          </Typography>
          <Typography variant="body2">
            {currentPage} / {totalPages}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* PDF Container */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'auto',
          bgcolor: 'grey.100',
        }}
      >
        {/* Canvas Layer (Visual Content) */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        />

        {/* Text Layer (Text Selection) */}
        <div
          ref={textLayerRef}
          className="textLayer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            color: 'transparent',
            fontSize: '1px',
            overflow: 'hidden',
            pointerEvents: 'auto',
            zIndex: 1,
          }}
        />

        {/* Annotation Layer (Forms/Interactive Elements) */}
        <div
          ref={annotationLayerRef}
          className="annotationLayer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'auto',
            zIndex: 10,
          }}
        />
      </Box>
    </Box>
  );
};

export default MobileViewer;