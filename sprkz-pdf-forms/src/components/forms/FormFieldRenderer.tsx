import React from 'react';
import { FormField } from '../../types/pdf';
import { BaseFormField, BaseFormFieldProps } from './BaseFormField';
import { TextFieldComponent } from './TextFieldComponent';
import { CheckboxFieldComponent } from './CheckboxFieldComponent';
import { RadioFieldComponent } from './RadioFieldComponent';
import { DropdownFieldComponent } from './DropdownFieldComponent';
import { SignatureFieldComponent } from './SignatureFieldComponent';

export interface FormFieldRendererProps extends Omit<BaseFormFieldProps, 'field'> {
  field: FormField;
}

/**
 * Central component for rendering different types of form fields
 * Routes to appropriate field component based on field type
 */
export const FormFieldRenderer: React.FC<FormFieldRendererProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  autoFocus = false,
  className
}) => {
  const commonProps: BaseFormFieldProps = {
    field,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    autoFocus,
    className
  };

  // Route to appropriate field component based on type
  switch (field.type) {
    case 'text':
    case 'date':
      return <TextFieldComponent {...commonProps} />;
    
    case 'checkbox':
      return <CheckboxFieldComponent {...commonProps} />;
    
    case 'radio':
      return <RadioFieldComponent {...commonProps} />;
    
    case 'dropdown':
      return <DropdownFieldComponent {...commonProps} />;
    
    case 'signature':
      return <SignatureFieldComponent {...commonProps} />;
    
    case 'unknown':
    default:
      // Fallback to base component with unsupported message
      return <BaseFormField {...commonProps} />;
  }
};