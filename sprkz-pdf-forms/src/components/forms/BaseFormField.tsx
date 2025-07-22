import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { FormField } from '../../types/pdf';

export interface BaseFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export interface FormFieldWrapperProps extends BaseFormFieldProps {
  children: React.ReactNode;
  showErrors?: boolean;
  showRequiredIndicator?: boolean;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  field,
  children,
  showErrors = true,
  showRequiredIndicator = true,
  className
}) => {
  return (
    <Box className={className} sx={{ mb: 2 }}>
      {/* Field label */}
      {field.name && (
        <Typography 
          variant="caption" 
          component="label"
          sx={{ 
            display: 'block', 
            mb: 0.5, 
            fontWeight: field.required ? 600 : 400,
            color: field.validationErrors.length > 0 ? 'error.main' : 'text.secondary'
          }}
        >
          {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {showRequiredIndicator && field.required && !field.readOnly && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
      )}

      {/* Form control */}
      <Box sx={{ position: 'relative' }}>
        {children}
      </Box>

      {/* Validation errors */}
      {showErrors && field.validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 1, py: 0.5 }}>
          {field.validationErrors.map((error, index) => (
            <Typography key={index} variant="caption" display="block">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Field hints */}
      {field.maxLength && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
          Maximum {field.maxLength} characters
        </Typography>
      )}
    </Box>
  );
};

// Base form field component for common functionality
export const BaseFormField: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
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
      <Typography variant="body2" color="textSecondary">
        Unsupported field type: {field.type}
      </Typography>
    </FormFieldWrapper>
  );
};