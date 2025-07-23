import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { URLConfig, Feature, PDFFile } from '../../contexts/AdminContext';
import URLPanel from './URLPanel';

interface URLListProps {
  urls: URLConfig[];
  features: Feature[];
  pdfs: PDFFile[];
  loading: boolean;
  onEdit: (url: URLConfig) => void;
  onDelete: (id: number) => void;
  onUpdateFeatures: (urlId: number, features: { [featureId: number]: boolean }) => void;
  onUpdatePDFFields: (urlId: number, pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }) => void;
}

const URLList: React.FC<URLListProps> = ({
  urls,
  features,
  pdfs,
  loading,
  onEdit,
  onDelete,
  onUpdateFeatures,
  onUpdatePDFFields,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (urls.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No URL configurations found. Click "Add URL" to create your first URL configuration.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {urls.map((url) => (
        <URLPanel
          key={url.id}
          url={url}
          features={features}
          pdfs={pdfs}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateFeatures={onUpdateFeatures}
          onUpdatePDFFields={onUpdatePDFFields}
        />
      ))}
    </Box>
  );
};

export default URLList;