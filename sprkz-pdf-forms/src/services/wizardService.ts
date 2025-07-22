import { FormField } from '../types/pdf';

export interface FieldCategories {
  required: FormField[];
  optional: FormField[];
  signature: FormField[];
  readOnly: FormField[];
}

export interface NavigationTarget {
  field: FormField;
  action: 'focus' | 'scroll' | 'highlight';
  page?: number;
}

export class WizardService {
  /**
   * Categorize form fields by type and requirement
   */
  static categorizeFields(fields: FormField[]): FieldCategories {
    const categories: FieldCategories = {
      required: [],
      optional: [],
      signature: [],
      readOnly: []
    };

    fields.forEach(field => {
      if (field.readOnly) {
        categories.readOnly.push(field);
      } else if (field.type === 'signature' || 
                 field.name.toLowerCase().includes('signature') ||
                 field.name.toLowerCase().includes('sign')) {
        categories.signature.push(field);
      } else if (field.required) {
        categories.required.push(field);
      } else {
        categories.optional.push(field);
      }
    });

    return categories;
  }

  /**
   * Get the next field that needs completion
   */
  static getNextField(fields: FormField[], completedFields: string[]): FormField | null {
    // First, check required fields
    const incompleteRequired = fields.filter(field => 
      field.required && 
      !field.readOnly && 
      !completedFields.includes(field.name)
    );

    if (incompleteRequired.length > 0) {
      // Sort by page number and field position
      return this.sortFieldsByPosition(incompleteRequired)[0];
    }

    // Then check signature fields
    const incompleteSignatures = fields.filter(field => 
      (field.type === 'signature' || 
       field.name.toLowerCase().includes('signature')) &&
      !completedFields.includes(field.name)
    );

    if (incompleteSignatures.length > 0) {
      return this.sortFieldsByPosition(incompleteSignatures)[0];
    }

    // All required and signature fields complete
    return null;
  }

  /**
   * Get all incomplete required fields in order
   */
  static getIncompleteRequiredFields(fields: FormField[], completedFields: string[]): FormField[] {
    const incomplete = fields.filter(field => 
      field.required && 
      !field.readOnly && 
      !completedFields.includes(field.name)
    );

    return this.sortFieldsByPosition(incomplete);
  }

  /**
   * Get all incomplete signature fields in order
   */
  static getIncompleteSignatureFields(fields: FormField[], completedFields: string[]): FormField[] {
    const incomplete = fields.filter(field => 
      (field.type === 'signature' || 
       field.name.toLowerCase().includes('signature') ||
       field.name.toLowerCase().includes('sign')) &&
      !completedFields.includes(field.name)
    );

    return this.sortFieldsByPosition(incomplete);
  }

  /**
   * Sort fields by page number and vertical position
   */
  static sortFieldsByPosition(fields: FormField[]): FormField[] {
    return fields.sort((a, b) => {
      // First sort by page
      if (a.page !== b.page) {
        return a.page - b.page;
      }

      // Then sort by vertical position (top to bottom)
      // rect format: [x1, y1, x2, y2] where y1 is bottom, y2 is top in PDF coordinates
      const aTop = Math.max(a.rect[1], a.rect[3]);
      const bTop = Math.max(b.rect[1], b.rect[3]);
      
      // Higher Y value = higher on page in PDF coordinates
      if (Math.abs(aTop - bTop) > 10) { // 10px threshold for same "row"
        return bTop - aTop; // Reverse for top-to-bottom order
      }

      // If on same row, sort by horizontal position (left to right)
      const aLeft = Math.min(a.rect[0], a.rect[2]);
      const bLeft = Math.min(b.rect[0], b.rect[2]);
      return aLeft - bLeft;
    });
  }

  /**
   * Calculate form completion percentage
   */
  static calculateProgress(fields: FormField[], completedFields: string[]): {
    percentage: number;
    completed: number;
    total: number;
    requiredCompleted: number;
    requiredTotal: number;
  } {
    const requiredFields = fields.filter(field => field.required && !field.readOnly);
    const completedRequired = requiredFields.filter(field => completedFields.includes(field.name));
    const totalCompleted = fields.filter(field => completedFields.includes(field.name));

    return {
      percentage: requiredFields.length > 0 ? Math.round((completedRequired.length / requiredFields.length) * 100) : 100,
      completed: totalCompleted.length,
      total: fields.length,
      requiredCompleted: completedRequired.length,
      requiredTotal: requiredFields.length
    };
  }

  /**
   * Determine wizard state based on current progress
   */
  static determineWizardState(fields: FormField[], completedFields: string[]): {
    state: 'start' | 'next' | 'sign' | 'submit' | 'complete';
    nextAction: string;
    canProgress: boolean;
  } {
    const categories = this.categorizeFields(fields);
    const incompleteRequired = this.getIncompleteRequiredFields(fields, completedFields);
    const incompleteSignatures = this.getIncompleteSignatureFields(fields, completedFields);

    // No fields to complete
    if (categories.required.length === 0 && categories.signature.length === 0) {
      return {
        state: 'complete',
        nextAction: 'No fields require completion',
        canProgress: false
      };
    }

    // Haven't started yet
    if (completedFields.length === 0) {
      return {
        state: 'start',
        nextAction: `Begin form completion (${categories.required.length} required fields)`,
        canProgress: true
      };
    }

    // Still have required fields to complete
    if (incompleteRequired.length > 0) {
      const nextField = incompleteRequired[0];
      return {
        state: 'next',
        nextAction: `Complete "${nextField.name}" on page ${nextField.page}`,
        canProgress: true
      };
    }

    // Required fields complete, check signatures
    if (incompleteSignatures.length > 0) {
      const nextSignature = incompleteSignatures[0];
      return {
        state: 'sign',
        nextAction: `Sign "${nextSignature.name}" on page ${nextSignature.page}`,
        canProgress: true
      };
    }

    // All required and signature fields complete
    const allRequiredComplete = categories.required.every(field => completedFields.includes(field.name));
    const allSignaturesComplete = categories.signature.every(field => completedFields.includes(field.name));

    if (allRequiredComplete && allSignaturesComplete) {
      return {
        state: 'submit',
        nextAction: 'Submit completed form',
        canProgress: true
      };
    }

    return {
      state: 'complete',
      nextAction: 'Form processing complete',
      canProgress: false
    };
  }

  /**
   * Find field by name
   */
  static findFieldByName(fields: FormField[], fieldName: string): FormField | null {
    return fields.find(field => field.name === fieldName) || null;
  }

  /**
   * Get fields on a specific page
   */
  static getFieldsOnPage(fields: FormField[], pageNumber: number): FormField[] {
    return fields.filter(field => field.page === pageNumber);
  }

  /**
   * Get field navigation target for scrolling/focusing
   */
  static getNavigationTarget(field: FormField): NavigationTarget {
    return {
      field,
      action: field.type === 'signature' ? 'highlight' : 'focus',
      page: field.page
    };
  }

  /**
   * Validate field completion readiness
   */
  static canMarkFieldComplete(field: FormField, value: any): boolean {
    if (field.readOnly) return true;

    switch (field.type) {
      case 'text':
      case 'date':
        return typeof value === 'string' && value.trim().length > 0;
      
      case 'checkbox':
        return typeof value === 'boolean';
      
      case 'radio':
      case 'dropdown':
        return typeof value === 'string' && value.length > 0;
      
      case 'signature':
        return typeof value === 'string' && value.length > 0;
      
      default:
        return value !== null && value !== undefined && value !== '';
    }
  }

  /**
   * Get field priority for wizard navigation
   */
  static getFieldPriority(field: FormField): number {
    let priority = 0;

    // Required fields have higher priority
    if (field.required) priority += 100;

    // Signature fields have medium priority
    if (field.type === 'signature') priority += 50;

    // Fields with validation errors have higher priority
    if (field.validationErrors.length > 0) priority += 25;

    // Incomplete fields have higher priority
    if (!field.isComplete) priority += 10;

    return priority;
  }

  /**
   * Get wizard guidance message
   */
  static getGuidanceMessage(fields: FormField[], completedFields: string[]): string {
    const progress = this.calculateProgress(fields, completedFields);
    const wizardState = this.determineWizardState(fields, completedFields);

    if (progress.requiredTotal === 0) {
      return "This PDF doesn't contain any required form fields.";
    }

    switch (wizardState.state) {
      case 'start':
        return `Ready to begin! This form has ${progress.requiredTotal} required field${progress.requiredTotal === 1 ? '' : 's'} to complete.`;
      
      case 'next':
        const remaining = progress.requiredTotal - progress.requiredCompleted;
        return `${progress.requiredCompleted} of ${progress.requiredTotal} required fields completed. ${remaining} remaining.`;
      
      case 'sign':
        const categories = this.categorizeFields(fields);
        const signatureCount = categories.signature.length;
        const completedSignatures = categories.signature.filter(f => completedFields.includes(f.name)).length;
        return `Required fields complete! Now sign ${signatureCount - completedSignatures} signature field${signatureCount - completedSignatures === 1 ? '' : 's'}.`;
      
      case 'submit':
        return `All required fields and signatures complete! Ready to submit.`;
      
      case 'complete':
        return `Form completed successfully!`;
      
      default:
        return `Form progress: ${progress.percentage}% complete.`;
    }
  }
}