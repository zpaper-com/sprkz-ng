import { PDFService } from './pdfService';
import { FormField } from '../types/pdf';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface FormFieldExtractionOptions {
  excludeReadOnly?: boolean;
  includeSignatureFields?: boolean;
  validateFieldNames?: boolean;
}

export interface FormFieldCategory {
  required: FormField[];
  optional: FormField[];
  signature: FormField[];
  readOnly: FormField[];
}

export class FormFieldService {
  private static extractedFields: Map<string, FormField[]> = new Map();

  /**
   * Extract all form fields from a PDF document
   */
  static async extractAllFormFields(
    pdfDoc: PDFDocumentProxy, 
    options: FormFieldExtractionOptions = {}
  ): Promise<FormField[]> {
    const {
      excludeReadOnly = false,
      includeSignatureFields = true,
      validateFieldNames = true
    } = options;

    const documentId = pdfDoc.fingerprints[0];
    
    // Check cache first
    if (this.extractedFields.has(documentId)) {
      let fields = this.extractedFields.get(documentId)!;
      
      // Apply filters
      if (excludeReadOnly) {
        fields = fields.filter(field => !field.readOnly);
      }
      
      return fields;
    }

    const allFields: FormField[] = [];
    const fieldNameCounts = new Map<string, number>();

    try {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await PDFService.getPage(pdfDoc, pageNum);
        const pageFields = await PDFService.extractFormFields(page);
        
        // Process and enhance each field
        const processedFields = pageFields.map((field: any) => {
          let fieldName = field.name;
          
          // Handle duplicate field names by adding suffix
          if (validateFieldNames && fieldNameCounts.has(fieldName)) {
            const count = fieldNameCounts.get(fieldName)! + 1;
            fieldNameCounts.set(fieldName, count);
            fieldName = `${fieldName}_${count}`;
          } else {
            fieldNameCounts.set(fieldName, 1);
          }

          // Determine field type based on annotation properties
          const fieldType = this.determineFieldType(field);
          
          // Enhanced form field object
          const enhancedField: FormField = {
            name: fieldName,
            type: fieldType,
            value: this.getInitialValue(field, fieldType),
            required: this.isFieldRequired(field),
            readOnly: field.readOnly || false,
            page: pageNum,
            rect: field.rect,
            isComplete: false,
            validationErrors: [],
            options: field.options || undefined,
            multiline: field.multiline || false,
            maxLength: field.maxLength || undefined,
            pattern: this.getValidationPattern(field, fieldType),
            id: field.id,
            subtype: field.subtype
          };

          return enhancedField;
        });

        allFields.push(...processedFields);
      }

      // Cache the results
      this.extractedFields.set(documentId, allFields);

      console.log(`Extracted ${allFields.length} form fields from ${pdfDoc.numPages} pages`);

      // Apply final filters
      let filteredFields = allFields;
      if (excludeReadOnly) {
        filteredFields = filteredFields.filter(field => !field.readOnly);
      }

      return filteredFields;
    } catch (error) {
      console.error('Error extracting form fields:', error);
      throw error;
    }
  }

  /**
   * Categorize form fields by type and requirements
   */
  static categorizeFields(fields: FormField[]): FormFieldCategory {
    const categories: FormFieldCategory = {
      required: [],
      optional: [],
      signature: [],
      readOnly: []
    };

    fields.forEach(field => {
      if (field.readOnly) {
        categories.readOnly.push(field);
      } else if (field.type === 'signature') {
        categories.signature.push(field);
      } else if (field.required) {
        categories.required.push(field);
      } else {
        categories.optional.push(field);
      }
    });

    console.log('Field categorization:', {
      required: categories.required.length,
      optional: categories.optional.length,
      signature: categories.signature.length,
      readOnly: categories.readOnly.length
    });

    return categories;
  }

  /**
   * Get fields that still need completion
   */
  static getIncompleteFields(fields: FormField[]): FormField[] {
    return fields.filter(field => !field.isComplete && !field.readOnly);
  }

  /**
   * Get required fields that still need completion
   */
  static getIncompleteRequiredFields(fields: FormField[]): FormField[] {
    return fields.filter(field => field.required && !field.isComplete && !field.readOnly);
  }

  /**
   * Get signature fields
   */
  static getSignatureFields(fields: FormField[]): FormField[] {
    return fields.filter(field => 
      field.type === 'signature' || 
      field.name.toLowerCase().includes('signature') ||
      field.name.toLowerCase().includes('sign')
    );
  }

  /**
   * Calculate form completion percentage
   */
  static calculateCompletionPercentage(fields: FormField[]): number {
    const requiredFields = fields.filter(field => field.required && !field.readOnly);
    if (requiredFields.length === 0) return 100;
    
    const completedFields = requiredFields.filter(field => field.isComplete);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Validate field value based on field type and constraints
   */
  static validateFieldValue(field: FormField, value: any): string[] {
    const errors: string[] = [];

    // Required field validation
    if (field.required && !field.readOnly) {
      if (value === undefined || value === null || value === '') {
        errors.push('This field is required');
      }
    }

    // Skip further validation if empty and not required
    if (!value && !field.required) {
      return errors;
    }

    // Type-specific validation
    switch (field.type) {
      case 'text':
        if (typeof value !== 'string') {
          errors.push('Value must be text');
          break;
        }
        
        if (field.maxLength && value.length > field.maxLength) {
          errors.push(`Text must be ${field.maxLength} characters or less`);
        }
        
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors.push('Invalid format');
          }
        }
        break;

      case 'checkbox':
        if (typeof value !== 'boolean') {
          errors.push('Value must be true or false');
        }
        break;

      case 'radio':
      case 'dropdown':
        if (field.options && !field.options.includes(value)) {
          errors.push('Invalid selection');
        }
        break;

      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push('Invalid date format');
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Update field completion status
   */
  static updateFieldCompletion(field: FormField, value: any): FormField {
    const errors = this.validateFieldValue(field, value);
    const isComplete = errors.length === 0 && this.hasValidValue(field, value);

    return {
      ...field,
      value,
      isComplete,
      validationErrors: errors
    };
  }

  /**
   * Private helper methods
   */
  private static determineFieldType(field: any): FormField['type'] {
    // Check field name for signature indicators
    const fieldName = (field.name || '').toLowerCase();
    if (fieldName.includes('signature') || fieldName.includes('sign')) {
      return 'signature';
    }

    // Check annotation subtype and fieldType
    switch (field.type || field.fieldType) {
      case 'Tx': // Text field
        return 'text';
      case 'Btn': // Button field (could be checkbox or radio)
        if (field.checkBox || field.radioButton === false) {
          return 'checkbox';
        } else {
          return 'radio';
        }
      case 'Ch': // Choice field (dropdown or listbox)
        return 'dropdown';
      case 'Sig': // Signature field
        return 'signature';
      default:
        // Fallback based on field properties
        if (field.options && Array.isArray(field.options)) {
          return 'dropdown';
        }
        if (field.checkBox !== undefined) {
          return 'checkbox';
        }
        return 'text';
    }
  }

  private static getInitialValue(field: any, fieldType: FormField['type']): any {
    const existingValue = field.value || field.fieldValue;
    
    if (existingValue !== undefined && existingValue !== null) {
      return existingValue;
    }

    // Default values based on field type
    switch (fieldType) {
      case 'checkbox':
        return false;
      case 'radio':
      case 'dropdown':
        return field.options?.[0] || '';
      default:
        return '';
    }
  }

  private static isFieldRequired(field: any): boolean {
    // Explicit required flag
    if (field.required === true) return true;
    if (field.required === false) return false;

    // Check field flags (PDF specification)
    if (field.fieldFlags !== undefined) {
      const REQUIRED_FLAG = 1 << 1; // Bit 2 in field flags
      return (field.fieldFlags & REQUIRED_FLAG) !== 0;
    }

    // Heuristic: fields marked with asterisk or "required" in name
    const fieldName = (field.name || '').toLowerCase();
    return fieldName.includes('required') || fieldName.includes('*');
  }

  private static getValidationPattern(field: any, fieldType: FormField['type']): string | undefined {
    // Return existing pattern if available
    if (field.pattern) return field.pattern;

    // Common validation patterns based on field name
    const fieldName = (field.name || '').toLowerCase();
    
    if (fieldName.includes('email')) {
      return '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
    }
    
    if (fieldName.includes('phone') || fieldName.includes('tel')) {
      return '^[\\d\\s\\-\\(\\)\\+]{10,}$';
    }
    
    if (fieldName.includes('zip') || fieldName.includes('postal')) {
      return '^\\d{5}(-\\d{4})?$';
    }

    if (fieldName.includes('date')) {
      return '^\\d{1,2}/\\d{1,2}/\\d{4}$|^\\d{4}-\\d{2}-\\d{2}$';
    }

    return undefined;
  }

  private static hasValidValue(field: FormField, value: any): boolean {
    if (value === undefined || value === null) return false;
    
    switch (field.type) {
      case 'text':
        return typeof value === 'string' && value.trim().length > 0;
      case 'checkbox':
        return typeof value === 'boolean';
      case 'radio':
      case 'dropdown':
        return typeof value === 'string' && value.length > 0;
      case 'signature':
        return typeof value === 'string' && value.length > 0;
      default:
        return true;
    }
  }

  /**
   * Clear cached form fields
   */
  static clearCache(documentId?: string): void {
    if (documentId) {
      this.extractedFields.delete(documentId);
    } else {
      this.extractedFields.clear();
    }
  }
}