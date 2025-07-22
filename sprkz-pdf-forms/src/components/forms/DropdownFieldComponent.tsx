import React, { useCallback, useState, useEffect } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  InputLabel,
  Chip,
  Box,
  Typography
} from '@mui/material';
import { KeyboardArrowDown, Check } from '@mui/icons-material';
import { FormFieldWrapper, BaseFormFieldProps } from './BaseFormField';

export const DropdownFieldComponent: React.FC<BaseFormFieldProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  const [selectedValue, setSelectedValue] = useState<string | string[]>('');
  const [open, setOpen] = useState(false);

  // Determine if this is a multi-select dropdown
  const isMultiSelect = Array.isArray(value) || field.name.toLowerCase().includes('multiple');

  // Sync internal state with prop value
  useEffect(() => {
    if (isMultiSelect) {
      setSelectedValue(Array.isArray(value) ? value : []);
    } else {
      setSelectedValue(value || '');
    }
  }, [value, isMultiSelect]);

  // Get options from field definition or generate default options
  const getOptions = useCallback((): string[] => {
    if (field.options && field.options.length > 0) {
      return field.options;
    }

    // Generate common options based on field name
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('state') || fieldName.includes('province')) {
      return [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
        'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
        'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
        'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming'
      ];
    }
    
    if (fieldName.includes('country')) {
      return [
        'United States', 'Canada', 'United Kingdom', 'Australia',
        'Germany', 'France', 'Japan', 'Brazil', 'India', 'China'
      ];
    }
    
    if (fieldName.includes('title') || fieldName.includes('prefix')) {
      return ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
    }
    
    if (fieldName.includes('suffix')) {
      return ['Jr.', 'Sr.', 'II', 'III', 'IV'];
    }
    
    if (fieldName.includes('gender') || fieldName.includes('sex')) {
      return ['Male', 'Female', 'Other', 'Prefer not to say'];
    }
    
    if (fieldName.includes('marital') || fieldName.includes('status')) {
      return ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
    }
    
    if (fieldName.includes('education')) {
      return [
        'High School', 'Some College', 'Associate Degree',
        'Bachelor Degree', 'Master Degree', 'Doctoral Degree'
      ];
    }
    
    if (fieldName.includes('employment') || fieldName.includes('occupation')) {
      return [
        'Full-time', 'Part-time', 'Self-employed', 'Unemployed',
        'Student', 'Retired'
      ];
    }
    
    // Default options
    return ['Option 1', 'Option 2', 'Option 3'];
  }, [field.options, field.name]);

  const options = getOptions();

  // Handle selection change
  const handleChange = useCallback((event: any) => {
    const newValue = event.target.value;
    setSelectedValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Handle dropdown open
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  // Handle dropdown close
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Get display label for the field
  const getFieldLabel = useCallback(() => {
    return field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [field.name]);

  // Custom render for selected values (multi-select)
  const renderValue = useCallback((selected: any) => {
    if (!isMultiSelect) {
      return selected;
    }

    const selectedArray = Array.isArray(selected) ? selected : [];
    if (selectedArray.length === 0) {
      return <Typography color="textSecondary">Select options...</Typography>;
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {selectedArray.map((value) => (
          <Chip key={value} label={value} size="small" />
        ))}
      </Box>
    );
  }, [isMultiSelect]);

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
      <FormControl 
        fullWidth 
        size="small"
        error={field.validationErrors.length > 0}
        disabled={disabled || field.readOnly}
      >
        <InputLabel id={`${field.name}-label`} shrink={true}>
          {getFieldLabel()}
          {field.required && !field.readOnly && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </InputLabel>
        
        <Select
          labelId={`${field.name}-label`}
          value={selectedValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onOpen={handleOpen}
          onClose={handleClose}
          open={open}
          multiple={isMultiSelect}
          renderValue={renderValue}
          displayEmpty
          autoFocus={autoFocus}
          IconComponent={KeyboardArrowDown}
          inputProps={{
            'aria-label': field.name
          } as any}
          sx={{
            backgroundColor: field.readOnly ? 'action.disabledBackground' : 'background.paper',
            '& .MuiSelect-select': {
              minHeight: '20px',
            }
          }}
        >
          {/* Empty/placeholder option for single select */}
          {!isMultiSelect && (
            <MenuItem value="">
              <Typography color="textSecondary">
                Select {getFieldLabel().toLowerCase()}...
              </Typography>
            </MenuItem>
          )}
          
          {/* Options */}
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {isMultiSelect && (
                <Check 
                  sx={{ 
                    visibility: Array.isArray(selectedValue) && selectedValue.includes(option) 
                      ? 'visible' 
                      : 'hidden',
                    mr: 1
                  }} 
                />
              )}
              <Typography>{option}</Typography>
            </MenuItem>
          ))}
        </Select>
        
        {/* Helper text */}
        {field.validationErrors.length > 0 ? (
          <FormHelperText>
            {field.validationErrors[0]}
          </FormHelperText>
        ) : isMultiSelect ? (
          <FormHelperText>
            Select one or more options
          </FormHelperText>
        ) : (
          <FormHelperText>
            Select an option from the list
          </FormHelperText>
        )}
      </FormControl>
    </FormFieldWrapper>
  );
};