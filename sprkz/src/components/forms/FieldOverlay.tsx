import React, { useEffect, useRef, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Tooltip, Fade } from '@mui/material';
import type { FormField } from '../../services/formFieldService';

const OverlayContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 10,
  '& .field-highlight': {
    position: 'absolute',
    borderRadius: theme.spacing(0.5),
    transition: 'all 0.2s ease-in-out',
    pointerEvents: 'none',
  },
  '& .field-highlight--current': {
    border: `2px solid ${theme.palette.primary.main}`,
    backgroundColor: `${theme.palette.primary.main}15`,
    boxShadow: `0 0 0 4px ${theme.palette.primary.main}25`,
  },
  '& .field-highlight--required': {
    border: `2px solid ${theme.palette.warning.main}`,
    backgroundColor: `${theme.palette.warning.main}10`,
  },
  '& .field-highlight--error': {
    border: `2px solid ${theme.palette.error.main}`,
    backgroundColor: `${theme.palette.error.main}15`,
    boxShadow: `0 0 0 2px ${theme.palette.error.main}25`,
  },
  '& .field-highlight--completed': {
    border: `2px solid ${theme.palette.success.main}`,
    backgroundColor: `${theme.palette.success.main}10`,
  },
  '& .field-highlight--signature': {
    border: `2px dashed ${theme.palette.secondary.main}`,
    backgroundColor: `${theme.palette.secondary.main}10`,
  },
  '& .field-indicator': {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
    color: theme.palette.common.white,
    pointerEvents: 'none',
  },
  '& .field-indicator--required': {
    backgroundColor: theme.palette.warning.main,
  },
  '& .field-indicator--completed': {
    backgroundColor: theme.palette.success.main,
  },
  '& .field-indicator--error': {
    backgroundColor: theme.palette.error.main,
  },
}));

interface FieldHighlight {
  fieldId: string;
  rect: { x: number; y: number; width: number; height: number };
  type: 'current' | 'required' | 'error' | 'completed' | 'signature';
  field: FormField;
  errorMessage?: string;
}

interface FieldOverlayProps {
  // Viewport information for coordinate transformation
  viewport: any;

  // Fields to highlight
  highlightedFields: FieldHighlight[];

  // Current field being focused
  currentFieldId: string | null;

  // Callback when a field highlight is clicked
  onFieldHighlightClick?: (fieldId: string) => void;

  // Show field tooltips
  showTooltips?: boolean;

  // Animation duration for highlight changes
  animationDuration?: number;
}

export const FieldOverlay: React.FC<FieldOverlayProps> = ({
  viewport,
  highlightedFields,
  currentFieldId,
  onFieldHighlightClick,
  showTooltips = true,
  animationDuration = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get CSS class for field highlight based on type
  const getHighlightClass = useCallback(
    (highlight: FieldHighlight) => {
      const baseClass = 'field-highlight';
      const typeClass = `field-highlight--${highlight.type}`;
      const currentClass =
        highlight.fieldId === currentFieldId ? 'field-highlight--current' : '';

      return `${baseClass} ${typeClass} ${currentClass}`.trim();
    },
    [currentFieldId]
  );

  // Get indicator content and class for field
  const getIndicatorInfo = useCallback((highlight: FieldHighlight) => {
    switch (highlight.type) {
      case 'required':
        return { content: '*', class: 'field-indicator--required' };
      case 'completed':
        return { content: '✓', class: 'field-indicator--completed' };
      case 'error':
        return { content: '!', class: 'field-indicator--error' };
      case 'signature':
        return { content: '✎', class: 'field-indicator--signature' };
      default:
        return null;
    }
  }, []);

  // Create tooltip content for field
  const getTooltipContent = useCallback((highlight: FieldHighlight) => {
    const { field, errorMessage } = highlight;
    let content = field.name;

    if (errorMessage) {
      content += `\nError: ${errorMessage}`;
    }

    if (field.required) {
      content += '\n(Required)';
    }

    if (field.placeholder) {
      content += `\nPlaceholder: ${field.placeholder}`;
    }

    return content;
  }, []);

  // Handle click on field highlight
  const handleHighlightClick = useCallback(
    (fieldId: string) => {
      if (onFieldHighlightClick) {
        onFieldHighlightClick(fieldId);
      }
    },
    [onFieldHighlightClick]
  );

  // Render individual field highlight
  const renderFieldHighlight = useCallback(
    (highlight: FieldHighlight) => {
      const { fieldId, rect } = highlight;
      const highlightClass = getHighlightClass(highlight);
      const indicatorInfo = getIndicatorInfo(highlight);
      const tooltipContent = getTooltipContent(highlight);

      const highlightStyle: React.CSSProperties = {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        pointerEvents: onFieldHighlightClick ? 'auto' : 'none',
        cursor: onFieldHighlightClick ? 'pointer' : 'default',
      };

      const highlightElement = (
        <Box
          key={fieldId}
          className={highlightClass}
          style={highlightStyle}
          onClick={() => handleHighlightClick(fieldId)}
        >
          {indicatorInfo && (
            <Box className={`field-indicator ${indicatorInfo.class}`}>
              {indicatorInfo.content}
            </Box>
          )}
        </Box>
      );

      // Wrap with tooltip if enabled
      if (showTooltips && tooltipContent) {
        return (
          <Tooltip
            key={fieldId}
            title={tooltipContent}
            placement="top"
            TransitionComponent={Fade}
            TransitionProps={{ timeout: animationDuration }}
          >
            <Box sx={{ display: 'inline-block' }}>{highlightElement}</Box>
          </Tooltip>
        );
      }

      return highlightElement;
    },
    [
      getHighlightClass,
      getIndicatorInfo,
      getTooltipContent,
      handleHighlightClick,
      onFieldHighlightClick,
      showTooltips,
      animationDuration,
    ]
  );

  // Update overlay position if viewport changes
  useEffect(() => {
    if (containerRef.current && viewport) {
      const container = containerRef.current;
      container.style.width = `${viewport.width}px`;
      container.style.height = `${viewport.height}px`;
    }
  }, [viewport]);

  return (
    <OverlayContainer
      ref={containerRef}
      sx={{
        width: viewport?.width || '100%',
        height: viewport?.height || '100%',
      }}
    >
      {highlightedFields.map(renderFieldHighlight)}
    </OverlayContainer>
  );
};

// Hook to create field highlights from form state
export const useFieldHighlights = (
  fields: FormField[],
  completedFieldIds: Set<string>,
  validationErrors: Record<string, string>,
  currentFieldId: string | null,
  viewport: any
): FieldHighlight[] => {
  return React.useMemo(() => {
    if (!viewport) return [];

    return fields.map((field) => {
      // Transform PDF coordinates to viewport coordinates
      const [x1, y1, x2, y2] = field.rect;
      const rect = {
        x: Math.min(x1, x2),
        y: viewport.height - Math.max(y1, y2), // Flip Y coordinate
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };

      // Determine highlight type based on field state
      let type: FieldHighlight['type'] = 'required';

      if (validationErrors[field.id]) {
        type = 'error';
      } else if (completedFieldIds.has(field.id)) {
        type = 'completed';
      } else if (field.type === 'signature') {
        type = 'signature';
      } else if (field.required) {
        type = 'required';
      }

      // Override with current if this is the focused field
      if (field.id === currentFieldId) {
        type = 'current';
      }

      return {
        fieldId: field.id,
        rect,
        type,
        field,
        errorMessage: validationErrors[field.id],
      };
    });
  }, [fields, completedFieldIds, validationErrors, currentFieldId, viewport]);
};
