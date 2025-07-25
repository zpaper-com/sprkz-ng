import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { MarkupToolbar, type MarkupTool } from './MarkupToolbar';
import { MarkupOverlay } from './MarkupOverlay';
import { ImageStampDialog } from './ImageStampDialog';
import { HighlightAreaDialog } from './HighlightAreaDialog';
import { DateTimeStampDialog } from './DateTimeStampDialog';
import { TextAreaDialog } from './TextAreaDialog';
import { SignatureModal } from '../forms/SignatureModal';
import { useMarkup } from '../../contexts/MarkupContext';
import type {
  ImageStampAnnotation,
  SignatureAnnotation,
  DateTimeStampAnnotation,
  TextAreaAnnotation,
  MarkupAnnotation,
} from '../../contexts/MarkupContext';

export interface MarkupManagerProps {
  pageNumber: number;
  scale: number;
  containerWidth: number;
  containerHeight: number;
}

export const MarkupManager: React.FC<MarkupManagerProps> = ({
  pageNumber,
  scale,
  containerWidth,
  containerHeight,
}) => {
  const {
    state,
    setActiveTool,
    addAnnotation,
    updateAnnotation,
    getAnnotationsForPage,
    toggleToolbarCollapsed,
  } = useMarkup();

  // Dialog states
  const [imageStampDialogOpen, setImageStampDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [dateTimeDialogOpen, setDateTimeDialogOpen] = useState(false);
  const [textAreaDialogOpen, setTextAreaDialogOpen] = useState(false);

  // Pending placement coordinates
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number } | null>(null);
  
  // Edit mode state
  const [editingAnnotation, setEditingAnnotation] = useState<MarkupAnnotation | null>(null);

  // Handle tool selection from toolbar
  const handleToolSelect = useCallback((tool: MarkupTool | null) => {
    setActiveTool(tool);
    // Don't open dialogs immediately - wait for canvas click
  }, [setActiveTool]);

  // Handle canvas click for placing annotations
  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (state.activeTool) {
      setPendingPlacement({ x, y });
      
      // Open appropriate dialog after setting placement
      switch (state.activeTool) {
        case 'image-stamp':
          setImageStampDialogOpen(true);
          break;
        case 'highlight-area':
          setHighlightDialogOpen(true);
          break;
        case 'signature':
          setSignatureDialogOpen(true);
          break;
        case 'date-time-stamp':
          setDateTimeDialogOpen(true);
          break;
        case 'text-area':
          setTextAreaDialogOpen(true);
          break;
        case 'image-attachment':
          // TODO: Implement image attachment dialog
          console.log('Image attachment placement set at:', x, y);
          break;
      }
    }
  }, [state.activeTool]);

  // Handle annotation editing
  const handleAnnotationEdit = useCallback((annotationId: string) => {
    const annotations = getAnnotationsForPage(pageNumber);
    const annotation = annotations.find(a => a.id === annotationId);
    if (!annotation) return;

    setEditingAnnotation(annotation);

    // Open appropriate dialog based on annotation type
    switch (annotation.type) {
      case 'image-stamp':
        setImageStampDialogOpen(true);
        break;
      case 'highlight-area':
        setHighlightDialogOpen(true);
        break;
      case 'signature':
        setSignatureDialogOpen(true);
        break;
      case 'date-time-stamp':
        setDateTimeDialogOpen(true);
        break;
      case 'text-area':
        setTextAreaDialogOpen(true);
        break;
    }
  }, [getAnnotationsForPage, pageNumber]);

  // Generate unique ID for annotations
  const generateId = (): string => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle image stamp creation/editing
  const handleImageStampCreate = useCallback((
    imageData: string,
    width: number,
    height: number,
    opacity: number,
    rotation: number
  ) => {
    if (editingAnnotation) {
      // Edit mode - update existing annotation
      updateAnnotation(editingAnnotation.id, {
        imageData,
        width,
        height,
        opacity,
        rotation,
      });
      setEditingAnnotation(null);
    } else {
      // Create mode - create new annotation
      if (!pendingPlacement) return;

      const annotation: ImageStampAnnotation = {
        id: generateId(),
        type: 'image-stamp',
        pageNumber,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        width,
        height,
        timestamp: new Date(),
        imageData,
        opacity,
        rotation,
      };

      addAnnotation(annotation);
      setPendingPlacement(null);
      setActiveTool(null);
    }
    
    setImageStampDialogOpen(false);
  }, [editingAnnotation, pendingPlacement, pageNumber, addAnnotation, updateAnnotation, setActiveTool]);

  // Handle highlight area creation
  const handleHighlightCreate = useCallback((
    color: string,
    opacity: number,
    shape: 'rectangle' | 'freeform'
  ) => {
    // Store highlight settings in context for drawing mode
    // The actual highlight will be created when user draws on canvas
    console.log('Highlight settings applied:', { color, opacity, shape });
    setHighlightDialogOpen(false);
  }, []);

  // Handle signature creation/editing
  const handleSignatureCreate = useCallback((signatureData: string) => {
    if (editingAnnotation) {
      // Edit mode - update existing annotation
      updateAnnotation(editingAnnotation.id, {
        signatureData,
      });
      setEditingAnnotation(null);
      setSignatureDialogOpen(false);
    } else {
      // Create mode - create new annotation
      if (!pendingPlacement) return;

      // Estimate signature dimensions
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const width = Math.min(200, img.width);
        const height = width / aspectRatio;

        const annotation: SignatureAnnotation = {
          id: generateId(),
          type: 'signature',
          pageNumber,
          x: pendingPlacement.x,
          y: pendingPlacement.y,
          width,
          height,
          timestamp: new Date(),
          signatureData,
        };

        addAnnotation(annotation);
        setPendingPlacement(null);
        setActiveTool(null);
        setSignatureDialogOpen(false);
      };
      img.src = signatureData;
    }
  }, [editingAnnotation, pendingPlacement, pageNumber, addAnnotation, updateAnnotation, setActiveTool]);

  // Handle date/time stamp creation/editing
  const handleDateTimeStampCreate = useCallback((
    dateTime: Date,
    format: string,
    timezone?: string,
    autoUpdate?: boolean
  ) => {
    if (editingAnnotation) {
      // Edit mode - update existing annotation
      updateAnnotation(editingAnnotation.id, {
        dateTime,
        format,
        timezone,
        autoUpdate,
      });
      setEditingAnnotation(null);
    } else {
      // Create mode - create new annotation
      if (!pendingPlacement) return;

      // Calculate dimensions based on formatted text
      const formattedText = formatDateTime(dateTime, format);
      const width = Math.max(formattedText.length * 8, 120);
      const height = 30;

      const annotation: DateTimeStampAnnotation = {
        id: generateId(),
        type: 'date-time-stamp',
        pageNumber,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        width,
        height,
        timestamp: new Date(),
        dateTime,
        format,
        timezone,
        autoUpdate,
      };

      addAnnotation(annotation);
      setPendingPlacement(null);
      setActiveTool(null);
    }
    
    setDateTimeDialogOpen(false);
  }, [editingAnnotation, pendingPlacement, pageNumber, addAnnotation, updateAnnotation, setActiveTool]);

  // Handle text area creation/editing
  const handleTextAreaCreate = useCallback((
    text: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    backgroundColor: string | undefined,
    borderColor: string | undefined,
    textAlign: 'left' | 'center' | 'right',
    bold: boolean,
    italic: boolean,
    underline: boolean,
    width: number,
    height: number
  ) => {
    if (editingAnnotation) {
      // Edit mode - update existing annotation
      updateAnnotation(editingAnnotation.id, {
        text,
        fontSize,
        fontFamily,
        color,
        backgroundColor,
        borderColor,
        textAlign,
        bold,
        italic,
        underline,
        width,
        height,
      });
      setEditingAnnotation(null);
    } else {
      // Create mode - create new annotation
      if (!pendingPlacement) return;

      const annotation: TextAreaAnnotation = {
        id: generateId(),
        type: 'text-area',
        pageNumber,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        width,
        height,
        timestamp: new Date(),
        text,
        fontSize,
        fontFamily,
        color,
        backgroundColor,
        borderColor,
        textAlign,
        bold,
        italic,
        underline,
      };

      addAnnotation(annotation);
      setPendingPlacement(null);
      setActiveTool(null);
    }
    
    setTextAreaDialogOpen(false);
  }, [editingAnnotation, pendingPlacement, pageNumber, addAnnotation, updateAnnotation, setActiveTool]);

  // Handle dialog close (when cancelled)
  const handleDialogClose = useCallback(() => {
    setActiveTool(null);
    setPendingPlacement(null);
    setEditingAnnotation(null);
    setImageStampDialogOpen(false);
    setHighlightDialogOpen(false);
    setSignatureDialogOpen(false);
    setDateTimeDialogOpen(false);
    setTextAreaDialogOpen(false);
  }, [setActiveTool]);

  // Simple date formatting helper
  const formatDateTime = (date: Date, format: string): string => {
    // Simple implementation - in production, use a proper date library
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow events to pass through to PDF
        zIndex: 10,
        '& > *': {
          pointerEvents: 'auto', // Re-enable events for direct children (toolbar, dialogs)
        },
      }}
    >
      {/* Markup Toolbar */}
      <MarkupToolbar
        activeTool={state.activeTool}
        onToolSelect={handleToolSelect}
        collapsed={state.toolbarCollapsed}
        onCollapseToggle={toggleToolbarCollapsed}
      />

      {/* Markup Overlay for rendering annotations */}
      <MarkupOverlay
        pageNumber={pageNumber}
        scale={scale}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        onCanvasClick={handleCanvasClick}
        onAnnotationClick={handleAnnotationEdit}
      />

      {/* Dialogs */}
      <ImageStampDialog
        open={imageStampDialogOpen}
        onClose={handleDialogClose}
        onStampSelect={handleImageStampCreate}
        initialImageData={editingAnnotation?.type === 'image-stamp' ? editingAnnotation.imageData : undefined}
        initialWidth={editingAnnotation?.type === 'image-stamp' ? editingAnnotation.width : undefined}
        initialHeight={editingAnnotation?.type === 'image-stamp' ? editingAnnotation.height : undefined}
        initialOpacity={editingAnnotation?.type === 'image-stamp' ? editingAnnotation.opacity : undefined}
        initialRotation={editingAnnotation?.type === 'image-stamp' ? editingAnnotation.rotation : undefined}
      />

      <HighlightAreaDialog
        open={highlightDialogOpen}
        onClose={handleDialogClose}
        onHighlightSelect={handleHighlightCreate}
        defaultColor={editingAnnotation?.type === 'highlight-area' ? editingAnnotation.color : state.highlightColor}
        defaultOpacity={editingAnnotation?.type === 'highlight-area' ? editingAnnotation.opacity : state.highlightOpacity}
        defaultShape={editingAnnotation?.type === 'highlight-area' ? editingAnnotation.shape : undefined}
      />

      <SignatureModal
        open={signatureDialogOpen}
        onClose={handleDialogClose}
        onSave={handleSignatureCreate}
        fieldName="Markup Signature"
        initialSignature={editingAnnotation?.type === 'signature' ? editingAnnotation.signatureData : undefined}
      />

      <DateTimeStampDialog
        open={dateTimeDialogOpen}
        onClose={handleDialogClose}
        onDateTimeSelect={handleDateTimeStampCreate}
        initialDateTime={editingAnnotation?.type === 'date-time-stamp' ? editingAnnotation.dateTime : undefined}
        initialFormat={editingAnnotation?.type === 'date-time-stamp' ? editingAnnotation.format : undefined}
        initialTimezone={editingAnnotation?.type === 'date-time-stamp' ? editingAnnotation.timezone : undefined}
        initialAutoUpdate={editingAnnotation?.type === 'date-time-stamp' ? editingAnnotation.autoUpdate : undefined}
      />

      <TextAreaDialog
        open={textAreaDialogOpen}
        onClose={handleDialogClose}
        onTextAreaCreate={handleTextAreaCreate}
        initialText={editingAnnotation?.type === 'text-area' ? editingAnnotation.text : ''}
        initialFontSize={editingAnnotation?.type === 'text-area' ? editingAnnotation.fontSize : 14}
        initialFontFamily={editingAnnotation?.type === 'text-area' ? editingAnnotation.fontFamily : 'Arial, sans-serif'}
        initialColor={editingAnnotation?.type === 'text-area' ? editingAnnotation.color : '#000000'}
        initialBackgroundColor={editingAnnotation?.type === 'text-area' ? editingAnnotation.backgroundColor : ''}
        initialBorderColor={editingAnnotation?.type === 'text-area' ? editingAnnotation.borderColor : ''}
        initialTextAlign={editingAnnotation?.type === 'text-area' ? editingAnnotation.textAlign : 'left'}
        initialBold={editingAnnotation?.type === 'text-area' ? editingAnnotation.bold : false}
        initialItalic={editingAnnotation?.type === 'text-area' ? editingAnnotation.italic : false}
        initialUnderline={editingAnnotation?.type === 'text-area' ? editingAnnotation.underline : false}
        initialWidth={editingAnnotation?.type === 'text-area' ? editingAnnotation.width : 200}
        initialHeight={editingAnnotation?.type === 'text-area' ? editingAnnotation.height : 100}
      />
    </Box>
  );
};