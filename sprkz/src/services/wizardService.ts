import type { FormField, PageFormFields } from './formFieldService';

export interface WizardStep {
  id: string;
  fieldId: string;
  type: 'required' | 'signature' | 'optional';
  title: string;
  description: string;
  pageNumber: number;
  order: number;
}

export interface WizardFlow {
  steps: WizardStep[];
  currentStepIndex: number;
  isComplete: boolean;
}

export class WizardService {
  /**
   * Generate wizard steps from form fields
   */
  static generateWizardSteps(
    allPageFields: PageFormFields[],
    _completedFields: Set<string>
  ): WizardStep[] {
    const steps: WizardStep[] = [];
    let order = 0;

    console.log('🧙‍♂️ Generating wizard steps from pages:', allPageFields.length);

    // First pass: Add all required fields
    allPageFields.forEach((pageFields) => {
      console.log(`🔍 Checking page ${pageFields.pageNumber} with ${pageFields.fields.length} fields`);
      pageFields.fields.forEach((field) => {
        console.log(`  - Field "${field.name}": required=${field.required}, readOnly=${field.readOnly}`);
        if (field.required && !field.readOnly) {
          const step = {
            id: `step-${field.id}`,
            fieldId: field.id,
            type: 'required' as const,
            title: field.name || 'Required Field',
            description: this.getFieldDescription(field),
            pageNumber: field.pageNumber,
            order: order++,
          };
          steps.push(step);
          console.log(`  ✅ Added required step: ${step.title}`);
        }
      });
    });

    // Second pass: Add signature fields
    allPageFields.forEach((pageFields) => {
      pageFields.fields.forEach((field) => {
        if (field.type === 'signature' && !field.readOnly) {
          const step = {
            id: `step-${field.id}`,
            fieldId: field.id,
            type: 'signature' as const,
            title: field.name || 'Signature Field',
            description: 'Add your signature here',
            pageNumber: field.pageNumber,
            order: order++,
          };
          steps.push(step);
          console.log(`  ✅ Added signature step: ${step.title}`);
        }
      });
    });

    console.log(`🎯 Generated ${steps.length} wizard steps total`);
    return steps;
  }

  /**
   * Get the current wizard flow state
   */
  static getWizardFlow(
    allPageFields: PageFormFields[],
    completedFields: Set<string>,
    currentFieldId: string | null
  ): WizardFlow {
    const steps = this.generateWizardSteps(allPageFields, completedFields);
    
    // Find current step index
    let currentStepIndex = 0;
    if (currentFieldId) {
      const stepIndex = steps.findIndex(step => step.fieldId === currentFieldId);
      if (stepIndex !== -1) {
        currentStepIndex = stepIndex;
      }
    }

    // Check if wizard is complete
    const isComplete = steps.every(step => completedFields.has(step.fieldId));

    return {
      steps,
      currentStepIndex,
      isComplete,
    };
  }

  /**
   * Get the next incomplete step
   */
  static getNextIncompleteStep(
    allPageFields: PageFormFields[],
    completedFields: Set<string>
  ): WizardStep | null {
    const steps = this.generateWizardSteps(allPageFields, completedFields);
    return steps.find(step => !completedFields.has(step.fieldId)) || null;
  }

  /**
   * Get the next step after the current one
   */
  static getNextStep(
    allPageFields: PageFormFields[],
    completedFields: Set<string>,
    currentFieldId: string | null
  ): WizardStep | null {
    const flow = this.getWizardFlow(allPageFields, completedFields, currentFieldId);
    const nextIndex = flow.currentStepIndex + 1;
    
    if (nextIndex < flow.steps.length) {
      return flow.steps[nextIndex];
    }
    
    return null;
  }

  /**
   * Get the previous step
   */
  static getPreviousStep(
    allPageFields: PageFormFields[],
    completedFields: Set<string>,
    currentFieldId: string | null
  ): WizardStep | null {
    const flow = this.getWizardFlow(allPageFields, completedFields, currentFieldId);
    const prevIndex = flow.currentStepIndex - 1;
    
    if (prevIndex >= 0) {
      return flow.steps[prevIndex];
    }
    
    return null;
  }

  /**
   * Calculate wizard progress
   */
  static calculateProgress(
    allPageFields: PageFormFields[],
    completedFields: Set<string>
  ): {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    completedSteps: number;
  } {
    const steps = this.generateWizardSteps(allPageFields, completedFields);
    const completedSteps = steps.filter(step => completedFields.has(step.fieldId)).length;
    
    return {
      currentStep: completedSteps + 1,
      totalSteps: steps.length,
      percentage: steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0,
      completedSteps,
    };
  }

  /**
   * Get appropriate tooltip message for a field
   */
  static getTooltipMessage(field: FormField, stepType: 'required' | 'signature' | 'optional'): string {
    if (stepType === 'signature') {
      return 'Click to add your signature';
    }
    
    if (field.required) {
      return `Required: ${field.name || 'Fill out this field'}`;
    }
    
    return `Optional: ${field.name || 'Fill out this field'}`;
  }


  /**
   * Get a user-friendly description for a field
   */
  private static getFieldDescription(field: FormField): string {
    const typeDescriptions: Record<string, string> = {
      text: 'Enter text',
      checkbox: 'Check if applicable',
      radio: 'Select an option',
      dropdown: 'Choose from dropdown',
      signature: 'Add your signature',
    };
    
    // Check field name for more specific descriptions
    const fieldNameLower = field.name?.toLowerCase() || '';
    
    if (fieldNameLower.includes('email')) {
      return 'Enter an email address';
    }
    if (fieldNameLower.includes('phone') || fieldNameLower.includes('tel')) {
      return 'Enter a phone number';
    }
    if (fieldNameLower.includes('url') || fieldNameLower.includes('website')) {
      return 'Enter a URL';
    }
    if (fieldNameLower.includes('date')) {
      return 'Select a date';
    }
    if (field.multiLine) {
      return 'Enter detailed text';
    }
    
    return typeDescriptions[field.type] || 'Complete this field';
  }

  /**
   * Determine if wizard should automatically advance after field completion
   */
  static shouldAutoAdvance(field: FormField): boolean {
    // Auto-advance for most field types except text areas and signature fields
    const noAutoAdvanceTypes = ['textarea', 'signature'];
    return !noAutoAdvanceTypes.includes(field.type);
  }

  /**
   * Get field validation hints for wizard tooltips
   */
  static getValidationHints(field: FormField): string[] {
    const hints: string[] = [];
    
    if (field.required) {
      hints.push('This field is required');
    }
    
    // Check field name or placeholder for type hints since FormField type is limited
    const fieldNameLower = field.name?.toLowerCase() || '';
    const placeholderLower = field.placeholder?.toLowerCase() || '';
    
    if (fieldNameLower.includes('email') || placeholderLower.includes('email')) {
      hints.push('Enter a valid email address');
    }
    
    if (fieldNameLower.includes('phone') || fieldNameLower.includes('tel') || 
        placeholderLower.includes('phone') || placeholderLower.includes('tel')) {
      hints.push('Enter a valid phone number');
    }
    
    if (fieldNameLower.includes('url') || fieldNameLower.includes('website') || 
        placeholderLower.includes('url') || placeholderLower.includes('website')) {
      hints.push('Enter a valid URL starting with http:// or https://');
    }
    
    return hints;
  }
}

export default WizardService;