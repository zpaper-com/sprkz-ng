import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { pdfService } from '../../services/pdfService';
import { formFieldService } from '../../services/formFieldService';
import { FieldOverlay, useFieldHighlights } from '../forms/FieldOverlay';
import { SignatureModal } from '../forms/SignatureModal';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { FormField as EnhancedFormField } from '../../services/formFieldService';
import './PDFViewer.css';

export interface PDFViewerProps {
  pdfUrl: string;
  currentPage?: number;
  scale?: number;
  onFormFieldsDetected?: (fields: EnhancedFormField[]) => void;
  onPageChange?: (pageNumber: number) => void;
  onFieldFocus?: (fieldId: string) => void;
  onFieldChange?: (fieldId: string, value: any) => void;
  onFieldBlur?: (fieldId: string) => void;
  currentFieldId?: string | null;
  formData?: Record<string, any>;
  validationErrors?: Record<string, string>;
  showFieldNames?: boolean;
  fitMode?: 'default' | 'width' | 'height';
  fieldConfigs?: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  currentPage = 1,
  scale = 1.0,
  onFormFieldsDetected,
  onPageChange,
  onFieldFocus,
  onFieldChange,
  onFieldBlur,
  currentFieldId,
  formData = {},
  validationErrors = {},
  showFieldNames = false,
  fitMode = 'default',
  fieldConfigs = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [currentPageObj, setCurrentPageObj] = useState<PDFPageProxy | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedFormFields, setEnhancedFormFields] = useState<
    EnhancedFormField[]
  >([]);
  const [viewport, setViewport] = useState<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<
    string | null
  >(null);
  const [currentSignatureFieldDimensions, setCurrentSignatureFieldDimensions] = useState<
    { width: number; height: number } | null
  >(null);

  // Calculate scale based on fit mode using proper PDF.js approach
  const calculateScale = useCallback((pageObj: PDFPageProxy, containerElement: HTMLElement): number => {
    if (fitMode === 'default') {
      return scale;
    }

    // Get the natural page viewport at scale 1.0 (PDF.js standard approach)
    const unscaledViewport = pageObj.getViewport({ scale: 1.0 });
    const containerRect = containerElement.getBoundingClientRect();
    
    // Account for padding/margins in the container - reduce for fit-width mode
    const MARGIN_PADDING = fitMode === 'width' ? 20 : 40;
    const availableWidth = containerRect.width - MARGIN_PADDING;
    const availableHeight = containerRect.height - MARGIN_PADDING;

    if (fitMode === 'width') {
      // PDF.js fit-to-width: scale = container width / natural page width
      const calculatedScale = availableWidth / unscaledViewport.width;
      console.log('Fit-width calculation:', {
        containerWidth: containerRect.width,
        availableWidth,
        pdfNaturalWidth: unscaledViewport.width,
        calculatedScale
      });
      return Math.max(calculatedScale, 0.1); // Ensure minimum scale
    } else if (fitMode === 'height') {
      // PDF.js fit-to-height: scale = container height / natural page height
      return availableHeight / unscaledViewport.height;
    }

    return scale;
  }, [fitMode, scale]);

  // Function to render PDF.js annotation layer using native PDF.js rendering
  const renderAnnotationLayer = useCallback(
    async (page: PDFPageProxy, viewport: any) => {
      if (!annotationLayerRef.current) return;

      try {
        // Import PDF.js annotation layer utilities
        const pdfjsLib = await import('pdfjs-dist');

        // Clear existing annotation layer
        annotationLayerRef.current.innerHTML = '';

        // Set up annotation layer styling to match PDF.js requirements
        const className = showFieldNames
          ? 'annotationLayer show-field-names'
          : 'annotationLayer hide-field-names';
        annotationLayerRef.current.className = className;
        annotationLayerRef.current.style.position = 'absolute';
        annotationLayerRef.current.style.left = '0';
        annotationLayerRef.current.style.top = '0';
        annotationLayerRef.current.style.width = `${viewport.width}px`;
        annotationLayerRef.current.style.height = `${viewport.height}px`;
        annotationLayerRef.current.style.pointerEvents = 'auto';
        annotationLayerRef.current.style.transformOrigin = '0 0';
        annotationLayerRef.current.style.overflow = 'hidden';
        annotationLayerRef.current.style.zIndex = '10';

        console.log(
          'Annotation layer setup with dimensions:',
          viewport.width,
          'x',
          viewport.height
        );

        // Get annotations from the page
        const annotations = await page.getAnnotations({ intent: 'display' });

        if (annotations.length === 0) {
          console.log('No annotations found on page');
          return;
        }

        console.log(
          `Found ${annotations.length} annotations on page ${page.pageNumber}`
        );

        // Debug: Let's see what PDF.js methods are actually available
        console.log('Available PDF.js exports:', Object.keys(pdfjsLib));
        console.log(
          'AnnotationLayer available?',
          !!(pdfjsLib as any).AnnotationLayer
        );

        // Use the page's built-in annotation rendering approach
        try {
          // Try using page.render for annotations - this is the most reliable method
          const annotationDiv = annotationLayerRef.current;

          // Clear and setup the annotation container
          annotationDiv.setAttribute('class', 'annotationLayer');

          // For PDF.js 3.11.x, we need to manually render each annotation
          console.log('Using manual annotation rendering for PDF.js 3.11.x');

          // Create a proper annotation layer using PDF.js internal methods
          for (const annotation of annotations) {
            if (!annotation.fieldType) continue;

            // Skip fields that start with "X_" or are system fields
            if (
              annotation.fieldName &&
              (annotation.fieldName.startsWith('X_') ||
                annotation.fieldName === 'dbTablename' ||
                annotation.fieldName === 'dbAction' ||
                annotation.fieldName === 'dbID' ||
                annotation.fieldName === 'zPaper' ||
                annotation.fieldName === 'kbup')
            ) {
              continue;
            }

            console.log(
              'Rendering annotation:',
              annotation.fieldType,
              annotation.fieldName
            );

            // Create annotation element using PDF.js coordinate system
            const section = document.createElement('section');
            section.className = 'annotationElement';

            // Get the proper transformed rectangle
            const rect = viewport.convertToViewportRectangle(annotation.rect);
            const [left, top, right, bottom] = rect;

            // Position the annotation element
            section.style.position = 'absolute';
            section.style.left = `${Math.min(left, right)}px`;
            section.style.top = `${Math.min(top, bottom)}px`;
            section.style.width = `${Math.abs(right - left)}px`;
            section.style.height = `${Math.abs(bottom - top)}px`;
            section.style.transformOrigin = '0 0';

            // Add field type specific classes for PDF.js styling
            if (annotation.fieldType === 'Tx') {
              section.className += ' textWidgetAnnotation';
            } else if (annotation.fieldType === 'Btn') {
              if (annotation.checkBox) {
                section.className += ' buttonWidgetAnnotation checkBox';
              } else if (annotation.radioButton) {
                section.className += ' buttonWidgetAnnotation radioButton';
              } else {
                section.className += ' buttonWidgetAnnotation pushButton';
              }
              // Ensure button widgets allow pointer events
              section.style.pointerEvents = 'auto';
              section.style.cursor = 'pointer';
              section.style.zIndex = '15';
            } else if (annotation.fieldType === 'Ch') {
              section.className += ' choiceWidgetAnnotation';
            } else if (annotation.fieldType === 'Sig') {
              section.className += ' signatureWidgetAnnotation';
            }

            // Create the actual form element
            const formElement = createNativeFormElement(annotation);
            if (formElement) {
              section.appendChild(formElement);

              // Add field name label if showFieldNames is true
              if (showFieldNames && annotation.fieldName) {
                const fieldLabel = document.createElement('div');
                fieldLabel.className = 'field-name-label';
                fieldLabel.textContent = annotation.fieldName;
                fieldLabel.style.position = 'absolute';
                // Position label above field, but if field is near top, position it below
                const fieldTop = Math.min(top, bottom);
                if (fieldTop < 25) {
                  fieldLabel.style.top = `${Math.abs(bottom - top) + 2}px`;
                } else {
                  fieldLabel.style.top = '-18px';
                }
                fieldLabel.style.left = '0';
                fieldLabel.style.fontSize = '10px';
                fieldLabel.style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
                fieldLabel.style.padding = '1px 3px';
                fieldLabel.style.borderRadius = '2px';
                fieldLabel.style.border = '1px solid #ccc';
                fieldLabel.style.fontFamily = 'monospace';
                fieldLabel.style.color = '#000';
                fieldLabel.style.pointerEvents = 'none';
                fieldLabel.style.zIndex = '30';
                fieldLabel.style.whiteSpace = 'nowrap';
                section.appendChild(fieldLabel);
              }

              annotationDiv.appendChild(section);
            }
          }

          console.log('Manual annotation rendering completed successfully');
        } catch (renderError) {
          console.error('Failed to render annotations:', renderError);
        }

        // Set up event listeners for form interactions immediately
        if (onFieldFocus || onFieldChange || onFieldBlur) {
          formFieldService.setupAnnotationLayerListeners(
            annotationLayerRef.current!,
            onFieldFocus || (() => {}),
            onFieldChange || (() => {}),
            onFieldBlur || (() => {})
          );
        }
      } catch (error) {
        console.error('Error rendering annotation layer:', error);
      }
    },
    [onFieldFocus, onFieldChange, onFieldBlur, showFieldNames, formData]
  );

  // Helper function to detect required fields based on PDF metadata
  const isFieldRequired = (annotation: any): boolean => {
    const fieldFlags = annotation.fieldFlags || 0;
    const isRequired = (fieldFlags & 2) !== 0; // Required flag from PDF metadata
    const fieldName = annotation.fieldName || '';
    const hasExplicitIndicator = fieldName.includes('*') || fieldName.includes('required');
    return isRequired || hasExplicitIndicator;
  };

  // Helper function to create clean native form elements
  const createNativeFormElement = (annotation: any): HTMLElement | null => {
    const fieldType = annotation.fieldType;

    switch (fieldType) {
      case 'Tx': // Text field
        if (annotation.multiLine) {
          const textarea = document.createElement('textarea');
          textarea.value = annotation.fieldValue || '';
          // No placeholder text
          if (annotation.maxLen) {
            textarea.maxLength = annotation.maxLen;
          }
          textarea.readOnly = annotation.readOnly || false;
          textarea.setAttribute(
            'data-field-id',
            annotation.fieldName || annotation.id || ''
          );
          textarea.setAttribute('name', annotation.fieldName || '');
          // Add required class for styling
          if (isFieldRequired(annotation)) {
            textarea.classList.add('required');
          }
          // Clean styling for textarea
          textarea.style.width = '100%';
          textarea.style.height = '100%';
          textarea.style.border = '1px solid #ccc';
          textarea.style.borderRadius = '2px';
          textarea.style.padding = '2px 4px';
          textarea.style.fontSize = '12px';
          textarea.style.fontFamily = 'inherit';
          textarea.style.resize = 'none';
          textarea.style.background = 'white';
          textarea.style.boxSizing = 'border-box';
          textarea.style.pointerEvents = 'auto';
          textarea.style.zIndex = '20';
          return textarea;
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = annotation.fieldValue || '';
          // No placeholder text
          if (annotation.maxLen) {
            input.maxLength = annotation.maxLen;
          }
          input.readOnly = annotation.readOnly || false;
          input.setAttribute(
            'data-field-id',
            annotation.fieldName || annotation.id || ''
          );
          input.setAttribute('name', annotation.fieldName || '');
          // Add required class for styling
          if (isFieldRequired(annotation)) {
            input.classList.add('required');
          }
          // Clean styling for input
          input.style.width = '100%';
          input.style.height = '100%';
          input.style.border = '1px solid #ccc';
          input.style.borderRadius = '2px';
          input.style.padding = '2px 4px';
          input.style.fontSize = '12px';
          input.style.fontFamily = 'inherit';
          input.style.background = 'white';
          input.style.boxSizing = 'border-box';
          input.style.pointerEvents = 'auto';
          input.style.zIndex = '20';
          return input;
        }

      case 'Btn': // Button field (checkbox/radio)
        const input = document.createElement('input');
        if (annotation.checkBox) {
          input.type = 'checkbox';
          input.checked =
            annotation.fieldValue === 'On' || annotation.fieldValue === true;
          // Checkbox specific styling
          input.style.width = '8px';
          input.style.height = '8px';
          input.style.margin = '0';
          input.style.position = 'absolute';
          input.style.left = '50%';
          input.style.top = '50%';
          input.style.transform = 'translate(-50%, -50%)';
          input.style.pointerEvents = 'auto';
          input.style.cursor = 'pointer';
          input.style.zIndex = '10';
        } else if (annotation.radioButton) {
          input.type = 'radio';
          input.name = annotation.fieldName || '';
          input.value = annotation.buttonValue || annotation.fieldName || '';
          input.checked =
            annotation.fieldValue === 'On' || annotation.fieldValue === true;
          // Radio button specific styling
          input.style.width = '8px';
          input.style.height = '8px';
          input.style.margin = '0';
          input.style.position = 'absolute';
          input.style.left = '50%';
          input.style.top = '50%';
          input.style.transform = 'translate(-50%, -50%)';
          input.style.pointerEvents = 'auto';
          input.style.cursor = 'pointer';
          input.style.zIndex = '10';
        } else {
          // Regular button
          const button = document.createElement('button');
          button.textContent = annotation.buttonValue || 'Button';
          button.disabled = annotation.readOnly || false;
          button.style.width = '100%';
          button.style.height = '100%';
          button.style.fontSize = '12px';
          return button;
        }
        input.disabled = annotation.readOnly || false;
        input.setAttribute(
          'data-field-id',
          annotation.fieldName || annotation.id || ''
        );
        // Add required class for styling
        if (isFieldRequired(annotation)) {
          input.classList.add('required');
        }
        input.setAttribute('name', annotation.fieldName || '');
        return input;

      case 'Ch': // Choice field (dropdown/listbox)
        const select = document.createElement('select');
        if (annotation.options) {
          annotation.options.forEach((option: any) => {
            const optionElement = document.createElement('option');
            const optionValue =
              typeof option === 'string' ? option : option.exportValue;
            const optionText =
              typeof option === 'string' ? option : option.displayValue;
            optionElement.value = optionValue;
            optionElement.textContent = optionText;
            if (optionValue === annotation.fieldValue) {
              optionElement.selected = true;
            }
            select.appendChild(optionElement);
          });
        }
        select.disabled = annotation.readOnly || false;
        select.setAttribute(
          'data-field-id',
          annotation.fieldName || annotation.id || ''
        );
        select.setAttribute('name', annotation.fieldName || '');
        // Add required class for styling
        if (isFieldRequired(annotation)) {
          select.classList.add('required');
        }
        // Clean dropdown styling
        select.style.width = '100%';
        select.style.height = '100%';
        select.style.border = '1px solid #ccc';
        select.style.borderRadius = '2px';
        select.style.fontSize = '12px';
        select.style.fontFamily = 'inherit';
        select.style.background = 'white';
        select.style.boxSizing = 'border-box';
        select.style.pointerEvents = 'auto';
        select.style.zIndex = '20';
        return select;

      case 'Sig': // Signature field
        const sigDiv = document.createElement('div');
        const fieldId = annotation.fieldName || annotation.id || '';
        sigDiv.setAttribute('data-field-id', fieldId);
        sigDiv.setAttribute('name', annotation.fieldName || '');
        // Add required class for styling
        if (isFieldRequired(annotation)) {
          sigDiv.classList.add('required');
        }
        sigDiv.style.width = '100%';
        sigDiv.style.height = '100%';
        sigDiv.style.border = '1px dashed #666';
        sigDiv.style.borderRadius = '2px';
        sigDiv.style.textAlign = 'center';
        sigDiv.style.display = 'flex';
        sigDiv.style.alignItems = 'center';
        sigDiv.style.justifyContent = 'center';
        sigDiv.style.cursor = 'pointer';
        sigDiv.style.fontSize = '12px';
        sigDiv.style.color = '#666';
        sigDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.05)';
        sigDiv.style.boxSizing = 'border-box';

        // Check if there's already a signature (from form data)
        const existingSignature = formData && formData[fieldId];
        if (
          existingSignature &&
          typeof existingSignature === 'string' &&
          existingSignature.startsWith('data:image/')
        ) {
          // Display existing signature
          const img = document.createElement('img');
          img.src = existingSignature;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.transform = 'scale(1.5)'; // Make signature 50% larger
          img.style.display = 'block';
          sigDiv.appendChild(img);
          sigDiv.style.padding = '0';
          sigDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          sigDiv.style.border = '1px solid #666';
          sigDiv.style.overflow = 'hidden';
          sigDiv.style.display = 'flex';
          sigDiv.style.alignItems = 'center';
          sigDiv.style.justifyContent = 'center';
        } else if (
          annotation.fieldValue &&
          annotation.fieldValue.startsWith('data:image/')
        ) {
          // Display PDF's existing signature
          const img = document.createElement('img');
          img.src = annotation.fieldValue;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.transform = 'scale(1.5)'; // Make signature 50% larger
          img.style.display = 'block';
          sigDiv.appendChild(img);
          sigDiv.style.padding = '0';
          sigDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          sigDiv.style.border = '1px solid #666';
          sigDiv.style.overflow = 'hidden';
          sigDiv.style.display = 'flex';
          sigDiv.style.alignItems = 'center';
          sigDiv.style.justifyContent = 'center';
        } else {
          sigDiv.textContent = 'Click to sign';
        }

        // Add click handler to open signature modal
        sigDiv.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentSignatureField(fieldId);
          
          // Calculate field dimensions from annotation rect
          if (annotation.rect && viewport) {
            const rect = viewport.convertToViewportRectangle(annotation.rect);
            const [left, top, right, bottom] = rect;
            const width = Math.abs(right - left);
            const height = Math.abs(bottom - top);
            setCurrentSignatureFieldDimensions({ width, height });
          }
          
          setSignatureModalOpen(true);
        });

        return sigDiv;

      default:
        console.warn(`Unsupported field type: ${fieldType}`);
        return null;
    }
  };

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
        setError(
          `Error loading PDF: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, currentPage]);

  // Track if annotation layer has been rendered to prevent re-renders
  const annotationLayerRendered = useRef(false);

  // Reset annotation layer flag when page changes, field name visibility changes, or fit mode changes
  useEffect(() => {
    annotationLayerRendered.current = false;
  }, [currentPage, showFieldNames, fitMode]);

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

        // Calculate the appropriate scale based on fit mode
        const containerElement = canvasRef.current!.parentElement!;
        const actualScale = calculateScale(currentPageObj, containerElement);

        console.log('Calculated scale:', actualScale, 'for fit mode:', fitMode);

        // Start new render task with cancellation tracking
        const task = pdfService.renderPageWithCancellation(
          currentPageObj,
          canvasRef.current!,
          actualScale
        );

        renderTaskRef.current = task;

        // Wait for render completion
        await task.promise;
        renderTaskRef.current = null;

        console.log('Page rendered successfully at scale:', actualScale);

        const pageViewport = currentPageObj.getViewport({ scale: actualScale });
        setViewport(pageViewport);

        // Ensure annotation layer container matches canvas styled dimensions (not device pixel ratio)
        if (annotationLayerRef.current && canvasRef.current) {
          // The annotation layer should match the viewport dimensions, not the canvas internal dimensions
          annotationLayerRef.current.style.width = `${pageViewport.width}px`;
          annotationLayerRef.current.style.height = `${pageViewport.height}px`;
          console.log(
            'Annotation layer sized:',
            pageViewport.width,
            'x',
            pageViewport.height
          );
        }

        // Create text layer for text selection
        if (textLayerRef.current) {
          await pdfService.createTextLayer(
            currentPageObj,
            textLayerRef.current,
            pageViewport
          );
          // Ensure text layer doesn't interfere with form interactions
          textLayerRef.current.style.pointerEvents = 'none';
          textLayerRef.current.style.zIndex = '1';
        }

        // Create annotation layer for form fields (only once per page)
        if (annotationLayerRef.current && !annotationLayerRendered.current) {
          await renderAnnotationLayer(currentPageObj, pageViewport);
          annotationLayerRendered.current = true;
        }

        // Extract enhanced form fields
        const pageFormFields = await formFieldService.extractFormFields(
          currentPageObj,
          currentPage,
          fieldConfigs
        );
        const allFields = pageFormFields.fields;
        setEnhancedFormFields(allFields);

        if (onFormFieldsDetected) {
          onFormFieldsDetected(allFields);
        }
      } catch (err) {
        // Don't show error for cancelled renders
        if (err instanceof Error && err.message.includes('cancelled')) {
          console.log('Render cancelled (expected):', err.message);
          return;
        }

        console.error('Error rendering page:', err);
        setError(
          `Error rendering PDF page: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
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
  }, [currentPageObj, scale, onFormFieldsDetected, renderAnnotationLayer, fitMode, calculateScale]);

  // Handle container resize for fit modes
  useEffect(() => {
    if (fitMode === 'default' || !currentPageObj) return;

    const handleResize = () => {
      // Trigger re-render when container size changes for fit modes
      if (canvasRef.current) {
        const containerElement = canvasRef.current.parentElement!;
        const newScale = calculateScale(currentPageObj, containerElement);
        console.log('Container resized, new scale:', newScale);
        
        // Force re-render by updating a dependency
        setCurrentPageObj((prev) => prev);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [fitMode, currentPageObj, calculateScale]);

  // Handle page changes
  useEffect(() => {
    if (!pdfDocument || currentPage < 1 || currentPage > pdfDocument.numPages)
      return;

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

  // Create field highlights for overlay
  const completedFieldIds = new Set(
    enhancedFormFields
      .filter(
        (field) =>
          formData[field.id] !== undefined &&
          formData[field.id] !== null &&
          formData[field.id] !== ''
      )
      .map((field) => field.id)
  );

  const fieldHighlights = useFieldHighlights(
    enhancedFormFields,
    completedFieldIds,
    validationErrors,
    currentFieldId || null,
    null, // wizardHighlightedFieldId - TODO: implement wizard integration
    viewport
  );

  // Handle signature save
  const handleSignatureSave = (signatureDataUrl: string) => {
    if (currentSignatureField && onFieldChange) {
      onFieldChange(currentSignatureField, signatureDataUrl);

      // Update the visual signature field immediately
      updateSignatureFieldVisual(currentSignatureField, signatureDataUrl);
    }
    setSignatureModalOpen(false);
    setCurrentSignatureField(null);
    setCurrentSignatureFieldDimensions(null);
  };

  // Update the visual appearance of a signature field
  const updateSignatureFieldVisual = (
    fieldId: string,
    signatureDataUrl: string
  ) => {
    if (!annotationLayerRef.current) return;

    // Find the signature field element
    const signatureElement = annotationLayerRef.current.querySelector(
      `[data-field-id="${fieldId}"]`
    ) as HTMLElement;

    if (signatureElement) {
      // Clear existing content
      signatureElement.innerHTML = '';

      // Create and add signature image
      const img = document.createElement('img');
      img.src = signatureDataUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain'; // Maintain aspect ratio but scale up
      img.style.transform = 'scale(1.5)'; // Make signature 50% larger
      img.style.display = 'block';
      signatureElement.appendChild(img);

      // Update the styling to better display the signature
      signatureElement.style.padding = '0'; // Remove padding to maximize space
      signatureElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      signatureElement.style.border = '1px solid #666';
      signatureElement.style.overflow = 'hidden'; // Ensure clean edges
      signatureElement.style.display = 'flex';
      signatureElement.style.alignItems = 'center';
      signatureElement.style.justifyContent = 'center';
    }
  };

  // Handle signature modal close
  const handleSignatureModalClose = () => {
    setSignatureModalOpen(false);
    setCurrentSignatureField(null);
    setCurrentSignatureFieldDimensions(null);
  };

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
      display={fitMode === 'width' ? 'block' : 'inline-block'}
      sx={{
        border: '1px solid #ccc',
        borderRadius: 1,
        overflow: 'hidden',
        width: fitMode === 'width' ? '100%' : 'auto',
        maxWidth: '100%',
        minHeight: fitMode === 'width' ? 'auto' : 'initial',
      }}
    >
      {/* Canvas Layer - Visual PDF content */}
      <canvas
        ref={canvasRef}
        data-testid="pdf-canvas"
        style={{
          display: 'block',
          maxWidth: fitMode === 'width' ? 'none' : '100%',
          width: fitMode === 'width' ? '100%' : 'auto',
          height: 'auto',
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
          pointerEvents: 'none',
          zIndex: 1,
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
          pointerEvents: 'auto',
          zIndex: 10,
        }}
      />

      {/* Field Overlay - Visual highlights and indicators */}
      {/* Temporarily disabled to see clean form fields */}
      {false && viewport && fieldHighlights.length > 0 && (
        <FieldOverlay
          viewport={viewport}
          highlightedFields={fieldHighlights}
          currentFieldId={currentFieldId || null}
          wizardHighlightedFieldId={null} // TODO: connect to wizard state
          showTooltips={true}
        />
      )}

      {/* Signature Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onClose={handleSignatureModalClose}
        onSave={handleSignatureSave}
        fieldName={currentSignatureField || 'Signature'}
        fieldDimensions={currentSignatureFieldDimensions || undefined}
      />
    </Box>
  );
};
