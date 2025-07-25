import React from 'react';
import {
  Box,
  Paper,
  Tooltip,
  IconButton,
  ButtonGroup,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Image as ImageIcon,
  Highlight as HighlightIcon,
  Create as SignatureIcon,
  Schedule as DateTimeIcon,
  TextFields as TextIcon,
  AttachFile as AttachmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useMarkupFeatures } from '../../hooks/useFeatureFlags';

export type MarkupTool = 
  | 'image-stamp'
  | 'highlight-area'
  | 'signature'
  | 'date-time-stamp'
  | 'text-area'
  | 'image-attachment';

export interface MarkupToolbarProps {
  activeTool: MarkupTool | null;
  onToolSelect: (tool: MarkupTool | null) => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export const MarkupToolbar: React.FC<MarkupToolbarProps> = ({
  activeTool,
  onToolSelect,
  collapsed = false,
  onCollapseToggle,
}) => {
  const markupFeatures = useMarkupFeatures();

  // Don't render toolbar if not enabled
  if (!markupFeatures.showMarkupToolbar) {
    return null;
  }

  const tools = [
    {
      id: 'image-stamp' as MarkupTool,
      icon: ImageIcon,
      label: 'Image Stamp',
      description: 'Add image stamps, logos, or watermarks',
      enabled: markupFeatures.showImageStamp,
    },
    {
      id: 'highlight-area' as MarkupTool,
      icon: HighlightIcon,
      label: 'Highlight Area',
      description: 'Highlight important sections',
      enabled: markupFeatures.showHighlightArea,
    },
    {
      id: 'signature' as MarkupTool,
      icon: SignatureIcon,
      label: 'Signature',
      description: 'Add signatures anywhere on the document',
      enabled: markupFeatures.showMarkupSignature,
    },
    {
      id: 'date-time-stamp' as MarkupTool,
      icon: DateTimeIcon,
      label: 'Date/Time Stamp',
      description: 'Insert current or custom date/time',
      enabled: markupFeatures.showDateTimeStamp,
    },
    {
      id: 'text-area' as MarkupTool,
      icon: TextIcon,
      label: 'Text Area',
      description: 'Add text annotations anywhere',
      enabled: markupFeatures.showTextArea,
    },
    {
      id: 'image-attachment' as MarkupTool,
      icon: AttachmentIcon,
      label: 'Image Attachment',
      description: 'Select and embed attachments',
      enabled: markupFeatures.showImageAttachment,
    },
  ].filter(tool => tool.enabled);

  // If no tools are enabled, don't render
  if (tools.length === 0) {
    return null;
  }

  const handleToolClick = (toolId: MarkupTool) => {
    // Toggle tool - if already active, deactivate it
    onToolSelect(activeTool === toolId ? null : toolId);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        minWidth: collapsed ? 48 : 240,
        maxWidth: collapsed ? 48 : 280,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: collapsed ? 1 : 2,
          py: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        {!collapsed && (
          <Typography variant="subtitle2" component="h3">
            Markup Tools
          </Typography>
        )}
        {onCollapseToggle && (
          <IconButton
            size="small"
            onClick={onCollapseToggle}
            sx={{ color: 'inherit' }}
          >
            {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        )}
      </Box>

      {/* Tool Buttons */}
      <Collapse in={!collapsed} timeout="auto" unmountOnExit>
        <Box sx={{ p: 1 }}>
          <ButtonGroup
            orientation="vertical"
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiButton-root': {
                justifyContent: 'flex-start',
                textAlign: 'left',
                px: 1.5,
                py: 1,
                minHeight: 44,
              },
            }}
          >
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              
              return (
                <Tooltip key={tool.id} title={tool.description} placement="right">
                  <IconButton
                    onClick={() => handleToolClick(tool.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      px: 1.5,
                      py: 1,
                      gap: 1.5,
                      borderRadius: 1,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      },
                      width: '100%',
                      border: 'none',
                      borderBottom: index < tools.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      borderRadius: 0,
                    }}
                  >
                    <Icon fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left' }}>
                      {tool.label}
                    </Typography>
                  </IconButton>
                </Tooltip>
              );
            })}
          </ButtonGroup>
        </Box>
      </Collapse>

      {/* Collapsed state - show only icons */}
      {collapsed && (
        <Box sx={{ p: 0.5 }}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <Tooltip key={tool.id} title={`${tool.label}: ${tool.description}`} placement="right">
                <IconButton
                  onClick={() => handleToolClick(tool.id)}
                  size="small"
                  sx={{
                    width: '100%',
                    mb: 0.5,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};