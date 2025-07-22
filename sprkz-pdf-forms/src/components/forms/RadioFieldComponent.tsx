import React, { useCallback, useState, useEffect } from 'react';
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  FormHelperText,
  Box,
  Typography
} from '@mui/material';
import { RadioButtonUnchecked, RadioButtonChecked } from '@mui/icons-material';
import { FormFieldWrapper, BaseFormFieldProps } from './BaseFormField';

export const RadioFieldComponent: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Sync internal state with prop value
  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  // Get options from field definition or generate default options
  const getOptions = useCallback((): string[] => {
    if (field.options && field.options.length > 0) {
      return field.options;
    }

    // Generate common options based on field name
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('gender') || fieldName.includes('sex')) {
      return ['Male', 'Female', 'Other'];
    }
    
    if (fieldName.includes('marital')) {
      return ['Single', 'Married', 'Divorced', 'Widowed'];
    }
    
    if (fieldName.includes('yes') || fieldName.includes('no') || fieldName.includes('agree')) {
      return ['Yes', 'No'];
    }
    
    if (fieldName.includes('rating') || fieldName.includes('satisfaction')) {
      return ['Excellent', 'Good', 'Fair', 'Poor'];
    }
    
    if (fieldName.includes('frequency') || fieldName.includes('often')) {
      return ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
    }
    
    if (fieldName.includes('priority') || fieldName.includes('importance')) {
      return ['Low', 'Medium', 'High', 'Critical'];
    }
    
    if (fieldName.includes('size')) {
      return ['Small', 'Medium', 'Large', 'Extra Large'];
    }
    
    if (fieldName.includes('experience') || fieldName.includes('skill')) {
      return ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    }
    
    // Default yes/no options
    return ['Option A', 'Option B', 'Option C'];
  }, [field.options, field.name]);

  const options = getOptions();

  // Handle selection change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Handle focus (applied to the first radio button)
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Get display label for the field
  const getFieldLabel = useCallback(() => {
    let label = field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Remove redundant radio/choice prefixes
    label = label.replace(/^(Radio|Choice|Select|Choose)\s*/i, '');
    
    return label;
  }, [field.name]);

  // Get layout orientation based on options count and field type
  const getOrientation = useCallback((): 'row' | 'column' => {
    // Use row layout for yes/no, boolean-like options
    if (options.length <= 2) return 'row';
    
    // Use row layout for short options
    if (options.length <= 4 && options.every(opt => opt.length <= 10)) {
      return 'row';
    }
    
    // Use column layout for longer lists or longer option text
    return 'column';
  }, [options]);

  const orientation = getOrientation();

  return (
    <Box className={className} sx={{ mb: 2 }}>
      <FormControl
        component="fieldset"
        error={field.validationErrors.length > 0}
        disabled={disabled || field.readOnly}
        sx={{ width: '100%' }}
      >
        <FormLabel 
          component="legend"
          sx={{ 
            mb: 1,
            fontSize: '0.75rem',
            fontWeight: field.required ? 600 : 400,
            color: field.validationErrors.length > 0 ? 'error.main' : 'text.secondary',
            '&.Mui-focused': {
              color: field.validationErrors.length > 0 ? 'error.main' : 'primary.main'
            }
          }}
        >
          {getFieldLabel()}
          {field.required && !field.readOnly && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </FormLabel>
        
        <RadioGroup
          value={selectedValue}
          onChange={handleChange}
          row={orientation === 'row'}
          sx={{
            gap: orientation === 'row' ? 2 : 0.5,
            '& .MuiFormControlLabel-root': {
              mr: orientation === 'row' ? 0 : 0,
              ml: 0
            }
          }}
        >
          {options.map((option, index) => (
            <FormControlLabel
              key={option}
              value={option}
              control={
                <Radio
                  onFocus={index === 0 ? handleFocus : undefined}
                  onBlur={handleBlur}
                  autoFocus={index === 0 && autoFocus}
                  disabled={disabled || field.readOnly}
                  icon={<RadioButtonUnchecked />}
                  checkedIcon={<RadioButtonChecked />}
                  inputProps={{
                    'aria-label': `${field.name} ${option}`
                  } as any}
                  size="small"
                  sx={{
                    color: field.validationErrors.length > 0 ? 'error.main' : undefined,
                    '&.Mui-checked': {
                      color: field.validationErrors.length > 0 ? 'error.main' : 'primary.main'
                    }
                  }}
                />
              }
              label={
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: field.validationErrors.length > 0 ? 'error.main' : 'text.primary',
                    fontSize: '0.875rem'
                  }}
                >
                  {option}
                </Typography>
              }
              sx={{
                '& .MuiFormControlLabel-label': {
                  ml: 0.5
                }
              }}
            />
          ))}
        </RadioGroup>
        
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
        
        {/* Selected value indicator */}
        {selectedValue && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="success.main">
              Selected: {selectedValue}
            </Typography>
          </Box>
        )}
        
        {/* Requirement indicator */}
        {!selectedValue && field.required && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Please select an option
            </Typography>
          </Box>
        )}
      </FormControl>
    </Box>
  );
};