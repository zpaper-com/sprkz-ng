import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { PDFFile } from '../../contexts/AdminContext';

interface PDFGridProps {
  pdfs: PDFFile[];
  defaultPdf: string;
  loading: boolean;
  onPreview: (filename: string) => void;
  onDelete: (filename: string) => void;
  onSetDefault: (filename: string) => void;
}

const PDFGrid: React.FC<PDFGridProps> = ({
  pdfs,
  defaultPdf,
  loading,
  onPreview,
  onDelete,
  onSetDefault,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (pdfs.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No PDFs found. Upload your first PDF using the upload zone above.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {pdfs.map((pdf) => {
        const isDefault = pdf.filename === defaultPdf;
        const sizeInMB = (pdf.size / 1024 / 1024).toFixed(2);
        
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={pdf.filename}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isDefault ? '2px solid #1976d2' : 'none',
                position: 'relative',
              }}
            >
              {isDefault && (
                <Chip
                  label="Default"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                />
              )}
              
              {/* PDF Thumbnail placeholder */}
              <Box
                sx={{
                  height: 150,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h1" color="textSecondary" sx={{ fontSize: 48 }}>
                  📄
                </Typography>
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  component="h3" 
                  gutterBottom
                  sx={{
                    fontWeight: 'medium',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pdf.filename}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Size: {sizeInMB} MB
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Uploaded: {new Date(pdf.uploadDate).toLocaleDateString()}
                </Typography>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Box display="flex" width="100%" justifyContent="space-between" alignItems="center">
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => onPreview(pdf.filename)}
                      color="primary"
                      title="Preview PDF"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => onSetDefault(pdf.filename)}
                      color={isDefault ? 'primary' : 'default'}
                      title={isDefault ? 'Current default' : 'Set as default'}
                    >
                      {isDefault ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={() => onDelete(pdf.filename)}
                    color="error"
                    title="Delete PDF"
                    disabled={isDefault}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PDFGrid;