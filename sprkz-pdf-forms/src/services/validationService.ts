import * as Sentry from '@sentry/react';
import type { FormField } from '../types/pdf';

export interface ValidationRule {
  type: 'required' | 'format' | 'length' | 'custom' | 'dependency';
  message: string;
  params?: any;
  validator?: (value: any, field: FormField, allFields: FormField[]) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldName: string;
  validatedAt: number;
}

export interface ValidationOptions {
  validateRequired?: boolean;
  validateFormat?: boolean;
  validateDependencies?: boolean;
  excludeReadOnly?: boolean;
  performanceMode?: boolean; // Skip expensive validations
}

export class ValidationService {
  private static validationCache = new Map<string, ValidationResult>();
  private static performanceTarget = 10; // milliseconds per field

  /**
   * Validation rules for different field types
   */
  private static readonly FIELD_VALIDATION_RULES: Record<string, ValidationRule[]> = {
    text: [
      {
        type: 'required',
        message: 'This field is required',
      },
      {
        type: 'length',
        message: 'Text is too long',
        params: { max: 1000 }
      }
    ],
    
    email: [
      {
        type: 'required',
        message: 'Email address is required',
      },
      {
        type: 'format',
        message: 'Please enter a valid email address',
        params: { 
          pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        }
      }
    ],
    
    phone: [
      {
        type: 'required',
        message: 'Phone number is required',
      },
      {
        type: 'format',
        message: 'Please enter a valid phone number',
        params: { 
          pattern: /^[\+]?[1-9][\d]{0,15}$/
        }
      }
    ],
    
    date: [
      {
        type: 'required',
        message: 'Date is required',
      },
      {
        type: 'format',
        message: 'Please enter a valid date',
        params: { 
          pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/
        }
      },
      {
        type: 'custom',
        message: 'Date cannot be in the future',
        validator: (value: any) => {
          if (!value) return true;
          const date = new Date(String(value));
          return !isNaN(date.getTime()) && date <= new Date();
        }
      }
    ],
    
    number: [
      {
        type: 'format',
        message: 'Please enter a valid number',
        params: { 
          pattern: /^-?\d+(\.\d+)?$/
        }
      }
    ],
    
    checkbox: [
      {
        type: 'custom',
        message: 'This checkbox must be checked',
        validator: (value: any) => {
          return value === true || value === 'true' || value === 'on';
        }
      }
    ],
    
    radio: [
      {
        type: 'required',
        message: 'Please select an option',
      }
    ],
    
    dropdown: [
      {
        type: 'required',
        message: 'Please select an option',
      }
    ],
    
    signature: [
      {
        type: 'required',
        message: 'Signature is required',
      },
      {
        type: 'custom',
        message: 'Please provide a valid signature',
        validator: (value: any) => {
          return Boolean(value && typeof value === 'string' && value.startsWith('data:image/') && value.length > 100);
        }
      }
    ]
  };

  /**
   * Validate a single form field
   */
  static async validateField(
    field: FormField,
    value: any,
    allFields: FormField[] = [],
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    
    try {
      const {
        validateRequired = true,
        validateFormat = true,
        validateDependencies = true,
        excludeReadOnly = true,
        performanceMode = false
      } = options;

      // Create cache key
      const cacheKey = `${field.name}_${JSON.stringify(value)}_${field.type}`;
      
      // Check cache in performance mode
      if (performanceMode && this.validationCache.has(cacheKey)) {
        const cached = this.validationCache.get(cacheKey)!;
        // Use cached result if less than 1 minute old
        if (Date.now() - cached.validatedAt < 60000) {
          return cached;
        }
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Skip validation for read-only fields if requested
      if (excludeReadOnly && field.readOnly) {
        const result: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          fieldName: field.name,
          validatedAt: Date.now()
        };
        return result;
      }

      // Get validation rules for field type
      const fieldType = this.getFieldValidationType(field);
      const rules = this.FIELD_VALIDATION_RULES[fieldType] || [];

      // Apply validation rules
      for (const rule of rules) {
        // Skip certain validations based on options
        if (!validateRequired && rule.type === 'required') continue;
        if (!validateFormat && rule.type === 'format') continue;
        if (!validateDependencies && rule.type === 'dependency') continue;

        const ruleValid = await this.applyValidationRule(rule, value, field, allFields);
        if (!ruleValid) {
          if (rule.type === 'required' && !field.required) {
            warnings.push(rule.message);
          } else {
            errors.push(rule.message);
          }
        }
      }

      // Additional field-specific validations
      if (validateDependencies) {
        const dependencyErrors = await this.validateFieldDependencies(field, value, allFields);
        errors.push(...dependencyErrors);
      }

      // Custom business logic validations
      const customErrors = await this.validateCustomBusinessRules(field, value, allFields);
      errors.push(...customErrors);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        fieldName: field.name,
        validatedAt: Date.now()
      };

      // Cache result
      this.validationCache.set(cacheKey, result);

      // Performance monitoring
      const duration = performance.now() - startTime;
      if (duration > this.performanceTarget) {
        console.warn(`Validation for field "${field.name}" took ${duration.toFixed(2)}ms (target: ${this.performanceTarget}ms)`);
        
        // Report to Sentry if performance is very poor
        if (duration > this.performanceTarget * 3) {
          Sentry.addBreadcrumb({
            message: 'Slow field validation detected',
            data: {
              fieldName: field.name,
              fieldType: field.type,
              duration: duration,
              target: this.performanceTarget
            },
            level: 'warning'
          });
        }
      }

      return result;

    } catch (error) {
      console.error(`Validation error for field "${field.name}":`, error);
      
      Sentry.captureException(error, {
        tags: {
          component: 'ValidationService',
          fieldName: field.name,
          fieldType: field.type
        }
      });

      return {
        isValid: false,
        errors: ['An error occurred while validating this field'],
        warnings: [],
        fieldName: field.name,
        validatedAt: Date.now()
      };
    }
  }

  /**
   * Validate multiple fields
   */
  static async validateFields(
    fields: FormField[],
    values: Record<string, any>,
    options: ValidationOptions = {}
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};
    
    // Validate fields in parallel for better performance
    const validationPromises = fields.map(async (field) => {
      const value = values[field.name];
      const result = await this.validateField(field, value, fields, options);
      results[field.name] = result;
    });

    await Promise.all(validationPromises);
    return results;
  }

  /**
   * Validate all required fields are completed
   */
  static validateRequiredFieldsCompletion(
    fields: FormField[],
    values: Record<string, any>
  ): { isComplete: boolean; missingFields: string[]; completionPercentage: number } {
    const requiredFields = fields.filter(field => 
      field.required && !field.readOnly
    );
    
    const missingFields: string[] = [];
    let completedCount = 0;

    for (const field of requiredFields) {
      const value = values[field.name];
      const hasValue = this.hasValidValue(field, value);
      
      if (hasValue) {
        completedCount++;
      } else {
        missingFields.push(field.name);
      }
    }

    const completionPercentage = requiredFields.length > 0 
      ? Math.round((completedCount / requiredFields.length) * 100)
      : 100;

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage
    };
  }

  /**
   * Apply a single validation rule
   */
  private static async applyValidationRule(
    rule: ValidationRule,
    value: any,
    field: FormField,
    allFields: FormField[]
  ): Promise<boolean> {
    switch (rule.type) {
      case 'required':
        return this.hasValidValue(field, value);

      case 'format':
        if (!value) return true; // Format validation only applies to non-empty values
        const pattern = rule.params?.pattern;
        if (pattern instanceof RegExp) {
          return pattern.test(String(value));
        }
        return true;

      case 'length':
        if (!value) return true;
        const str = String(value);
        const { min, max } = rule.params || {};
        
        if (min !== undefined && str.length < min) return false;
        if (max !== undefined && str.length > max) return false;
        return true;

      case 'custom':
        if (rule.validator) {
          return rule.validator(value, field, allFields);
        }
        return true;

      case 'dependency':
        return this.validateFieldDependencies(field, value, allFields).then(errors => errors.length === 0);

      default:
        return true;
    }
  }

  /**
   * Check if field has a valid value
   */
  private static hasValidValue(field: FormField, value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    switch (field.type) {
      case 'checkbox':
        return value === true || value === 'true' || value === 'on';
      
      case 'signature':
        return typeof value === 'string' && value.startsWith('data:image/') && value.length > 100;
      
      case 'radio':
      case 'dropdown':
        return value !== null && value !== undefined && value !== '';
      
      default:
        return String(value).trim().length > 0;
    }
  }

  /**
   * Get validation type based on field properties
   */
  private static getFieldValidationType(field: FormField): string {
    // Check field name patterns for common types
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone') || fieldName.includes('tel')) return 'phone';
    if (fieldName.includes('date')) return 'date';
    if (fieldName.includes('number') || fieldName.includes('amount')) return 'number';
    
    // Use field type
    return field.type || 'text';
  }

  /**
   * Validate field dependencies
   */
  private static async validateFieldDependencies(
    field: FormField,
    value: any,
    allFields: FormField[]
  ): Promise<string[]> {
    const errors: string[] = [];

    // Example dependency validation logic
    // This can be extended based on specific business requirements
    
    // Check for conditional required fields
    // Example: If field A is filled, then field B becomes required
    const fieldName = field.name.toLowerCase();
    
    if (fieldName.includes('spouse') && fieldName.includes('name')) {
      // If marital status is married, spouse name is required
      const maritalField = allFields.find(f => 
        f.name.toLowerCase().includes('marital') || f.name.toLowerCase().includes('status')
      );
      
      if (maritalField) {
        const maritalValue = String(value || '').toLowerCase();
        if ((maritalValue.includes('married') || maritalValue.includes('spouse')) && !value) {
          errors.push('Spouse name is required when married');
        }
      }
    }

    return errors;
  }

  /**
   * Custom business rule validation
   */
  private static async validateCustomBusinessRules(
    field: FormField,
    value: any,
    allFields: FormField[]
  ): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Age validation example
      if (field.name.toLowerCase().includes('age') && value) {
        const age = parseInt(String(value), 10);
        if (!isNaN(age)) {
          if (age < 0 || age > 150) {
            errors.push('Please enter a valid age');
          }
          if (age < 18) {
            errors.push('Must be 18 or older');
          }
        }
      }

      // Date range validation example
      if (field.name.toLowerCase().includes('start') && field.name.toLowerCase().includes('date')) {
        const endDateField = allFields.find(f => 
          f.name.toLowerCase().includes('end') && f.name.toLowerCase().includes('date')
        );
        
        if (endDateField && value) {
          const startDate = new Date(value);
          // This would need the end date value from the form state
          // For now, just validate the start date is not in the far future
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          
          if (startDate > oneYearFromNow) {
            errors.push('Start date cannot be more than one year in the future');
          }
        }
      }

    } catch (error) {
      console.warn(`Error in custom business rule validation for field "${field.name}":`, error);
    }

    return errors;
  }

  /**
   * Clear validation cache
   */
  static clearValidationCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get validation cache statistics
   */
  static getValidationCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.validationCache.size,
      entries: Array.from(this.validationCache.keys())
    };
  }

  /**
   * Validate form submission readiness
   */
  static async validateFormSubmission(
    fields: FormField[],
    values: Record<string, any>
  ): Promise<{
    canSubmit: boolean;
    errors: Record<string, string[]>;
    warnings: Record<string, string[]>;
    summary: {
      totalFields: number;
      validFields: number;
      invalidFields: number;
      requiredFields: number;
      completedRequiredFields: number;
    }
  }> {
    const validationResults = await this.validateFields(fields, values, {
      validateRequired: true,
      validateFormat: true,
      validateDependencies: true,
      excludeReadOnly: true
    });

    const requiredCompletion = this.validateRequiredFieldsCompletion(fields, values);
    
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};
    
    let validFields = 0;
    let invalidFields = 0;

    Object.entries(validationResults).forEach(([fieldName, result]) => {
      if (result.errors.length > 0) {
        errors[fieldName] = result.errors;
        invalidFields++;
      } else {
        validFields++;
      }
      
      if (result.warnings.length > 0) {
        warnings[fieldName] = result.warnings;
      }
    });

    const requiredFields = fields.filter(f => f.required && !f.readOnly);

    return {
      canSubmit: requiredCompletion.isComplete && invalidFields === 0,
      errors,
      warnings,
      summary: {
        totalFields: fields.length,
        validFields,
        invalidFields,
        requiredFields: requiredFields.length,
        completedRequiredFields: requiredFields.length - requiredCompletion.missingFields.length
      }
    };
  }
}