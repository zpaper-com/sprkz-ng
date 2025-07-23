import React from 'react';
import {
  Box,
  Switch,
  FormControlLabel,
  Typography,
  Grid,
  Paper,
  Tooltip,
} from '@mui/material';
import { Feature } from '../../contexts/AdminContext';

interface FeatureTogglesProps {
  features: Feature[];
  enabledFeatures: { [featureId: number]: boolean };
  onUpdateFeatures: (features: { [featureId: number]: boolean }) => void;
}

const FeatureToggles: React.FC<FeatureTogglesProps> = ({
  features,
  enabledFeatures,
  onUpdateFeatures,
}) => {
  const handleToggle = (featureId: number, enabled: boolean) => {
    const updatedFeatures = {
      ...enabledFeatures,
      [featureId]: enabled,
    };
    
    onUpdateFeatures(updatedFeatures);
  };

  if (features.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          No features available. Create features in the Feature Management section first.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {features.map((feature) => (
        <Grid item xs={12} sm={6} md={4} key={feature.id}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderLeft: enabledFeatures[feature.id] ? '4px solid #4caf50' : '4px solid #e0e0e0',
              transition: 'border-color 0.2s ease',
            }}
          >
            <Box display="flex" flexDirection="column">
              <FormControlLabel
                control={
                  <Switch
                    checked={enabledFeatures[feature.id] || false}
                    onChange={(e) => handleToggle(feature.id, e.target.checked)}
                    size="medium"
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle2" fontWeight="medium">
                    {feature.name}
                  </Typography>
                }
                sx={{ mb: 1, ml: 0 }}
              />
              
              {feature.description && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {feature.description}
                </Typography>
              )}
              
              {feature.notes && (
                <Tooltip title={feature.notes} arrow>
                  <Typography 
                    variant="caption" 
                    color="textSecondary"
                    sx={{ 
                      cursor: 'help',
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {feature.notes}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default FeatureToggles;