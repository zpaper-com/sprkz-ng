import React, { useCallback, useState, useEffect } from 'react';
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Box,
  Typography
} from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, IndeterminateCheckBox } from '@mui/icons-material';
import { FormFieldWrapper, BaseFormFieldProps } from './BaseFormField';

export const CheckboxFieldComponent: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  const [checked, setChecked] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);

  // Sync internal state with prop value
  useEffect(() => {
    if (typeof value === 'boolean') {
      setChecked(value);
      setIndeterminate(false);
    } else if (value === null || value === undefined) {
      setChecked(false);
      setIndeterminate(true);
    } else {
      // Handle string values that might represent boolean state
      const stringValue = String(value).toLowerCase();
      if (stringValue === 'true' || stringValue === '1' || stringValue === 'yes' || stringValue === 'on') {
        setChecked(true);
        setIndeterminate(false);
      } else if (stringValue === 'false' || stringValue === '0' || stringValue === 'no' || stringValue === 'off') {
        setChecked(false);
        setIndeterminate(false);
      } else {
        setChecked(false);
        setIndeterminate(true);
      }
    }
  }, [value]);

  // Handle checkbox change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setChecked(newChecked);
    setIndeterminate(false);
    onChange(newChecked);
  }, [onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Get checkbox label
  const getCheckboxLabel = useCallback(() => {
    // If the field has a descriptive name, use it
    let label = field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Remove common checkbox prefixes
    label = label.replace(/^(Check|Checkbox|Select|Choose)\s*/i, '');
    
    // Add contextual labels for common checkbox types
    const fieldName = field.name.toLowerCase();
    if (fieldName.includes('agree') || fieldName.includes('terms')) {
      return `I agree to ${label.toLowerCase()}`;
    }
    if (fieldName.includes('confirm') || fieldName.includes('verify')) {
      return `I confirm ${label.toLowerCase()}`;
    }
    if (fieldName.includes('subscribe') || fieldName.includes('newsletter')) {
      return `Subscribe to ${label.toLowerCase()}`;
    }
    if (fieldName.includes('consent') || fieldName.includes('permission')) {
      return `I consent to ${label.toLowerCase()}`;
    }
    
    return label;
  }, [field.name]);

  // Custom checkbox icons based on state
  const getCheckboxIcon = () => {
    if (indeterminate) {
      return <IndeterminateCheckBox />;
    }
    return checked ? <CheckBox /> : <CheckBoxOutlineBlank />;
  };

  return (
    <Box className={className} sx={{ mb: 2 }}>
      <FormControl
        error={field.validationErrors.length > 0}
        disabled={disabled || field.readOnly}
        component="fieldset"
        sx={{ width: '100%' }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              indeterminate={indeterminate}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled || field.readOnly}
              autoFocus={autoFocus}
              icon={<CheckBoxOutlineBlank />}
              checkedIcon={<CheckBox />}
              indeterminateIcon={<IndeterminateCheckBox />}
              inputProps={{
                'aria-label': field.name
              } as any}
              sx={{
                color: field.validationErrors.length > 0 ? 'error.main' : undefined,
                '&.Mui-checked': {
                  color: field.validationErrors.length > 0 ? 'error.main' : 'primary.main'
                },
                '&.MuiCheckbox-indeterminate': {
                  color: 'warning.main'
                }
              }}
            />
          }
          label={
            <Box>
              <Typography 
                variant="body2" 
                component="span"
                sx={{ 
                  fontWeight: field.required ? 500 : 400,
                  color: field.validationErrors.length > 0 ? 'error.main' : 'text.primary'
                }}
              >
                {getCheckboxLabel()}
                {field.required && !field.readOnly && (
                  <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                    *
                  </Typography>
                )}
              </Typography>
              
              {/* Additional information or description */}
              {field.name.toLowerCase().includes('terms') && (
                <Typography variant="caption" color="textSecondary" display="block">
                  Please read and accept the terms and conditions
                </Typography>
              )}
              
              {field.name.toLowerCase().includes('newsletter') && (
                <Typography variant="caption" color="textSecondary" display="block">
                  You can unsubscribe at any time
                </Typography>
              )}
            </Box>
          }
          sx={{
            alignItems: 'flex-start',
            ml: 0,
            mr: 0,
            width: '100%',
            '& .MuiFormControlLabel-label': {
              ml: 1
            }
          }}
        />
        
        {/* Validation errors */}
        {field.validationErrors.length > 0 && (
          <FormHelperText sx={{ mt: 1, ml: 0 }}>
            {field.validationErrors.map((error, index) => (
              <Typography key={index} variant="caption" display="block" color="error">
                {error}
              </Typography>
            ))}
          </FormHelperText>
        )}
        
        {/* Status indicator */}
        <Box sx={{ ml: 4, mt: 0.5 }}>
          {checked && (
            <Typography variant="caption" color="success.main">
              ✓ Checked
            </Typography>
          )}
          {indeterminate && (
            <Typography variant="caption" color="warning.main">
              ⚠ Indeterminate state
            </Typography>
          )}
          {!checked && !indeterminate && field.required && (
            <Typography variant="caption" color="text.secondary">
              Required
            </Typography>
          )}
        </Box>
      </FormControl>
    </Box>
  );
};