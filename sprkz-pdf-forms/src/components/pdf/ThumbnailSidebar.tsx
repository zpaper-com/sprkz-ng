import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Typography,
  IconButton,
  Badge,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
  Fade,
  Chip,
  Divider,
  Paper,
  SwipeableDrawer
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  RadioButtonUnchecked,
  PictureAsPdf,
  ExpandMore,
  ExpandLess,
  TouchApp,
  Visibility,
  Assignment,
  Close
} from '@mui/icons-material';
import { PDFService } from '../../services/pdfService';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { animations } from '../../theme/theme';
import { microInteractionStyles, presets } from '../../utils/microInteractions';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageThumbnailProps {
  pageNumber: number;
  pdfDoc: PDFDocumentProxy;
  isSelected: boolean;
  isCompleted: boolean;
  hasFormFields: boolean;
  onClick: (pageNumber: number) => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({
  pageNumber,
  pdfDoc,
  isSelected,
  isCompleted,
  hasFormFields,
  onClick
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      if (thumbnail) return; // Already loaded
      
      try {
        setLoading(true);
        setError(false);
        
        const page = await PDFService.getPage(pdfDoc, pageNumber);
        const thumbnailDataUrl = await PDFService.generateThumbnail(page, 120);
        
        if (isMounted) {
          setThumbnail(thumbnailDataUrl);
        }
      } catch (err) {
        console.error(`Failed to generate thumbnail for page ${pageNumber}:`, err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [pageNumber, pdfDoc, thumbnail]);

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onClick(pageNumber)}
        selected={isSelected}
        sx={{
          flexDirection: 'column',
          py: 1,
          px: 2,
          minHeight: 160,
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderRadius: 1,
          mb: 1,
          mx: 1,
          ...microInteractionStyles.hoverLift,
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        {/* Thumbnail container */}
        <Box
          sx={{
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            overflow: 'hidden',
            backgroundColor: 'grey.50',
            position: 'relative'
          }}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : error ? (
            <PictureAsPdf color="disabled" />
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt={`Page ${pageNumber} thumbnail`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          ) : (
            <PictureAsPdf color="disabled" />
          )}

          {/* Completion indicator */}
          <Box
            position="absolute"
            top={4}
            right={4}
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: '50%',
              p: 0.25
            }}
          >
            {isCompleted ? (
              <CheckCircle color="success" fontSize="small" />
            ) : hasFormFields ? (
              <RadioButtonUnchecked color="warning" fontSize="small" />
            ) : (
              <RadioButtonUnchecked color="disabled" fontSize="small" />
            )}
          </Box>
        </Box>

        {/* Page number and status */}
        <Box textAlign="center" width="100%">
          <Typography variant="caption" fontWeight="bold">
            Page {pageNumber}
          </Typography>
          
          {hasFormFields && (
            <Typography variant="caption" display="block" color="textSecondary">
              {isCompleted ? 'Completed' : 'Has forms'}
            </Typography>
          )}
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

interface ThumbnailSidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  completedPages: Set<number>;
  pagesWithFormFields: Set<number>;
  onPageSelect: (pageNumber: number) => void;
  open?: boolean;
  onToggle?: () => void;
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pdfDoc,
  currentPage,
  completedPages,
  pagesWithFormFields,
  onPageSelect,
  open = true,
  onToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  // Auto-collapse on mobile
  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Generate page list
  const pages = useMemo(() => {
    if (!pdfDoc) return [];
    
    return Array.from({ length: pdfDoc.numPages }, (_, index) => index + 1);
  }, [pdfDoc]);

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const totalPages = pages.length;
    const completedCount = completedPages.size;
    const pagesWithForms = pagesWithFormFields.size;
    
    return {
      totalPages,
      completedCount,
      pagesWithForms,
      completionPercentage: pagesWithForms > 0 ? Math.round((completedCount / pagesWithForms) * 100) : 0
    };
  }, [pages.length, completedPages.size, pagesWithFormFields.size]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const drawerWidth = isCollapsed ? 60 : 160;

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      ...animations.fadeIn
    }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.paper',
          borderRadius: 0
        }}
      >
        <Collapse in={!isCollapsed} orientation="horizontal">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment color="primary" fontSize="small" />
            <Typography variant="h6" fontSize="0.875rem" fontWeight={600}>
              Pages
            </Typography>
          </Box>
        </Collapse>
        
        <Tooltip 
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} 
          placement="right"
        >
          <IconButton
            onClick={handleToggleCollapse}
            size="small"
            sx={{ 
              ml: isCollapsed ? 0 : 'auto',
              ...presets.iconButton
            }}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Progress summary */}
      <Collapse in={!isCollapsed}>
        <Box sx={{ p: 2, backgroundColor: 'background.elevated' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Progress
            </Typography>
            <Chip 
              label={`${completionStats.completionPercentage}%`}
              size="small"
              color={completionStats.completionPercentage === 100 ? 'success' : 'primary'}
              sx={{ height: '20px', fontSize: '0.75rem' }}
            />
          </Box>
          
          <Typography variant="caption" color="textSecondary" display="block">
            {completionStats.completedCount} of {completionStats.pagesWithForms} pages with forms
          </Typography>
          
          <Box 
            sx={{ 
              height: '4px', 
              backgroundColor: 'divider', 
              borderRadius: '2px', 
              mt: 1,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                height: '100%',
                backgroundColor: completionStats.completionPercentage === 100 ? 'success.main' : 'primary.main',
                borderRadius: '2px',
                width: `${completionStats.completionPercentage}%`,
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </Box>
        </Box>
      </Collapse>

      {/* Thumbnail list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isCollapsed ? (
          // Collapsed view - just page numbers with indicators
          <List sx={{ p: 0 }}>
            {pages.map((pageNumber) => (
              <Fade in={true} key={pageNumber} timeout={300 + pageNumber * 50}>
                <ListItem disablePadding>
                  <Tooltip 
                    title={`Page ${pageNumber}${pagesWithFormFields.has(pageNumber) ? ' (has forms)' : ''}`} 
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      onClick={() => onPageSelect(pageNumber)}
                      selected={pageNumber === currentPage}
                      sx={{
                        minHeight: '52px', // Touch-friendly
                        justifyContent: 'center',
                        px: 1,
                        mx: 0.5,
                        mb: 0.5,
                        borderRadius: 2,
                        ...microInteractionStyles.hoverScale,
                        ...microInteractionStyles.focusRing,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          }
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={pageNumber === currentPage ? 700 : 600}
                          sx={{ 
                            fontSize: '0.875rem',
                            lineHeight: 1
                          }}
                        >
                          {pageNumber}
                        </Typography>
                        
                        {/* Status indicator */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: completedPages.has(pageNumber) 
                              ? 'success.main' 
                              : pagesWithFormFields.has(pageNumber) 
                                ? 'warning.main' 
                                : 'transparent',
                            border: completedPages.has(pageNumber) 
                              ? '2px solid white' 
                              : pagesWithFormFields.has(pageNumber) 
                                ? '2px solid white' 
                                : 'none',
                            opacity: completedPages.has(pageNumber) || pagesWithFormFields.has(pageNumber) ? 1 : 0,
                            transition: 'all 0.2s'
                          }}
                        />
                      </Box>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              </Fade>
            ))}
          </List>
        ) : (
          // Expanded view - full thumbnails
          <List sx={{ p: 0 }}>
            {pages.map((pageNumber) => (
              <PageThumbnail
                key={pageNumber}
                pageNumber={pageNumber}
                pdfDoc={pdfDoc!}
                isSelected={pageNumber === currentPage}
                isCompleted={completedPages.has(pageNumber)}
                hasFormFields={pagesWithFormFields.has(pageNumber)}
                onClick={onPageSelect}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        variant="temporary"
        open={open || false}
        onClose={onToggle || (() => {})}
        onOpen={onToggle || (() => {})}
        disableBackdropTransition={true}
        disableDiscovery={true}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: isCollapsed ? 80 : 280,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            boxShadow: theme.shadows[8],
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <Box sx={{ 
          ...drawerContent.props.sx,
          height: '100vh',
          overflow: 'hidden'
        }}>
          {/* Mobile close header */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'background.paper',
              borderRadius: 0,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              <Typography variant="h6" fontSize="1rem" fontWeight={600}>
                Document Pages
              </Typography>
            </Box>
            
            <IconButton
              onClick={onToggle}
              size="large"
              sx={{ 
                minWidth: '48px',
                minHeight: '48px'
              }}
            >
              <Close />
            </IconButton>
          </Paper>
          
          {drawerContent.props.children.slice(1)} {/* Skip the original header */}
        </Box>
      </SwipeableDrawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};