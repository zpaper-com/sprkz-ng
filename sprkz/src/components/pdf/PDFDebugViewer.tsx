import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const PDFDebugViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Starting...');

  useEffect(() => {
    const testPDFRendering = async () => {
      try {
        setStatus('Loading PDF document...');
        console.log('Loading PDF document...');
        
        // Test PDF loading
        const loadingTask = pdfjsLib.getDocument('/pdfs/makana2025.pdf');
        const pdf = await loadingTask.promise;
        
        setStatus(`PDF loaded successfully. Pages: ${pdf.numPages}`);
        console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
        
        // Test page loading
        setStatus('Loading first page...');
        const page = await pdf.getPage(1);
        
        setStatus('Page loaded, getting viewport...');
        const viewport = page.getViewport({ scale: 1.0 });
        
        setStatus(`Viewport: ${viewport.width}x${viewport.height}`);
        console.log(`Viewport: ${viewport.width}x${viewport.height}`);
        
        // Test canvas setup
        if (!canvasRef.current) {
          setStatus('Error: Canvas ref is null');
          return;
        }
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          setStatus('Error: Could not get canvas context');
          return;
        }
        
        // Set canvas size with device pixel ratio for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.height = viewport.height * devicePixelRatio;
        canvas.width = viewport.width * devicePixelRatio;
        canvas.style.height = viewport.height + 'px';
        canvas.style.width = viewport.width + 'px';
        
        // Scale context for device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);
        
        setStatus('Rendering page...');
        console.log('Starting page render...');
        
        // Render page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        const renderTask = page.render(renderContext);
        await renderTask.promise;
        
        setStatus('✅ PDF rendered successfully!');
        console.log('PDF rendered successfully!');
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setStatus(`❌ Error: ${errorMsg}`);
        console.error('PDF Debug Error:', error);
      }
    };

    testPDFRendering();
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h6" gutterBottom>
        PDF.js Debug Test
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Status: {status}
      </Typography>
      <Box mt={2} border="1px solid #ccc" display="inline-block">
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </Box>
    </Box>
  );
};