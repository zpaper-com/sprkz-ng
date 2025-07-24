import React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { FormProvider, useForm } from '../FormContext';
import type {
  PageFormFields,
  FormField,
} from '../../services/formFieldService';

// Mock form field service
jest.mock('../../services/formFieldService', () => ({
  formFieldService: {
    getRequiredFields: jest.fn(),
    findFieldById: jest.fn(),
    getFieldsByType: jest.fn(),
    validateFormData: jest.fn(),
    validateField: jest.fn(),
  },
}));

const { formFieldService } = jest.requireMock(
  '../../services/formFieldService'
);

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  onSubmit?: (data: any) => Promise<void>;
}> = ({ children, onSubmit }) => (
  <FormProvider onSubmit={onSubmit}>{children}</FormProvider>
);

// Mock form fields data
const mockFormFields: PageFormFields[] = [
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
      },
      {
        id: 'field2',
        name: 'Email',
        type: 'text',
        required: true,
        readOnly: false,
        rect: [0, 50, 100, 100],
        pageNumber: 1,
      },
      {
        id: 'field3',
        name: 'Optional Field',
        type: 'text',
        required: false,
        readOnly: false,
        rect: [0, 100, 100, 150],
        pageNumber: 1,
      },
    ] as FormField[],
    radioGroups: [],
  },
  {
    pageNumber: 2,
    fields: [
      {
        id: 'signature1',
        name: 'Signature',
        type: 'signature',
        required: true,
        readOnly: false,
        rect: [0, 0, 200, 100],
        pageNumber: 2,
      },
    ] as FormField[],
    radioGroups: [],
  },
];

const mockRequiredFields = [
  mockFormFields[0].fields[0], // field1
  mockFormFields[0].fields[1], // field2 (email)
  mockFormFields[1].fields[0], // signature1
];

describe('FormContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formFieldService.getRequiredFields.mockReturnValue(mockRequiredFields);
    formFieldService.findFieldById.mockImplementation(
      (allFields: PageFormFields[], fieldId: string) => {
        for (const pageFields of allFields) {
          const field = pageFields.fields.find((f) => f.id === fieldId);
          if (field) return field;
        }
        return null;
      }
    );
    formFieldService.getFieldsByType.mockImplementation(
      (allFields: PageFormFields[], type: string) => {
        const result: FormField[] = [];
        for (const pageFields of allFields) {
          result.push(...pageFields.fields.filter((f) => f.type === type));
        }
        return result;
      }
    );
    formFieldService.validateFormData.mockReturnValue({
      isValid: true,
      errors: [],
      missingRequired: [],
    });
    formFieldService.validateField.mockReturnValue([]);
  });

  test('should throw error when useForm is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      renderHook(() => useForm());
    }).toThrow('useForm must be used within a FormProvider');

    consoleError.mockRestore();
  });

  test('should provide initial form state', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    expect(result.current.state.allPageFields).toEqual([]);
    expect(result.current.state.formData).toEqual({});
    expect(result.current.state.currentFieldId).toBeNull();
    expect(result.current.state.currentPageNumber).toBe(1);
    expect(result.current.state.completedFields.size).toBe(0);
    expect(result.current.state.isSubmitting).toBe(false);
    expect(result.current.state.isSubmitted).toBe(false);
  });

  test('should set form fields and required fields', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    expect(result.current.state.allPageFields).toEqual(mockFormFields);
    expect(result.current.state.requiredFields).toEqual(mockRequiredFields);
    expect(formFieldService.getRequiredFields).toHaveBeenCalledWith(
      mockFormFields
    );
  });

  test('should set and get field values', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
      result.current.setFieldValue('field1', 'John Doe');
    });

    expect(result.current.getFieldValue('field1')).toBe('John Doe');
    expect(result.current.state.formData.field1).toBe('John Doe');
    expect(result.current.state.completedFields.has('field1')).toBe(true);
  });

  test('should clear validation errors when field value changes', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    // Set initial validation error
    act(() => {
      result.current.state.validationErrors['field1'] = 'Error message';
    });

    // Change field value should clear error
    act(() => {
      result.current.setFieldValue('field1', 'New value');
    });

    expect(result.current.state.validationErrors.field1).toBeUndefined();
  });

  test('should track field completion', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    // Initially no fields completed
    expect(result.current.isFieldCompleted('field1')).toBe(false);

    // Mark field as completed
    act(() => {
      result.current.markFieldCompleted('field1');
    });

    expect(result.current.isFieldCompleted('field1')).toBe(true);

    // Mark field as incomplete
    act(() => {
      result.current.markFieldIncomplete('field1');
    });

    expect(result.current.isFieldCompleted('field1')).toBe(false);
  });

  test('should set current field and page', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setCurrentField('field1');
      result.current.setCurrentPage(2);
    });

    expect(result.current.state.currentFieldId).toBe('field1');
    expect(result.current.state.currentPageNumber).toBe(2);
  });

  test('should calculate form progress', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    // Initially no progress
    let progress = result.current.getFormProgress();
    expect(progress.completed).toBe(0);
    expect(progress.total).toBe(3);
    expect(progress.percentage).toBe(0);

    // Complete some fields
    act(() => {
      result.current.setFieldValue('field1', 'John');
      result.current.setFieldValue('field2', 'john@example.com');
    });

    progress = result.current.getFormProgress();
    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.percentage).toBe(67);
  });

  test('should find next required field', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    // First required field should be field1
    let nextField = result.current.getNextRequiredField();
    expect(nextField?.id).toBe('field1');

    // Complete field1, next should be field2
    act(() => {
      result.current.setFieldValue('field1', 'John');
    });

    nextField = result.current.getNextRequiredField();
    expect(nextField?.id).toBe('field2');

    // Complete field2, next should be signature1
    act(() => {
      result.current.setFieldValue('field2', 'john@example.com');
    });

    nextField = result.current.getNextRequiredField();
    expect(nextField?.id).toBe('signature1');
  });

  test('should get signature fields', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    const signatureFields = result.current.getSignatureFields();
    expect(signatureFields).toHaveLength(1);
    expect(signatureFields[0].id).toBe('signature1');
  });

  test('should check if form has required fields', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    // No fields initially
    expect(result.current.hasRequiredFields()).toBe(false);

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    expect(result.current.hasRequiredFields()).toBe(true);
  });

  test('should check if form has signature fields', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    expect(result.current.hasSignatureFields()).toBe(true);
  });

  test('should check if required fields are completed', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    // Initially not completed
    expect(result.current.areRequiredFieldsCompleted()).toBe(false);

    // Complete all required fields
    act(() => {
      result.current.setFieldValue('field1', 'John');
      result.current.setFieldValue('field2', 'john@example.com');
      result.current.setFieldValue('signature1', 'signature data');
    });

    expect(result.current.areRequiredFieldsCompleted()).toBe(true);
  });

  test('should validate form', () => {
    const mockValidationResult = {
      isValid: false,
      errors: [{ fieldId: 'field2', message: 'Invalid email' }],
      missingRequired: ['field1'],
    };

    formFieldService.validateFormData.mockReturnValue(mockValidationResult);

    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    let validationResult: any;
    act(() => {
      validationResult = result.current.validateForm();
    });

    expect(validationResult).toEqual(mockValidationResult);
    expect(result.current.state.validationResult).toEqual(mockValidationResult);
    expect(result.current.state.validationErrors).toEqual({
      field2: 'Invalid email',
      field1: 'First Name is required',
    });
  });

  test('should validate individual field', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
      result.current.setFieldValue('field2', 'invalid-email');
    });

    const error = result.current.validateField('field2');
    expect(error).toBe('Please enter a valid email address');
  });

  test('should clear validation errors', () => {
    const mockValidationResult = {
      isValid: false,
      errors: [{ fieldId: 'field1', message: 'Error' }],
      missingRequired: [],
    };
    formFieldService.validateFormData.mockReturnValue(mockValidationResult);

    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    // First set some validation errors by calling validateForm
    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    act(() => {
      result.current.validateForm();
    });

    // Verify errors are set
    expect(result.current.state.validationErrors).toEqual({ field1: 'Error' });

    // Now clear them
    act(() => {
      result.current.clearValidationErrors();
    });

    expect(result.current.state.validationErrors).toEqual({});
    expect(result.current.state.validationResult).toEqual({
      isValid: true,
      errors: [],
      missingRequired: [],
    });
  });

  test('should submit form successfully', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useForm(), {
      wrapper: ({ children }) => (
        <TestWrapper onSubmit={mockOnSubmit}>{children}</TestWrapper>
      ),
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
      result.current.setFieldValue('field1', 'John');
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({ field1: 'John' });
    expect(result.current.state.isSubmitted).toBe(true);
    expect(result.current.state.submissionError).toBeNull();
  });

  test('should handle form submission error', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Submission failed'));

    const { result } = renderHook(() => useForm(), {
      wrapper: ({ children }) => (
        <TestWrapper onSubmit={mockOnSubmit}>{children}</TestWrapper>
      ),
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(result.current.state.isSubmitted).toBe(false);
    expect(result.current.state.submissionError).toBe('Submission failed');
  });

  test('should handle submission validation failure', async () => {
    formFieldService.validateFormData.mockReturnValue({
      isValid: false,
      errors: [],
      missingRequired: ['field1'],
    });

    const mockOnSubmit = jest.fn();

    const { result } = renderHook(() => useForm(), {
      wrapper: ({ children }) => (
        <TestWrapper onSubmit={mockOnSubmit}>{children}</TestWrapper>
      ),
    });

    act(() => {
      result.current.setFormFields(mockFormFields);
    });

    await act(async () => {
      await result.current.submitForm();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(result.current.state.submissionError).toBe(
      'Form validation failed. Please correct the errors and try again.'
    );
  });

  test('should reset form', () => {
    const { result } = renderHook(() => useForm(), {
      wrapper: TestWrapper,
    });

    // Set some data
    act(() => {
      result.current.setFormFields(mockFormFields);
      result.current.setFieldValue('field1', 'John');
      result.current.setCurrentField('field1');
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.state.formData).toEqual({});
    expect(result.current.state.currentFieldId).toBeNull();
    expect(result.current.state.completedFields.size).toBe(0);
    expect(result.current.state.isSubmitted).toBe(false);
    expect(result.current.state.submissionError).toBeNull();

    // But should keep field definitions
    expect(result.current.state.allPageFields).toEqual(mockFormFields);
    expect(result.current.state.requiredFields).toEqual(mockRequiredFields);
  });
});
