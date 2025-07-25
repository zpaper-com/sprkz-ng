import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { useMarkup } from '../../contexts/MarkupContext';
import { ResizableMarkupElement } from './ResizableMarkupElement';
import type { MarkupAnnotation } from '../../contexts/MarkupContext';

export interface MarkupOverlayProps {
  pageNumber: number;
  scale: number;
  containerWidth: number;
  containerHeight: number;
  onAnnotationClick?: (annotationId: string) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

export const MarkupOverlay: React.FC<MarkupOverlayProps> = ({
  pageNumber,
  scale,
  containerWidth,
  containerHeight,
  onAnnotationClick,
  onCanvasClick,
}) => {
  const {
    state,
    selectAnnotation,
    deleteAnnotation,
    updateAnnotation,
    getAnnotationsForPage,
  } = useMarkup();

  const annotations = getAnnotationsForPage(pageNumber);

  // Handle annotation updates (position, size, etc.)
  const handleAnnotationUpdate = useCallback((id: string, updates: Partial<MarkupAnnotation>) => {
    updateAnnotation(id, updates);
  }, [updateAnnotation]);

  // Handle annotation editing (only from edit button)
  const handleAnnotationEdit = useCallback((id: string) => {
    const annotation = annotations.find(a => a.id === id);
    if (!annotation) return;
    
    // Select the annotation first
    selectAnnotation(id);
    
    // Trigger edit event with annotation data
    onAnnotationClick?.(id);
  }, [annotations, selectAnnotation, onAnnotationClick]);

  // Handle annotation selection (from element click - no dialog)
  const handleAnnotationSelect = useCallback((id: string) => {
    selectAnnotation(id);
    // Don't trigger onAnnotationClick for selection - only for editing
  }, [selectAnnotation]);

  // Handle annotation deletion
  const handleAnnotationDelete = useCallback((id: string) => {
    deleteAnnotation(id);
  }, [deleteAnnotation]);

  // Handle background click to deselect and place new annotations
  const handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Allow clicks on the background or if no specific annotation element was clicked
    const isAnnotationElement = (event.target as HTMLElement).closest('[data-annotation-element="true"]');
    
    if (!isAnnotationElement) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / scale;
      const y = (event.clientY - rect.top) / scale;
      
      selectAnnotation(null);
      onCanvasClick?.(x, y);
    }
  }, [scale, selectAnnotation, onCanvasClick]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerWidth,
        height: containerHeight,
        pointerEvents: 'auto',
        zIndex: 15, // Higher than PDF.js annotation layer (which uses 10)
        cursor: state.activeTool ? 'crosshair' : 'default',
      }}
      onClick={handleBackgroundClick}
    >
      {/* Render all annotations as resizable DOM elements */}
      {annotations.map((annotation) => (
        <ResizableMarkupElement
          key={annotation.id}
          annotation={annotation}
          scale={scale}
          isSelected={state.selectedAnnotationId === annotation.id}
          onUpdate={handleAnnotationUpdate}
          onDelete={handleAnnotationDelete}
          onEdit={handleAnnotationEdit}
          onSelect={handleAnnotationSelect}
        />
      ))}

      {/* Visual feedback for active tool */}
      {state.activeTool && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.875rem',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          Click to place {state.activeTool.replace('-', ' ')}
        </Box>
      )}
    </Box>
  );
};