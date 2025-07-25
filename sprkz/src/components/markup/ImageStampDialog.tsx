import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  RotateRight as RotateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Pre-defined stamp library (could be loaded from admin configuration)
const PREDEFINED_STAMPS = [
  {
    id: 'approved',
    name: 'Approved',
    category: 'status',
    // This would be a real image in production
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ1IiBzdHJva2U9ImdyZWVuIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz4KPHRleHQgeD0iNTAiIHk9IjU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9ImdyZWVuIj5BUFBST1ZFRDwvdGV4dD4KPC9zdmc+',
  },
  {
    id: 'rejected',
    name: 'Rejected',
    category: 'status',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQ1IiBzdHJva2U9InJlZCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZWQiPlJFSkVDVEVEPC90ZXh0Pgo8L3N2Zz4=',
  },
  {
    id: 'urgent',
    name: 'Urgent',
    category: 'priority',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBzdHJva2U9Im9yYW5nZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJvcmFuZ2UiIGZvbnQtd2VpZ2h0PSJib2xkIj5VUkdFTlQ8L3RleHQ+Cjwvc3ZnPg==',
  },
  {
    id: 'confidential',
    name: 'Confidential',
    category: 'security',
    dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBzdHJva2U9InB1cnBsZSIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjUwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJwdXJwbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj5DT05GSURFTlRJQUw8L3RleHQ+Cjwvc3ZnPg==',
  },
];

export interface ImageStampDialogProps {
  open: boolean;
  onClose: () => void;
  onStampSelect: (imageData: string, width: number, height: number, opacity: number, rotation: number) => void;
  initialImageData?: string;
  initialWidth?: number;
  initialHeight?: number;
  initialOpacity?: number;
  initialRotation?: number;
}

export const ImageStampDialog: React.FC<ImageStampDialogProps> = ({
  open,
  onClose,
  onStampSelect,
  initialImageData,
  initialWidth = 100,
  initialHeight = 100,
  initialOpacity = 1,
  initialRotation = 0,
}) => {
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImageData || null);
  const [opacity, setOpacity] = useState<number>(initialOpacity);
  const [rotation, setRotation] = useState<number>(initialRotation);
  const [stampSize, setStampSize] = useState<{ width: number; height: number }>({ width: initialWidth, height: initialHeight });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update state when initial values change (for edit mode)
  useEffect(() => {
    if (initialImageData) {
      setUploadedImage(initialImageData);
      setSelectedStamp(null); // Clear predefined stamp selection when editing
    }
    setOpacity(initialOpacity);
    setRotation(initialRotation);
    setStampSize({ width: initialWidth, height: initialHeight });
  }, [initialImageData, initialOpacity, initialRotation, initialWidth, initialHeight]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(PREDEFINED_STAMPS.map(stamp => stamp.category)))];
  
  // Filter stamps by category
  const filteredStamps = selectedCategory === 'all' 
    ? PREDEFINED_STAMPS 
    : PREDEFINED_STAMPS.filter(stamp => stamp.category === selectedCategory);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, GIF, SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file must be smaller than 5MB');
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      setSelectedStamp(null);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setStampSize({ width: Math.min(img.width, 150), height: Math.min(img.height, 150) });
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle predefined stamp selection
  const handleStampSelect = (stampId: string, _stampData: string) => {
    setSelectedStamp(stampId);
    setUploadedImage(null);
    setUploadError(null);
    
    // Reset size for predefined stamps
    setStampSize({ width: 100, height: 100 });
  };

  // Get current image data
  const getCurrentImageData = (): string | null => {
    if (uploadedImage) return uploadedImage;
    if (selectedStamp) {
      const stamp = PREDEFINED_STAMPS.find(s => s.id === selectedStamp);
      return stamp?.dataUrl || null;
    }
    return null;
  };

  // Handle stamp application
  const handleApplyStamp = () => {
    const imageData = getCurrentImageData();
    if (imageData) {
      onStampSelect(imageData, stampSize.width, stampSize.height, opacity, rotation);
    }
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    setSelectedStamp(null);
    setUploadedImage(null);
    setOpacity(1);
    setRotation(0);
    setStampSize({ width: 100, height: 100 });
    setSelectedCategory('all');
    setUploadError(null);
    onClose();
  };

  // Clear uploaded image
  const handleClearUpload = () => {
    setUploadedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentImageData = getCurrentImageData();

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Image Stamp</DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Custom Image
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Image
              </Button>
              {uploadedImage && (
                <Tooltip title="Clear uploaded image">
                  <IconButton onClick={handleClearUpload} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {uploadError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {uploadError}
              </Alert>
            )}
          </Box>

          {/* Predefined Stamps Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Predefined Stamps
            </Typography>
            
            {/* Category Filter */}
            <FormControl sx={{ mb: 2, minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Stamp Grid */}
            <Grid container spacing={2}>
              {filteredStamps.map((stamp) => (
                <Grid item xs={6} sm={4} md={3} key={stamp.id}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: selectedStamp === stamp.id ? '2px solid' : '1px solid',
                      borderColor: selectedStamp === stamp.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                      },
                    }}
                    onClick={() => handleStampSelect(stamp.id, stamp.dataUrl)}
                  >
                    <img
                      src={stamp.dataUrl}
                      alt={stamp.name}
                      style={{ width: 60, height: 60, objectFit: 'contain' }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      {stamp.name}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Preview and Settings */}
          {currentImageData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Stamp Settings
              </Typography>
              
              <Grid container spacing={3}>
                {/* Preview */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      minHeight: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'grey.50',
                    }}
                  >
                    <img
                      src={currentImageData}
                      alt="Stamp preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 120,
                        opacity: opacity,
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  </Paper>
                </Grid>

                {/* Settings */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Size */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Size (pixels)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ minWidth: 20 }}>W:</Typography>
                        <Slider
                          value={stampSize.width}
                          onChange={(_, value) => setStampSize(prev => ({ ...prev, width: value as number }))}
                          min={20}
                          max={300}
                          valueLabelDisplay="auto"
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ minWidth: 20 }}>H:</Typography>
                        <Slider
                          value={stampSize.height}
                          onChange={(_, value) => setStampSize(prev => ({ ...prev, height: value as number }))}
                          min={20}
                          max={300}
                          valueLabelDisplay="auto"
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    </Box>

                    {/* Opacity */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Opacity
                      </Typography>
                      <Slider
                        value={opacity}
                        onChange={(_, value) => setOpacity(value as number)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      />
                    </Box>

                    {/* Rotation */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Rotation
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Slider
                          value={rotation}
                          onChange={(_, value) => setRotation(value as number)}
                          min={-180}
                          max={180}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value}°`}
                          sx={{ flex: 1 }}
                        />
                        <Tooltip title="Reset rotation">
                          <IconButton onClick={() => setRotation(0)} size="small">
                            <RotateIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleApplyStamp}
          variant="contained"
          disabled={!currentImageData}
        >
          Add Stamp
        </Button>
      </DialogActions>
    </Dialog>
  );
};