import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  useTheme
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Edit,
  ExpandMore,
  ExpandLess,
  Assignment,
  Verified
} from '@mui/icons-material';
import { useWizard } from '../../contexts/WizardContext';
import { useForm } from '../../contexts/FormContext';

export interface ProgressTrackerProps {
  compact?: boolean;
  showFieldList?: boolean;
  showStats?: boolean;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  compact = false,
  showFieldList = false,
  showStats = true,
  className
}) => {
  const theme = useTheme();
  const wizard = useWizard();
  const form = useForm();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Get progress color
  const getProgressColor = () => {
    const percentage = wizard.state.completionPercentage;
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'primary';
  };

  // Get field status icon
  const getFieldStatusIcon = (fieldName: string, isSignature: boolean = false) => {
    const isComplete = wizard.state.completedFields.includes(fieldName);
    
    if (isComplete) {
      return <CheckCircle color="success" fontSize="small" />;
    }
    
    if (isSignature) {
      return <Edit color="info" fontSize="small" />;
    }
    
    return <RadioButtonUnchecked color="action" fontSize="small" />;
  };

  // Get field display name
  const getFieldDisplayName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Count field types
  const fieldStats = {
    totalRequired: wizard.state.requiredFields.length,
    totalSignatures: wizard.state.signatureFields.length,
    completedRequired: wizard.state.requiredFields.filter(f => 
      wizard.state.completedFields.includes(f.name)
    ).length,
    completedSignatures: wizard.state.signatureFields.filter(f => 
      wizard.state.completedFields.includes(f.name)
    ).length
  };

  if (compact) {
    return (
      <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LinearProgress
          variant="determinate"
          value={wizard.state.completionPercentage}
          color={getProgressColor()}
          sx={{ flex: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="textSecondary" sx={{ minWidth: 40 }}>
          {wizard.state.completionPercentage}%
        </Typography>
      </Box>
    );
  }

  return (
    <Paper className={className} elevation={2} sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment color="primary" />
          Form Progress
        </Typography>
        
        {showFieldList && (
          <IconButton onClick={handleExpandClick} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            Overall Progress
          </Typography>
          <Typography variant="body2" fontWeight="bold" color={`${getProgressColor()}.main`}>
            {wizard.state.completionPercentage}%
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={wizard.state.completionPercentage}
          color={getProgressColor()}
          sx={{ 
            height: 12, 
            borderRadius: 6,
            '& .MuiLinearProgress-bar': {
              borderRadius: 6
            }
          }}
        />
      </Box>

      {/* Statistics */}
      {showStats && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Chip
              icon={<Assignment />}
              label={`${fieldStats.completedRequired}/${fieldStats.totalRequired} Required`}
              size="small"
              color={fieldStats.completedRequired === fieldStats.totalRequired ? 'success' : 'default'}
              variant={fieldStats.completedRequired === fieldStats.totalRequired ? 'filled' : 'outlined'}
            />
            
            {fieldStats.totalSignatures > 0 && (
              <Chip
                icon={<Verified />}
                label={`${fieldStats.completedSignatures}/${fieldStats.totalSignatures} Signatures`}
                size="small"
                color={fieldStats.completedSignatures === fieldStats.totalSignatures ? 'success' : 'info'}
                variant={fieldStats.completedSignatures === fieldStats.totalSignatures ? 'filled' : 'outlined'}
              />
            )}
          </Box>

          {/* Detailed stats */}
          <Typography variant="caption" color="textSecondary" display="block">
            {wizard.state.completedFields.length} of {wizard.state.totalRequiredFields + fieldStats.totalSignatures} fields completed
          </Typography>
        </Box>
      )}

      {/* Current field indicator */}
      {wizard.state.currentField && (
        <Box sx={{ mb: 2 }}>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Current Field
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getFieldStatusIcon(
              wizard.state.currentField.name, 
              wizard.state.currentField.type === 'signature'
            )}
            <Typography variant="body2">
              {getFieldDisplayName(wizard.state.currentField.name)}
            </Typography>
            <Chip 
              label={`Page ${wizard.state.currentField.page}`} 
              size="small" 
              variant="outlined"
            />
          </Box>
        </Box>
      )}

      {/* Field list */}
      {showFieldList && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ mb: 2 }} />
          
          {/* Required fields */}
          {wizard.state.requiredFields.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Required Fields ({fieldStats.completedRequired}/{fieldStats.totalRequired})
              </Typography>
              <List dense sx={{ py: 0 }}>
                {wizard.state.requiredFields.map((field) => (
                  <ListItem 
                    key={field.name} 
                    sx={{ py: 0.5, px: 0, cursor: !wizard.state.completedFields.includes(field.name) ? 'pointer' : 'default' }}
                    onClick={!wizard.state.completedFields.includes(field.name) ? 
                      () => wizard.jumpToField(field) : undefined}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getFieldStatusIcon(field.name)}
                    </ListItemIcon>
                    <ListItemText
                      primary={getFieldDisplayName(field.name)}
                      secondary={`Page ${field.page}`}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          textDecoration: wizard.state.completedFields.includes(field.name) ? 
                            'line-through' : 'none',
                          color: wizard.state.completedFields.includes(field.name) ? 
                            'text.secondary' : 'text.primary'
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Signature fields */}
          {wizard.state.signatureFields.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Signature Fields ({fieldStats.completedSignatures}/{fieldStats.totalSignatures})
              </Typography>
              <List dense sx={{ py: 0 }}>
                {wizard.state.signatureFields.map((field) => (
                  <ListItem 
                    key={field.name} 
                    sx={{ py: 0.5, px: 0, cursor: !wizard.state.completedFields.includes(field.name) ? 'pointer' : 'default' }}
                    onClick={!wizard.state.completedFields.includes(field.name) ? 
                      () => wizard.jumpToField(field) : undefined}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getFieldStatusIcon(field.name, true)}
                    </ListItemIcon>
                    <ListItemText
                      primary={getFieldDisplayName(field.name)}
                      secondary={`Page ${field.page}`}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          textDecoration: wizard.state.completedFields.includes(field.name) ? 
                            'line-through' : 'none',
                          color: wizard.state.completedFields.includes(field.name) ? 
                            'text.secondary' : 'text.primary'
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Collapse>
      )}
    </Paper>
  );
};