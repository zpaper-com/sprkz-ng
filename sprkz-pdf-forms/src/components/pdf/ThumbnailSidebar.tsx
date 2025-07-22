import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  IconButton,
  Badge,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  RadioButtonUnchecked,
  PictureAsPdf
} from '@mui/icons-material';
import { PDFService } from '../../services/pdfService';
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {!isCollapsed && (
          <Typography variant="h6" fontSize="0.875rem">
            Pages
          </Typography>
        )}
        
        <IconButton
          onClick={handleToggleCollapse}
          size="small"
          sx={{ ml: isCollapsed ? 0 : 'auto' }}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      {/* Progress summary */}
      {!isCollapsed && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            Progress: {completionStats.completedCount}/{completionStats.pagesWithForms} pages
          </Typography>
          
          {completionStats.pagesWithForms > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.300',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      backgroundColor: 'success.main',
                      width: `${completionStats.completionPercentage}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="caption" sx={{ minWidth: 35 }}>
                {completionStats.completionPercentage}%
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Thumbnail list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isCollapsed ? (
          // Collapsed view - just page numbers with indicators
          <List sx={{ p: 0 }}>
            {pages.map((pageNumber) => (
              <ListItem key={pageNumber} disablePadding>
                <Tooltip title={`Page ${pageNumber}${pagesWithFormFields.has(pageNumber) ? ' (has forms)' : ''}`} placement="right">
                  <ListItemButton
                    onClick={() => onPageSelect(pageNumber)}
                    selected={pageNumber === currentPage}
                    sx={{
                      minHeight: 48,
                      justifyContent: 'center',
                      px: 1,
                      mx: 0.5,
                      mb: 0.5,
                      borderRadius: 1
                    }}
                  >
                    <Badge
                      overlap="circular"
                      badgeContent={
                        completedPages.has(pageNumber) ? (
                          <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                        ) : pagesWithFormFields.has(pageNumber) ? (
                          <RadioButtonUnchecked sx={{ fontSize: 14, color: 'warning.main' }} />
                        ) : null
                      }
                    >
                      <Typography variant="caption" fontWeight="bold">
                        {pageNumber}
                      </Typography>
                    </Badge>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
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
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 200,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
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