import type { FormField } from '../services/formFieldService';

// Common validation patterns
export const ValidationPatterns = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  SSN: /^\d{3}-\d{2}-\d{4}$/,
  DATE: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  CURRENCY: /^\$?\d+(\.\d{2})?$/,
} as const;

// Validation messages
export const ValidationMessages = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid phone number',
  ZIP_CODE: 'Please enter a valid ZIP code',
  SSN: 'Please enter a valid SSN (XXX-XX-XXXX)',
  DATE: 'Please enter a valid date (MM/DD/YYYY)',
  CURRENCY: 'Please enter a valid currency amount',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters long`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters long`,
  PATTERN: 'Invalid format',
} as const;

// Field type validation rules
export const getValidationRulesForField = (
  field: FormField
): {
  pattern?: RegExp;
  message?: string;
  minLength?: number;
  maxLength?: number;
} | null => {
  const fieldName = field.name.toLowerCase();

  // Email field detection
  if (fieldName.includes('email') || fieldName.includes('e-mail')) {
    return {
      pattern: ValidationPatterns.EMAIL,
      message: ValidationMessages.EMAIL,
    };
  }

  // Phone field detection
  if (
    fieldName.includes('phone') ||
    fieldName.includes('telephone') ||
    fieldName.includes('mobile')
  ) {
    return {
      pattern: ValidationPatterns.PHONE,
      message: ValidationMessages.PHONE,
    };
  }

  // ZIP code field detection
  if (fieldName.includes('zip') || fieldName.includes('postal')) {
    return {
      pattern: ValidationPatterns.ZIP_CODE,
      message: ValidationMessages.ZIP_CODE,
    };
  }

  // SSN field detection
  if (fieldName.includes('ssn') || fieldName.includes('social')) {
    return {
      pattern: ValidationPatterns.SSN,
      message: ValidationMessages.SSN,
    };
  }

  // Date field detection
  if (fieldName.includes('date') || fieldName.includes('birth')) {
    return {
      pattern: ValidationPatterns.DATE,
      message: ValidationMessages.DATE,
    };
  }

  // Currency field detection
  if (
    fieldName.includes('amount') ||
    fieldName.includes('price') ||
    fieldName.includes('cost') ||
    fieldName.includes('fee')
  ) {
    return {
      pattern: ValidationPatterns.CURRENCY,
      message: ValidationMessages.CURRENCY,
    };
  }

  // Use existing field validation if available
  if (field.validation) {
    return {
      pattern: field.validation.pattern,
      message: field.validation.message,
    };
  }

  return null;
};

// Enhanced validation function
export const validateFieldValue = (
  field: FormField,
  value: any
): string | null => {
  // Check if field is required and empty
  if (
    field.required &&
    (value === null || value === undefined || value === '')
  ) {
    return ValidationMessages.REQUIRED;
  }

  // Skip validation for empty optional fields
  if (
    !field.required &&
    (value === null || value === undefined || value === '')
  ) {
    return null;
  }

  // Text field specific validations
  if (field.type === 'text' && typeof value === 'string') {
    // Check max length
    if (field.maxLength && value.length > field.maxLength) {
      return ValidationMessages.MAX_LENGTH(field.maxLength);
    }

    // Get validation rules for this field
    const rules = getValidationRulesForField(field);
    if (rules?.pattern && !rules.pattern.test(value)) {
      return rules.message || ValidationMessages.PATTERN;
    }
  }

  // Dropdown validation
  if (field.type === 'dropdown' && field.options && field.options.length > 0) {
    if (!field.options.includes(String(value))) {
      return 'Please select a valid option';
    }
  }

  return null;
};

// Batch validation for multiple fields
export const validateMultipleFields = (
  fields: FormField[],
  formData: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.readOnly) continue; // Skip read-only fields

    const value = formData[field.id];
    const error = validateFieldValue(field, value);

    if (error) {
      errors[field.id] = error;
    }
  }

  return errors;
};

// Check if all required fields are completed
export const areRequiredFieldsCompleted = (
  requiredFields: FormField[],
  formData: Record<string, any>
): boolean => {
  return requiredFields.every((field) => {
    if (field.readOnly) return true; // Skip read-only fields

    const value = formData[field.id];
    return value !== null && value !== undefined && value !== '';
  });
};

// Get completion percentage
export const getCompletionPercentage = (
  requiredFields: FormField[],
  formData: Record<string, any>
): number => {
  if (requiredFields.length === 0) return 100;

  const completedFields = requiredFields.filter((field) => {
    if (field.readOnly) return true; // Count read-only as completed

    const value = formData[field.id];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
};

// Find next incomplete required field
export const findNextIncompleteField = (
  requiredFields: FormField[],
  formData: Record<string, any>
): FormField | null => {
  return (
    requiredFields.find((field) => {
      if (field.readOnly) return false; // Skip read-only fields

      const value = formData[field.id];
      return value === null || value === undefined || value === '';
    }) || null
  );
};
