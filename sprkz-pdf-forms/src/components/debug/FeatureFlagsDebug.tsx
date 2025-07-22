import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
  IconButton,
  Tooltip,
  Badge,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  ExpandMore,
  Refresh,
  Settings,
  BugReport,
  Visibility,
  VisibilityOff,
  Info,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { FeatureFlags, FEATURE_CATEGORIES, DEFAULT_FEATURE_FLAGS } from '../../services/unleashService';
import { useFeatureFlagsDebug } from '../../hooks/useFeatureFlags';

interface FeatureFlagsDebugProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  compact?: boolean;
  visible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
}

const FeatureFlagsDebug: React.FC<FeatureFlagsDebugProps> = ({
  position = 'bottom-right',
  compact = false,
  visible = false,
  onToggleVisibility
}) => {
  const { getAllFlags, isReady, isInitialized, status, refresh, updateContext } = useFeatureFlags();
  const { flags: debugFlags, refresh: refreshDebug } = useFeatureFlagsDebug();
  
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof FEATURE_CATEGORIES | 'ALL'>('ALL');
  const [contextOverrides, setContextOverrides] = useState<Record<string, string>>({});
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      maxWidth: compact ? 320 : 600,
      maxHeight: compact ? 400 : 800,
      overflow: 'auto'
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      default:
        return { ...baseStyles, bottom: 16, right: 16 };
    }
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (!isReady) {
      return { color: 'warning' as const, icon: <Warning />, text: 'Loading' };
    }
    if (!isInitialized) {
      return { color: 'error' as const, icon: <Error />, text: 'Failed' };
    }
    return { color: 'success' as const, icon: <CheckCircle />, text: 'Ready' };
  };

  // Filter flags based on category and differences
  const getFilteredFlags = (): Partial<FeatureFlags> => {
    const allFlags = getAllFlags(contextOverrides);
    
    let filteredFlags = allFlags;
    
    // Filter by category
    if (selectedCategory !== 'ALL') {
      const categoryKeys = FEATURE_CATEGORIES[selectedCategory] as Array<keyof FeatureFlags>;
      filteredFlags = Object.fromEntries(
        Object.entries(allFlags).filter(([key]) => categoryKeys.includes(key as keyof FeatureFlags))
      ) as Partial<FeatureFlags>;
    }
    
    // Show only differences from defaults
    if (showOnlyDifferences) {
      filteredFlags = Object.fromEntries(
        Object.entries(filteredFlags).filter(([key, value]) => 
          value !== DEFAULT_FEATURE_FLAGS[key as keyof FeatureFlags]
        )
      ) as Partial<FeatureFlags>;
    }
    
    return filteredFlags;
  };

  const statusInfo = getStatusIndicator();
  const filteredFlags = getFilteredFlags();

  // Toggle visibility
  const toggleVisibility = () => {
    const newVisible = !visible;
    onToggleVisibility?.(newVisible);
  };

  // Refresh all flags
  const handleRefresh = () => {
    refresh();
    refreshDebug();
  };

  // Update context
  const handleContextUpdate = (key: string, value: string) => {
    const newContext = { ...contextOverrides, [key]: value };
    setContextOverrides(newContext);
    updateContext(newContext);
  };

  if (!visible) {
    // Floating toggle button
    return (
      <Box sx={getPositionStyles()}>
        <Tooltip title="Feature Flags Debug Panel">
          <IconButton
            onClick={toggleVisibility}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              boxShadow: 2
            }}
          >
            <Badge
              badgeContent={Object.keys(filteredFlags).length}
              color={statusInfo.color}
              variant="dot"
            >
              <Settings />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={getPositionStyles()}>
      <Paper elevation={8} sx={{ opacity: 0.95, backdropFilter: 'blur(4px)' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Feature Flags
            </Typography>
            <Chip
              icon={statusInfo.icon}
              label={statusInfo.text}
              size="small"
              color={statusInfo.color}
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh flags">
              <IconButton size="small" onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle panel size">
              <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close panel">
              <IconButton size="small" onClick={toggleVisibility}>
                <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Collapse in={isExpanded}>
          <Box sx={{ p: 2 }}>
            {/* Status Information */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1.5 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Status
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {isInitialized ? 'Connected' : 'Fallback Mode'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Flag Count
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {Object.keys(filteredFlags).length} / {Object.keys(DEFAULT_FEATURE_FLAGS).length}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Controls */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showOnlyDifferences}
                    onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption">
                    Only Differences
                  </Typography>
                }
              />
            </Box>

            {/* Category Filter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary" gutterBottom>
                Category Filter
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip
                  label="ALL"
                  size="small"
                  onClick={() => setSelectedCategory('ALL')}
                  color={selectedCategory === 'ALL' ? 'primary' : 'default'}
                  variant={selectedCategory === 'ALL' ? 'filled' : 'outlined'}
                />
                {Object.keys(FEATURE_CATEGORIES).map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    size="small"
                    onClick={() => setSelectedCategory(category as keyof typeof FEATURE_CATEGORIES)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Feature Flags List */}
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {Object.keys(filteredFlags).length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {showOnlyDifferences 
                    ? 'No flags differ from defaults' 
                    : 'No flags in selected category'
                  }
                </Alert>
              ) : (
                <List dense>
                  {Object.entries(filteredFlags).map(([flagName, isEnabled]) => {
                    const isDefault = isEnabled === DEFAULT_FEATURE_FLAGS[flagName as keyof FeatureFlags];
                    
                    return (
                      <ListItem
                        key={flagName}
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: isDefault ? 'transparent' : 'action.hover'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: isDefault ? 400 : 600 }}>
                              {flagName.replace(/_/g, ' ')}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="textSecondary">
                              {flagName}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={isEnabled ? 'ON' : 'OFF'}
                            size="small"
                            color={isEnabled ? 'success' : 'default'}
                            variant={isDefault ? 'outlined' : 'filled'}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* Context Override */}
            {process.env.NODE_ENV === 'development' && (
              <Accordion variant="outlined" sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="caption">
                    Context Overrides ({Object.keys(contextOverrides).length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Development only: Override context for testing
                  </Alert>
                  {/* Add context override controls here if needed */}
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default FeatureFlagsDebug;