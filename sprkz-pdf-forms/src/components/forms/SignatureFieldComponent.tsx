import React, { useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  Alert
} from '@mui/material';
import { Edit, Clear } from '@mui/icons-material';
import { FormFieldWrapper, BaseFormFieldProps } from './BaseFormField';

export const SignatureFieldComponent: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  // Handle signature creation (placeholder - will be enhanced in Phase 5)
  const handleCreateSignature = useCallback(() => {
    // TODO: Open signature modal in Phase 5
    console.log('Opening signature modal for field:', field.name);
    onFocus?.();
    
    // For now, simulate signature creation
    const mockSignature = `signature_${field.name}_${Date.now()}`;
    onChange(mockSignature);
  }, [field.name, onChange, onFocus]);

  // Handle signature clear
  const handleClearSignature = useCallback(() => {
    onChange('');
    onBlur?.();
  }, [onChange, onBlur]);

  // Check if signature exists
  const hasSignature = value && typeof value === 'string' && value.length > 0;

  return (
    <FormFieldWrapper 
      field={field}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      autoFocus={autoFocus}
      className={className}
    >
      <Box sx={{ width: '100%' }}>
        {/* Signature preview area */}
        <Paper 
          variant="outlined"
          sx={{
            minHeight: 120,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: field.readOnly ? 'action.disabledBackground' : 'background.paper',
            border: field.validationErrors.length > 0 ? '1px solid' : undefined,
            borderColor: field.validationErrors.length > 0 ? 'error.main' : undefined,
            cursor: disabled || field.readOnly ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: disabled || field.readOnly 
                ? 'action.disabledBackground' 
                : 'action.hover'
            }
          }}
          onClick={!disabled && !field.readOnly ? handleCreateSignature : undefined}
        >
          {hasSignature ? (
            <Box textAlign="center">
              <Typography variant="body2" color="success.main" gutterBottom>
                ✓ Signature Captured
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Click to update signature
              </Typography>
            </Box>
          ) : (
            <Box textAlign="center">
              <Edit sx={{ fontSize: 32, color: 'action.disabled', mb: 1 }} />
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {disabled || field.readOnly ? 'Signature required' : 'Click to add signature'}
              </Typography>
              {field.required && (
                <Typography variant="caption" color="error.main">
                  Required field
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* Action buttons */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleCreateSignature}
            disabled={disabled || field.readOnly}
            size="small"
            autoFocus={autoFocus}
          >
            {hasSignature ? 'Update Signature' : 'Add Signature'}
          </Button>
          
          {hasSignature && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={handleClearSignature}
              disabled={disabled || field.readOnly}
              size="small"
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Phase 5 notice */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Full signature functionality will be implemented in Phase 5. 
            Currently showing placeholder interface.
          </Typography>
        </Alert>
      </Box>
    </FormFieldWrapper>
  );
};