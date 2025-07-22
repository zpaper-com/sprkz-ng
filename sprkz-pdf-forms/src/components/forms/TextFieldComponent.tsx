import React, { useCallback, useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Clear } from '@mui/icons-material';
import { FormFieldWrapper, BaseFormFieldProps } from './BaseFormField';

export const TextFieldComponent: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');

  // Sync internal value with prop value
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Determine if this is a password field
  const isPasswordField = field.name.toLowerCase().includes('password');

  // Determine input type
  const getInputType = useCallback(() => {
    const fieldName = field.name.toLowerCase();
    
    if (isPasswordField) {
      return showPassword ? 'text' : 'password';
    }
    
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('tel') || fieldName.includes('phone')) return 'tel';
    if (fieldName.includes('url') || fieldName.includes('website')) return 'url';
    if (fieldName.includes('number') || fieldName.includes('age')) return 'number';
    
    return 'text';
  }, [field.name, isPasswordField, showPassword]);

  // Handle value change
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Toggle password visibility
  const handleTogglePassword = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  // Clear field
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange('');
  }, [onChange]);

  // Get placeholder text
  const getPlaceholder = useCallback(() => {
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('email')) return 'Enter your email address';
    if (fieldName.includes('name')) return 'Enter your name';
    if (fieldName.includes('phone') || fieldName.includes('tel')) return 'Enter phone number';
    if (fieldName.includes('address')) return 'Enter address';
    if (fieldName.includes('city')) return 'Enter city';
    if (fieldName.includes('state')) return 'Enter state';
    if (fieldName.includes('zip') || fieldName.includes('postal')) return 'Enter ZIP code';
    if (fieldName.includes('date')) return 'MM/DD/YYYY';
    
    return `Enter ${field.name.replace(/_/g, ' ').toLowerCase()}`;
  }, [field.name]);

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
      <TextField
        fullWidth
        size="small"
        type={getInputType()}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled || field.readOnly}
        autoFocus={autoFocus}
        placeholder={getPlaceholder()}
        multiline={field.multiline}
        rows={field.multiline ? 3 : 1}
        inputProps={{
          maxLength: field.maxLength,
          pattern: field.pattern,
          'aria-label': field.name
        } as any}
        error={field.validationErrors.length > 0}
        helperText={
          field.validationErrors.length > 0 
            ? field.validationErrors[0] 
            : field.maxLength && internalValue.length > 0 
              ? `${internalValue.length}/${field.maxLength} characters`
              : undefined
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {/* Clear button for non-empty fields */}
              {internalValue && !disabled && !field.readOnly && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                  aria-label="clear field"
                  sx={{ mr: isPasswordField ? 0 : -0.5 }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              )}
              
              {/* Password visibility toggle */}
              {isPasswordField && (
                <IconButton
                  size="small"
                  onClick={handleTogglePassword}
                  edge="end"
                  aria-label={showPassword ? 'hide password' : 'show password'}
                  sx={{ ml: 0.5 }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: field.readOnly ? 'action.disabledBackground' : 'background.paper',
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
            },
          },
        }}
      />
    </FormFieldWrapper>
  );
};