import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import type { MarkupAnnotation } from '../../contexts/MarkupContext';

interface ResizeHandle {
  position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  cursor: string;
}

interface ResizableMarkupElementProps {
  annotation: MarkupAnnotation;
  scale: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<MarkupAnnotation>) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSelect: (id: string) => void;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { position: 'nw', cursor: 'nw-resize' },
  { position: 'ne', cursor: 'ne-resize' },
  { position: 'sw', cursor: 'sw-resize' },
  { position: 'se', cursor: 'se-resize' },
  { position: 'n', cursor: 'n-resize' },
  { position: 's', cursor: 's-resize' },
  { position: 'w', cursor: 'w-resize' },
  { position: 'e', cursor: 'e-resize' },
];

export const ResizableMarkupElement: React.FC<ResizableMarkupElementProps> = ({
  annotation,
  scale,
  isSelected,
  onUpdate,
  onDelete,
  onEdit,
  onSelect,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialBounds, setInitialBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const scaledX = annotation.x * scale;
  const scaledY = annotation.y * scale;
  const scaledWidth = annotation.width * scale;
  const scaledHeight = annotation.height * scale;

  // Handle drag start (only for drag handle)
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBounds({
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
    });
  }, [annotation]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBounds({
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
    });
  }, [annotation]);

  // Handle mouse move (global)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStart || !initialBounds) return;

    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    if (isDragging) {
      // Update position
      onUpdate(annotation.id, {
        x: initialBounds.x + deltaX,
        y: initialBounds.y + deltaY,
      });
    } else if (isResizing) {
      // Update size and position based on resize handle
      let newX = initialBounds.x;
      let newY = initialBounds.y;
      let newWidth = initialBounds.width;
      let newHeight = initialBounds.height;

      switch (isResizing) {
        case 'nw':
          newX = initialBounds.x + deltaX;
          newY = initialBounds.y + deltaY;
          newWidth = initialBounds.width - deltaX;
          newHeight = initialBounds.height - deltaY;
          break;
        case 'ne':
          newY = initialBounds.y + deltaY;
          newWidth = initialBounds.width + deltaX;
          newHeight = initialBounds.height - deltaY;
          break;
        case 'sw':
          newX = initialBounds.x + deltaX;
          newWidth = initialBounds.width - deltaX;
          newHeight = initialBounds.height + deltaY;
          break;
        case 'se':
          newWidth = initialBounds.width + deltaX;
          newHeight = initialBounds.height + deltaY;
          break;
        case 'n':
          newY = initialBounds.y + deltaY;
          newHeight = initialBounds.height - deltaY;
          break;
        case 's':
          newHeight = initialBounds.height + deltaY;
          break;
        case 'w':
          newX = initialBounds.x + deltaX;
          newWidth = initialBounds.width - deltaX;
          break;
        case 'e':
          newWidth = initialBounds.width + deltaX;
          break;
      }

      // Enforce minimum size
      const minSize = 20 / scale;
      if (newWidth < minSize) {
        if (isResizing.includes('w')) newX = initialBounds.x + initialBounds.width - minSize;
        newWidth = minSize;
      }
      if (newHeight < minSize) {
        if (isResizing.includes('n')) newY = initialBounds.y + initialBounds.height - minSize;
        newHeight = minSize;
      }

      onUpdate(annotation.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }
  }, [dragStart, initialBounds, isDragging, isResizing, scale, annotation.id, onUpdate]);

  // Handle mouse up (global)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
    setDragStart(null);
    setInitialBounds(null);
  }, []);

  // Add global mouse events when dragging/resizing
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Render annotation content based on type
  const renderAnnotationContent = () => {
    switch (annotation.type) {
      case 'highlight-area':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: annotation.color || '#ffff00',
              opacity: annotation.opacity || 0.3,
              borderRadius: annotation.shape === 'rectangle' ? 0 : '50%',
            }}
          />
        );

      case 'image-stamp':
        return (
          <img
            src={annotation.imageData}
            alt="Image stamp"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: annotation.opacity || 1,
              transform: annotation.rotation ? `rotate(${annotation.rotation}deg)` : undefined,
            }}
          />
        );

      case 'signature':
        return (
          <img
            src={annotation.signatureData}
            alt="Signature"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        );

      case 'date-time-stamp':
        const formattedDate = new Date(annotation.dateTime).toLocaleDateString();
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ccc',
              fontSize: Math.min(scaledHeight * 0.4, 14),
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
            }}
          >
            {formattedDate}
          </Box>
        );

      case 'text-area':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: annotation.backgroundColor || 'rgba(255, 255, 255, 0.9)',
              border: annotation.borderColor ? `1px solid ${annotation.borderColor}` : '1px solid #ccc',
              padding: '4px',
              fontSize: (annotation.fontSize || 12) * scale,
              fontFamily: annotation.fontFamily || 'Arial, sans-serif',
              fontWeight: annotation.bold ? 'bold' : 'normal',
              fontStyle: annotation.italic ? 'italic' : 'normal',
              textDecoration: annotation.underline ? 'underline' : 'none',
              color: annotation.color || '#000',
              textAlign: (annotation.textAlign as 'left' | 'center' | 'right') || 'left',
              overflow: 'hidden',
              wordWrap: 'break-word',
              display: 'flex',
              alignItems: 'flex-start',
              whiteSpace: 'pre-wrap',
            }}
          >
            {annotation.text}
          </Box>
        );

      case 'image-attachment':
        return (
          <img
            src={annotation.imageData}
            alt="Image attachment"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        );

      default:
        return <Box sx={{ width: '100%', height: '100%', backgroundColor: '#ccc' }} />;
    }
  };

  return (
    <Box
      ref={elementRef}
      data-annotation-element="true"
      sx={{
        position: 'absolute',
        left: scaledX,
        top: scaledY,
        width: scaledWidth,
        height: scaledHeight,
        cursor: 'default',
        border: isSelected ? '2px dashed #2196f3' : '1px solid transparent',
        '&:hover': {
          border: '1px solid #ff9800',
        },
        zIndex: 100,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(annotation.id);
      }}
    >
      {/* Annotation content */}
      {renderAnnotationContent()}

      {/* Drag handle */}
      <Box
        sx={{
          position: 'absolute',
          top: -24,
          left: 0,
          display: isSelected ? 'flex' : 'none',
          alignItems: 'center',
          gap: 0.5,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 0.5,
          py: 0.25,
          boxShadow: 2,
          zIndex: 1001,
        }}
      >
        <DragIcon 
          sx={{ fontSize: 12, cursor: isDragging ? 'grabbing' : 'grab' }} 
          onMouseDown={handleDragStart}
        />
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(annotation.id)}>
            <EditIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => onDelete(annotation.id)}>
            <DeleteIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Resize handles */}
      {isSelected && RESIZE_HANDLES.map((handle) => (
        <Box
          key={handle.position}
          sx={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: '#2196f3',
            border: '1px solid #fff',
            cursor: handle.cursor,
            zIndex: 1002,
            ...getHandlePosition(handle.position),
          }}
          onMouseDown={(e) => handleResizeStart(e, handle.position)}
        />
      ))}
    </Box>
  );
};

// Helper function to get resize handle positions
function getHandlePosition(position: string) {
  switch (position) {
    case 'nw': return { top: -4, left: -4 };
    case 'ne': return { top: -4, right: -4 };
    case 'sw': return { bottom: -4, left: -4 };
    case 'se': return { bottom: -4, right: -4 };
    case 'n': return { top: -4, left: '50%', marginLeft: -4 };
    case 's': return { bottom: -4, left: '50%', marginLeft: -4 };
    case 'w': return { top: '50%', left: -4, marginTop: -4 };
    case 'e': return { top: '50%', right: -4, marginTop: -4 };
    default: return {};
  }
}