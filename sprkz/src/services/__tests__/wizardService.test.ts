import { WizardService, WizardStep, WizardFlow } from '../wizardService';
import type { FormField, PageFormFields } from '../formFieldService';

// Mock console.log to avoid noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('WizardService', () => {
  // Mock form fields data for testing
  const mockPageFields: PageFormFields[] = [
    {
      pageNumber: 1,
      fields: [
        {
          id: 'field1',
          name: 'First Name',
          type: 'text',
          required: true,
          readOnly: false,
          rect: [0, 0, 100, 50],
          pageNumber: 1,
          fieldType: 'Tx',
        },
        {
          id: 'field2', 
          name: 'Email',
          type: 'text',
          required: true,
          readOnly: false,
          rect: [0, 50, 100, 100],
          pageNumber: 1,
          fieldType: 'Tx',
        },
        {
          id: 'field3',
          name: 'Optional Field',
          type: 'text',
          required: false,
          readOnly: false,
          rect: [0, 100, 100, 150],
          pageNumber: 1,
          fieldType: 'Tx',
        },
        {
          id: 'field4',
          name: 'Read Only Field',
          type: 'text',
          required: true,
          readOnly: true,
          rect: [0, 150, 100, 200],
          pageNumber: 1,
          fieldType: 'Tx',
        },
      ] as FormField[],
      radioGroups: [],
    },
    {
      pageNumber: 2,
      fields: [
        {
          id: 'field5',
          name: 'Signature',
          type: 'signature',
          required: true,
          readOnly: false,
          rect: [0, 0, 200, 100],
          pageNumber: 2,
          fieldType: 'Sig',
        },
        {
          id: 'field6',
          name: 'Optional Signature',
          type: 'signature',
          required: false,
          readOnly: false,
          rect: [0, 100, 200, 200],
          pageNumber: 2,
          fieldType: 'Sig',
        },
      ] as FormField[],
      radioGroups: [],
    },
  ];

  const emptyCompletedFields = new Set<string>();
  const someCompletedFields = new Set(['field1', 'field5']);
  const allCompletedFields = new Set(['field1', 'field2', 'field5', 'field6']);

  describe('generateWizardSteps', () => {
    it('should generate steps for all required fields', () => {
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);

      expect(steps).toHaveLength(5); // field1, field2, field5 (required), then field5, field6 (signatures)
      
      // Verify required fields are included
      expect(steps.find(s => s.fieldId === 'field1')).toBeDefined();
      expect(steps.find(s => s.fieldId === 'field2')).toBeDefined();
      expect(steps.filter(s => s.fieldId === 'field5')).toHaveLength(2); // Both required and signature type
      expect(steps.find(s => s.fieldId === 'field6')).toBeDefined();
      
      // Verify required fields have correct type
      expect(steps.find(s => s.fieldId === 'field1')?.type).toBe('required');
      expect(steps.find(s => s.fieldId === 'field2')?.type).toBe('required');
      
      // Verify signature fields have signature type (includes the duplicate field5)
      const signatureSteps = steps.filter(s => s.type === 'signature');
      expect(signatureSteps).toHaveLength(2); // field5 and field6
    });

    it('should exclude read-only fields from steps', () => {
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);
      
      // field4 is required but readOnly, should not be included
      expect(steps.find(s => s.fieldId === 'field4')).toBeUndefined();
    });

    it('should handle empty form fields gracefully', () => {
      const emptyFields: PageFormFields[] = [];
      const steps = WizardService.generateWizardSteps(emptyFields, emptyCompletedFields);
      
      expect(steps).toEqual([]);
    });

    it('should prioritize signature fields correctly', () => {
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);
      
      // Required fields should come first, then signature fields
      const requiredSteps = steps.filter(s => s.type === 'required');
      const signatureSteps = steps.filter(s => s.type === 'signature');
      
      expect(requiredSteps.length).toBe(3); // field1, field2, field5 (as required)
      expect(signatureSteps.length).toBe(2); // field5, field6 (as signature)
      
      // Check order - required fields should have lower order numbers
      const maxRequiredOrder = Math.max(...requiredSteps.map(s => s.order));
      const minSignatureOrder = Math.min(...signatureSteps.map(s => s.order));
      
      expect(maxRequiredOrder).toBeLessThan(minSignatureOrder);
    });

    it('should group fields by page correctly', () => {
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);
      
      const page1Steps = steps.filter(s => s.pageNumber === 1);
      const page2Steps = steps.filter(s => s.pageNumber === 2);
      
      expect(page1Steps).toHaveLength(2); // field1, field2
      expect(page2Steps).toHaveLength(3); // field5 (required), field5 (signature), field6 (signature)
      
      // Verify page numbers are correct
      page1Steps.forEach(step => {
        expect(step.pageNumber).toBe(1);
      });
      page2Steps.forEach(step => {
        expect(step.pageNumber).toBe(2);
      });
    });

    it('should create proper step structure', () => {
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);
      const firstStep = steps[0];
      
      expect(firstStep).toMatchObject({
        id: expect.stringMatching(/^step-/),
        fieldId: expect.any(String),
        type: expect.stringMatching(/^(required|signature|optional)$/),
        title: expect.any(String),
        description: expect.any(String),
        pageNumber: expect.any(Number),
        order: expect.any(Number),
      });
    });
  });

  describe('getWizardFlow', () => {
    it('should return correct wizard flow structure', () => {
      const flow = WizardService.getWizardFlow(mockPageFields, emptyCompletedFields, null);
      
      expect(flow).toMatchObject({
        steps: expect.any(Array),
        currentStepIndex: expect.any(Number),
        isComplete: expect.any(Boolean),
      });
      
      expect(flow.steps).toHaveLength(5);
      expect(flow.currentStepIndex).toBe(0);
      expect(flow.isComplete).toBe(false);
    });

    it('should find correct current step index', () => {
      const flow = WizardService.getWizardFlow(mockPageFields, emptyCompletedFields, 'field2');
      
      expect(flow.currentStepIndex).toBe(1); // field2 should be second step
    });

    it('should handle non-existent current field', () => {
      const flow = WizardService.getWizardFlow(mockPageFields, emptyCompletedFields, 'nonexistent');
      
      expect(flow.currentStepIndex).toBe(0);
    });

    it('should detect wizard completion correctly', () => {
      const incompleteFlow = WizardService.getWizardFlow(mockPageFields, someCompletedFields, null);
      const completeFlow = WizardService.getWizardFlow(mockPageFields, allCompletedFields, null);
      
      expect(incompleteFlow.isComplete).toBe(false);
      expect(completeFlow.isComplete).toBe(true);
    });
  });

  describe('getNextIncompleteStep', () => {
    it('should return first incomplete step', () => {
      const nextStep = WizardService.getNextIncompleteStep(mockPageFields, emptyCompletedFields);
      
      expect(nextStep).not.toBeNull();
      expect(nextStep?.fieldId).toBe('field1');
    });

    it('should return correct next incomplete step after some completion', () => {
      const nextStep = WizardService.getNextIncompleteStep(mockPageFields, someCompletedFields);
      
      expect(nextStep).not.toBeNull();
      expect(nextStep?.fieldId).toBe('field2');
    });

    it('should return null when all steps are complete', () => {
      const nextStep = WizardService.getNextIncompleteStep(mockPageFields, allCompletedFields);
      
      expect(nextStep).toBeNull();
    });

    it('should handle empty fields gracefully', () => {
      const nextStep = WizardService.getNextIncompleteStep([], emptyCompletedFields);
      
      expect(nextStep).toBeNull();
    });
  });

  describe('getNextStep', () => {
    it('should return next step in sequence', () => {
      const nextStep = WizardService.getNextStep(mockPageFields, emptyCompletedFields, 'field1');
      
      expect(nextStep).not.toBeNull();
      expect(nextStep?.fieldId).toBe('field2');
    });

    it('should return null at last step', () => {
      // The last step is actually field6 (at index 4), not field5
      const steps = WizardService.generateWizardSteps(mockPageFields, emptyCompletedFields);
      const lastStep = steps[steps.length - 1];
      
      const nextStep = WizardService.getNextStep(mockPageFields, emptyCompletedFields, lastStep.fieldId);
      
      expect(nextStep).toBeNull();
    });

    it('should handle null current field', () => {
      const nextStep = WizardService.getNextStep(mockPageFields, emptyCompletedFields, null);
      
      expect(nextStep?.fieldId).toBe('field2'); // Next after index 0
    });

    it('should handle non-existent current field', () => {
      const nextStep = WizardService.getNextStep(mockPageFields, emptyCompletedFields, 'nonexistent');
      
      expect(nextStep?.fieldId).toBe('field2'); // Next after index 0
    });
  });

  describe('getPreviousStep', () => {
    it('should return previous step in sequence', () => {
      const prevStep = WizardService.getPreviousStep(mockPageFields, emptyCompletedFields, 'field2');
      
      expect(prevStep).not.toBeNull();
      expect(prevStep?.fieldId).toBe('field1');
    });

    it('should return null at first step', () => {
      const prevStep = WizardService.getPreviousStep(mockPageFields, emptyCompletedFields, 'field1');
      
      expect(prevStep).toBeNull();
    });

    it('should handle null current field', () => {
      const prevStep = WizardService.getPreviousStep(mockPageFields, emptyCompletedFields, null);
      
      expect(prevStep).toBeNull(); // Previous of index 0
    });

    it('should handle non-existent current field', () => {
      const prevStep = WizardService.getPreviousStep(mockPageFields, emptyCompletedFields, 'nonexistent');
      
      expect(prevStep).toBeNull(); // Previous of index 0
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly with no completion', () => {
      const progress = WizardService.calculateProgress(mockPageFields, emptyCompletedFields);
      
      expect(progress).toEqual({
        currentStep: 1,
        totalSteps: 5,
        percentage: 0,
        completedSteps: 0,
      });
    });

    it('should calculate progress correctly with partial completion', () => {
      const progress = WizardService.calculateProgress(mockPageFields, someCompletedFields);
      
      // someCompletedFields = ['field1', 'field5'] 
      // This should match 3 steps: field1, field5 (required), field5 (signature)
      expect(progress).toEqual({
        currentStep: 4, // completedSteps (3) + 1
        totalSteps: 5,
        percentage: 60, // Math.round((3/5) * 100)
        completedSteps: 3,
      });
    });

    it('should calculate progress correctly with full completion', () => {
      const progress = WizardService.calculateProgress(mockPageFields, allCompletedFields);
      
      // allCompletedFields = ['field1', 'field2', 'field5', 'field6']
      // All 5 steps are completed (field5 appears in both required and signature steps)
      expect(progress).toEqual({
        currentStep: 6, // completedSteps (5) + 1 
        totalSteps: 5,
        percentage: 100, // Math.round((5/5) * 100)
        completedSteps: 5,
      });
    });

    it('should handle empty fields gracefully', () => {
      const progress = WizardService.calculateProgress([], emptyCompletedFields);
      
      expect(progress).toEqual({
        currentStep: 1,
        totalSteps: 0,
        percentage: 0,
        completedSteps: 0,
      });
    });
  });

  describe('getTooltipMessage', () => {
    const mockField: FormField = {
      id: 'test',
      name: 'Test Field',
      type: 'text',
      required: true,
      readOnly: false,
      rect: [0, 0, 100, 50],
      pageNumber: 1,
      fieldType: 'Tx',
    };

    it('should return signature message for signature fields', () => {
      const message = WizardService.getTooltipMessage(mockField, 'signature');
      
      expect(message).toBe('Click to add your signature');
    });

    it('should return required message for required fields', () => {
      const message = WizardService.getTooltipMessage(mockField, 'required');
      
      expect(message).toBe('Required: Test Field');
    });

    it('should return optional message for optional fields', () => {
      const optionalField = { ...mockField, required: false };
      const message = WizardService.getTooltipMessage(optionalField, 'optional');
      
      expect(message).toBe('Optional: Test Field');
    });

    it('should handle fields without names', () => {
      const fieldWithoutName = { ...mockField, name: undefined };
      const message = WizardService.getTooltipMessage(fieldWithoutName, 'required');
      
      expect(message).toBe('Required: Fill out this field');
    });
  });

  describe('getFieldDescription', () => {
    it('should return specific description for email fields', () => {
      const emailField: FormField = {
        id: 'email',
        name: 'Email Address',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [emailField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Enter an email address');
    });

    it('should return specific description for phone fields', () => {
      const phoneField: FormField = {
        id: 'phone',
        name: 'Phone Number',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [phoneField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Enter a phone number');
    });

    it('should return specific description for URL fields', () => {
      const urlField: FormField = {
        id: 'website',
        name: 'Website URL',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [urlField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Enter a URL');
    });

    it('should return specific description for date fields', () => {
      const dateField: FormField = {
        id: 'birthdate',
        name: 'Birth Date',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [dateField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Select a date');
    });

    it('should return multiline description for multiline fields', () => {
      const multilineField: FormField = {
        id: 'comments',
        name: 'Comments',
        type: 'text',
        required: true,
        readOnly: false,
        multiLine: true,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [multilineField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Enter detailed text');
    });

    it('should return default description for unknown field types', () => {
      const unknownField: FormField = {
        id: 'unknown',
        name: 'Unknown Field',  
        type: 'unknown' as any,
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const steps = WizardService.generateWizardSteps([{
        pageNumber: 1,
        fields: [unknownField],
        radioGroups: [],
      }], emptyCompletedFields);

      expect(steps[0].description).toBe('Complete this field');
    });
  });

  describe('shouldAutoAdvance', () => {
    it('should auto-advance for text fields', () => {
      const textField: FormField = {
        id: 'text',
        name: 'Text Field',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      expect(WizardService.shouldAutoAdvance(textField)).toBe(true);
    });

    it('should not auto-advance for textarea fields', () => {
      const textareaField: FormField = {
        id: 'textarea',
        name: 'Textarea Field',
        type: 'textarea',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      expect(WizardService.shouldAutoAdvance(textareaField)).toBe(false);
    });

    it('should not auto-advance for signature fields', () => {
      const signatureField: FormField = {
        id: 'signature',
        name: 'Signature Field',
        type: 'signature',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Sig',
      };

      expect(WizardService.shouldAutoAdvance(signatureField)).toBe(false);
    });

    it('should auto-advance for checkbox fields', () => {
      const checkboxField: FormField = {
        id: 'checkbox',
        name: 'Checkbox Field',
        type: 'checkbox',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Btn',
      };

      expect(WizardService.shouldAutoAdvance(checkboxField)).toBe(true);
    });
  });

  describe('getValidationHints', () => {
    it('should include required hint for required fields', () => {
      const requiredField: FormField = {
        id: 'required',
        name: 'Required Field',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(requiredField);
      
      expect(hints).toContain('This field is required');
    });

    it('should include email hint for email fields by name', () => {
      const emailField: FormField = {
        id: 'email',
        name: 'Email Address',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(emailField);
      
      expect(hints).toContain('Enter a valid email address');
    });

    it('should include email hint for email fields by placeholder', () => {
      const emailField: FormField = {
        id: 'contact',
        name: 'Contact Info',
        placeholder: 'Enter your email',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(emailField);
      
      expect(hints).toContain('Enter a valid email address');
    });

    it('should include phone hint for phone fields', () => {
      const phoneField: FormField = {
        id: 'phone',
        name: 'Phone Number',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(phoneField);
      
      expect(hints).toContain('Enter a valid phone number');
    });

    it('should include URL hint for URL fields', () => {
      const urlField: FormField = {
        id: 'website',
        name: 'Website URL',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(urlField);
      
      expect(hints).toContain('Enter a valid URL starting with http:// or https://');
    });

    it('should handle fields without name or placeholder', () => {
      const fieldWithoutName: FormField = {
        id: 'test',
        name: undefined,
        placeholder: undefined,
        type: 'text',
        required: false,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(fieldWithoutName);
      
      expect(hints).toEqual([]);
    });

    it('should combine multiple hints correctly', () => {
      const emailField: FormField = {
        id: 'email',
        name: 'Email Address',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 0, 100, 50],
        pageNumber: 1,
        fieldType: 'Tx',
      };

      const hints = WizardService.getValidationHints(emailField);
      
      expect(hints).toContain('This field is required');
      expect(hints).toContain('Enter a valid email address');
      expect(hints).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle PDFs with no form fields', () => {
      const emptyPageFields: PageFormFields[] = [{
        pageNumber: 1,
        fields: [],
        radioGroups: [],
      }];

      const steps = WizardService.generateWizardSteps(emptyPageFields, emptyCompletedFields);
      const flow = WizardService.getWizardFlow(emptyPageFields, emptyCompletedFields, null);
      const progress = WizardService.calculateProgress(emptyPageFields, emptyCompletedFields);

      expect(steps).toEqual([]);
      expect(flow.steps).toEqual([]);
      expect(flow.isComplete).toBe(true); // No steps means complete
      expect(progress.totalSteps).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should handle corrupted field data gracefully', () => {
      const corruptedField = {
        id: null as any,
        name: undefined,
        type: undefined as any,
        required: undefined as any,
        readOnly: undefined as any,
        rect: undefined as any,
        pageNumber: undefined as any,
        fieldType: undefined as any,
      };

      const corruptedPageFields: PageFormFields[] = [{
        pageNumber: 1,
        fields: [corruptedField] as FormField[],
        radioGroups: [],
      }];

      // Should not throw error
      expect(() => {
        WizardService.generateWizardSteps(corruptedPageFields, emptyCompletedFields);
      }).not.toThrow();
    });

    it('should handle cross-page field dependencies', () => {
      const multiPageFields: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [{
            id: 'page1-field',
            name: 'Page 1 Field',
            type: 'text',
            required: true,
            readOnly: false,
            rect: [0, 0, 100, 50],
            pageNumber: 1,
            fieldType: 'Tx',
          }] as FormField[],
          radioGroups: [],
        },
        {
          pageNumber: 3, // Non-sequential page number
          fields: [{
            id: 'page3-field',
            name: 'Page 3 Field',
            type: 'text',
            required: true,
            readOnly: false,
            rect: [0, 0, 100, 50],
            pageNumber: 3,
            fieldType: 'Tx',
          }] as FormField[],
          radioGroups: [],
        },
      ];

      const steps = WizardService.generateWizardSteps(multiPageFields, emptyCompletedFields);
      
      expect(steps).toHaveLength(2);
      expect(steps[0].pageNumber).toBe(1);
      expect(steps[1].pageNumber).toBe(3);
    });

    it('should handle duplicate field names correctly', () => {
      const duplicateNameFields: PageFormFields[] = [{
        pageNumber: 1,
        fields: [
          {
            id: 'field1',
            name: 'Duplicate Name',
            type: 'text',
            required: true,
            readOnly: false,
            rect: [0, 0, 100, 50],
            pageNumber: 1,
            fieldType: 'Tx',
          },
          {
            id: 'field2',
            name: 'Duplicate Name',
            type: 'text',
            required: true,
            readOnly: false,
            rect: [0, 50, 100, 100],
            pageNumber: 1,
            fieldType: 'Tx',
          },
        ] as FormField[],
        radioGroups: [],
      }];

      const steps = WizardService.generateWizardSteps(duplicateNameFields, emptyCompletedFields);
      
      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe('Duplicate Name');
      expect(steps[1].title).toBe('Duplicate Name');
      expect(steps[0].id).not.toBe(steps[1].id); // IDs should be different
    });
  });
});