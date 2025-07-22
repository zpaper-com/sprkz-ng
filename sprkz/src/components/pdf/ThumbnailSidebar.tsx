import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { pdfService } from '../../services/pdfService';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface ThumbnailSidebarProps {
  pdfDocument: PDFDocumentProxy | null;
  currentPage: number;
  onPageSelect: (pageNumber: number) => void;
  width?: number;
}

interface ThumbnailData {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  isRendered: boolean;
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pdfDocument,
  currentPage,
  onPageSelect,
  width = 150,
}) => {
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const thumbnailRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  // Initialize thumbnails when PDF document loads
  useEffect(() => {
    if (!pdfDocument) {
      setThumbnails([]);
      return;
    }

    const initThumbnails: ThumbnailData[] = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const canvas = document.createElement('canvas');
      thumbnailRefs.current.set(i, canvas);

      initThumbnails.push({
        pageNumber: i,
        canvas,
        isRendered: false,
      });
    }

    setThumbnails(initThumbnails);
  }, [pdfDocument]);

  // Render thumbnails
  useEffect(() => {
    if (!pdfDocument || thumbnails.length === 0) return;

    const renderThumbnails = async () => {
      for (const thumbnail of thumbnails) {
        if (thumbnail.isRendered) continue;

        try {
          const page = await pdfService.getPage(
            pdfDocument,
            thumbnail.pageNumber
          );

          // Calculate scale to fit thumbnail width
          const viewport = page.getViewport({ scale: 1.0 });
          const scale = (width - 20) / viewport.width; // 20px for padding

          await pdfService.renderPage(page, thumbnail.canvas, scale);

          // Update thumbnail as rendered
          setThumbnails((prev) =>
            prev.map((t) =>
              t.pageNumber === thumbnail.pageNumber
                ? { ...t, isRendered: true }
                : t
            )
          );
        } catch (error) {
          console.error(
            `Error rendering thumbnail ${thumbnail.pageNumber}:`,
            error
          );
        }
      }
    };

    renderThumbnails();
  }, [pdfDocument, thumbnails, width]);

  const handleThumbnailClick = (pageNumber: number) => {
    onPageSelect(pageNumber);
  };

  if (!pdfDocument) {
    return null;
  }

  return (
    <Box
      data-testid="thumbnail-sidebar"
      sx={{
        width: width,
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'grey.100',
        borderRight: '1px solid',
        borderColor: 'divider',
        p: 1,
      }}
    >
      {thumbnails.map((thumbnail) => (
        <Paper
          key={thumbnail.pageNumber}
          data-testid={`thumbnail-${thumbnail.pageNumber}`}
          className={currentPage === thumbnail.pageNumber ? 'selected' : ''}
          elevation={currentPage === thumbnail.pageNumber ? 3 : 1}
          sx={{
            mb: 1,
            p: 1,
            cursor: 'pointer',
            border: currentPage === thumbnail.pageNumber ? 2 : 0,
            borderColor:
              currentPage === thumbnail.pageNumber
                ? 'primary.main'
                : 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              elevation: 2,
              backgroundColor: 'action.hover',
            },
          }}
          onClick={() => handleThumbnailClick(thumbnail.pageNumber)}
        >
          {/* Thumbnail Canvas */}
          <Box display="flex" justifyContent="center" mb={1}>
            <canvas
              ref={(el) => {
                if (
                  el &&
                  thumbnailRefs.current.get(thumbnail.pageNumber) !== el
                ) {
                  // Copy rendered content to displayed canvas
                  const sourceCanvas = thumbnailRefs.current.get(
                    thumbnail.pageNumber
                  );
                  if (sourceCanvas && thumbnail.isRendered) {
                    el.width = sourceCanvas.width;
                    el.height = sourceCanvas.height;
                    const ctx = el.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(sourceCanvas, 0, 0);
                    }
                  }
                }
              }}
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #ddd',
                borderRadius: 2,
              }}
            />
          </Box>

          {/* Page Number */}
          <Typography
            variant="caption"
            align="center"
            display="block"
            color={
              currentPage === thumbnail.pageNumber
                ? 'primary'
                : 'text.secondary'
            }
          >
            {thumbnail.pageNumber}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};
