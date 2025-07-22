import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { FormField, FormState, FormFieldValue } from '../types/pdf';
import { FormFieldService } from '../services/formFieldService';
import { ValidationService, ValidationResult } from '../services/validationService';

// Form Actions
type FormAction = 
  | { type: 'INITIALIZE_FIELDS'; payload: FormField[] }
  | { type: 'UPDATE_FIELD_VALUE'; payload: { fieldName: string; value: any; page: number } }
  | { type: 'SET_CURRENT_FIELD'; payload: number }
  | { type: 'MARK_FIELD_COMPLETE'; payload: string }
  | { type: 'SET_FIELD_ERRORS'; payload: { fieldName: string; errors: string[] } }
  | { type: 'SET_FIELD_VALIDATION'; payload: { fieldName: string; validation: ValidationResult } }
  | { type: 'RESET_FORM' }
  | { type: 'CALCULATE_PROGRESS' };

// Form State Context
interface FormContextType {
  state: FormState;
  // Field management
  updateFieldValue: (fieldName: string, value: any, page: number) => void;
  setCurrentField: (index: number) => void;
  markFieldComplete: (fieldName: string) => void;
  validateField: (fieldName: string) => Promise<ValidationResult>;
  validateAllFields: () => Promise<Record<string, ValidationResult>>;
  // Navigation helpers
  getNextIncompleteField: () => FormField | null;
  getCurrentField: () => FormField | null;
  getFieldByName: (fieldName: string) => FormField | null;
  // Progress tracking
  getCompletionPercentage: () => number;
  getRequiredFieldsStatus: () => { completed: number; total: number };
  // Form validation
  isFormValid: () => boolean;
  getFormErrors: () => Record<string, string[]>;
  getFieldValidation: (fieldName: string) => ValidationResult | null;
  // Utility
  resetForm: () => void;
  initializeFields: (fields: FormField[]) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// Initial state
const initialState: FormState = {
  fields: new Map(),
  currentFieldIndex: -1,
  completedFields: [],
  requiredFields: [],
  totalRequiredFields: 0,
  completionPercentage: 0,
  isValid: false,
  validationResults: new Map()
};

// Form reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'INITIALIZE_FIELDS': {
      const fields = action.payload;
      const fieldMap = new Map<string, FormFieldValue>();
      const requiredFields: string[] = [];

      fields.forEach(field => {
        fieldMap.set(field.name, {
          fieldName: field.name,
          value: field.value,
          page: field.page,
          isValid: !field.required || field.isComplete,
          errors: field.validationErrors
        });

        if (field.required && !field.readOnly) {
          requiredFields.push(field.name);
        }
      });

      return {
        ...state,
        fields: fieldMap,
        requiredFields,
        totalRequiredFields: requiredFields.length,
        completedFields: fields.filter(f => f.isComplete).map(f => f.name),
        completionPercentage: FormFieldService.calculateCompletionPercentage(fields),
        currentFieldIndex: 0
      };
    }

    case 'UPDATE_FIELD_VALUE': {
      const { fieldName, value, page } = action.payload;
      const newFields = new Map(state.fields);
      const existingField = newFields.get(fieldName);

      if (existingField) {
        const updatedField: FormFieldValue = {
          ...existingField,
          value,
          page,
          isValid: true, // Will be validated separately
          errors: []
        };
        newFields.set(fieldName, updatedField);
      }

      return {
        ...state,
        fields: newFields
      };
    }

    case 'SET_CURRENT_FIELD': {
      return {
        ...state,
        currentFieldIndex: action.payload
      };
    }

    case 'MARK_FIELD_COMPLETE': {
      const fieldName = action.payload;
      const completedFields = [...state.completedFields];
      
      if (!completedFields.includes(fieldName)) {
        completedFields.push(fieldName);
      }

      return {
        ...state,
        completedFields,
        completionPercentage: Math.round((completedFields.length / Math.max(state.totalRequiredFields, 1)) * 100)
      };
    }

    case 'SET_FIELD_ERRORS': {
      const { fieldName, errors } = action.payload;
      const newFields = new Map(state.fields);
      const field = newFields.get(fieldName);

      if (field) {
        newFields.set(fieldName, {
          ...field,
          errors,
          isValid: errors.length === 0
        });
      }

      return {
        ...state,
        fields: newFields
      };
    }

    case 'SET_FIELD_VALIDATION': {
      const { fieldName, validation } = action.payload;
      const newValidationResults = new Map(state.validationResults);
      const newFields = new Map(state.fields);
      const field = newFields.get(fieldName);

      newValidationResults.set(fieldName, validation);

      if (field) {
        newFields.set(fieldName, {
          ...field,
          errors: validation.errors,
          isValid: validation.isValid
        });
      }

      return {
        ...state,
        fields: newFields,
        validationResults: newValidationResults
      };
    }

    case 'CALCULATE_PROGRESS': {
      const completedRequiredFields = state.completedFields.filter(fieldName =>
        state.requiredFields.includes(fieldName)
      );

      return {
        ...state,
        completionPercentage: Math.round((completedRequiredFields.length / Math.max(state.totalRequiredFields, 1)) * 100)
      };
    }

    case 'RESET_FORM': {
      return {
        ...initialState,
        fields: new Map(
          Array.from(state.fields.entries()).map(([key, field]) => [
            key,
            {
              ...field,
              value: field.fieldName.includes('checkbox') ? false : '',
              isValid: !state.requiredFields.includes(field.fieldName),
              errors: []
            }
          ])
        ),
        requiredFields: state.requiredFields,
        totalRequiredFields: state.totalRequiredFields
      };
    }

    default:
      return state;
  }
}

// Form Provider
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Initialize fields
  const initializeFields = useCallback((fields: FormField[]) => {
    dispatch({ type: 'INITIALIZE_FIELDS', payload: fields });
  }, []);

  // Update field value
  const updateFieldValue = useCallback((fieldName: string, value: any, page: number) => {
    dispatch({ type: 'UPDATE_FIELD_VALUE', payload: { fieldName, value, page } });
    
    // Auto-validate the field after a short delay
    setTimeout(async () => {
      await validateField(fieldName);
    }, 100);
  }, []);

  // Set current field
  const setCurrentField = useCallback((index: number) => {
    dispatch({ type: 'SET_CURRENT_FIELD', payload: index });
  }, []);

  // Mark field as complete
  const markFieldComplete = useCallback((fieldName: string) => {
    dispatch({ type: 'MARK_FIELD_COMPLETE', payload: fieldName });
    dispatch({ type: 'CALCULATE_PROGRESS' });
  }, []);

  // Validate field using ValidationService
  const validateField = useCallback(async (fieldName: string): Promise<ValidationResult> => {
    const fieldValue = state.fields.get(fieldName);
    if (!fieldValue) {
      const emptyResult: ValidationResult = {
        isValid: false,
        errors: ['Field not found'],
        warnings: [],
        fieldName,
        validatedAt: Date.now()
      };
      return emptyResult;
    }

    // Create a temporary FormField for validation
    const tempField: FormField = {
      name: fieldName,
      type: 'text', // Default type, should be enhanced based on field analysis
      value: fieldValue.value,
      required: state.requiredFields.includes(fieldName),
      readOnly: false,
      page: fieldValue.page,
      rect: [0, 0, 0, 0],
      isComplete: state.completedFields.includes(fieldName),
      validationErrors: [],
      id: fieldName,
      subtype: ''
    };

    // Get all fields for dependency validation
    const allFields: FormField[] = Array.from(state.fields.entries()).map(([name, value]) => ({
      name,
      type: 'text',
      value: value.value,
      required: state.requiredFields.includes(name),
      readOnly: false,
      page: value.page,
      rect: [0, 0, 0, 0],
      isComplete: state.completedFields.includes(name),
      validationErrors: value.errors,
      id: name,
      subtype: ''
    }));

    try {
      const validationResult = await ValidationService.validateField(
        tempField, 
        fieldValue.value, 
        allFields,
        {
          validateRequired: true,
          validateFormat: true,
          validateDependencies: true,
          excludeReadOnly: true
        }
      );

      // Update state with validation result
      dispatch({ 
        type: 'SET_FIELD_VALIDATION', 
        payload: { fieldName, validation: validationResult } 
      });

      // Mark field as complete if valid
      if (validationResult.isValid && !state.completedFields.includes(fieldName)) {
        markFieldComplete(fieldName);
      }

      return validationResult;

    } catch (error) {
      console.error(`Validation failed for field "${fieldName}":`, error);
      const errorResult: ValidationResult = {
        isValid: false,
        errors: ['Validation error occurred'],
        warnings: [],
        fieldName,
        validatedAt: Date.now()
      };
      
      dispatch({ 
        type: 'SET_FIELD_VALIDATION', 
        payload: { fieldName, validation: errorResult } 
      });
      
      return errorResult;
    }
  }, [state.fields, state.requiredFields, state.completedFields, markFieldComplete]);

  // Validate all fields
  const validateAllFields = useCallback(async (): Promise<Record<string, ValidationResult>> => {
    const allFields: FormField[] = Array.from(state.fields.entries()).map(([name, value]) => ({
      name,
      type: 'text',
      value: value.value,
      required: state.requiredFields.includes(name),
      readOnly: false,
      page: value.page,
      rect: [0, 0, 0, 0],
      isComplete: state.completedFields.includes(name),
      validationErrors: value.errors,
      id: name,
      subtype: ''
    }));

    const fieldValues: Record<string, any> = {};
    state.fields.forEach((value, name) => {
      fieldValues[name] = value.value;
    });

    try {
      const validationResults = await ValidationService.validateFields(
        allFields,
        fieldValues,
        {
          validateRequired: true,
          validateFormat: true,
          validateDependencies: true,
          excludeReadOnly: true
        }
      );

      // Update all validation results in state
      Object.entries(validationResults).forEach(([fieldName, result]) => {
        dispatch({
          type: 'SET_FIELD_VALIDATION',
          payload: { fieldName, validation: result }
        });
      });

      return validationResults;

    } catch (error) {
      console.error('Bulk validation failed:', error);
      return {};
    }
  }, [state.fields, state.requiredFields, state.completedFields]);

  // Get next incomplete field
  const getNextIncompleteField = useCallback((): FormField | null => {
    const incompleteFields = Array.from(state.fields.entries())
      .filter(([fieldName]) => 
        !state.completedFields.includes(fieldName) && 
        state.requiredFields.includes(fieldName)
      );

    if (incompleteFields.length === 0) return null;

    return {
      name: incompleteFields[0][0],
      type: 'text',
      value: incompleteFields[0][1].value,
      required: true,
      readOnly: false,
      page: incompleteFields[0][1].page,
      rect: [0, 0, 0, 0],
      isComplete: false,
      validationErrors: incompleteFields[0][1].errors,
      id: incompleteFields[0][0],
      subtype: ''
    };
  }, [state.fields, state.completedFields, state.requiredFields]);

  // Get current field
  const getCurrentField = useCallback((): FormField | null => {
    const fieldsArray = Array.from(state.fields.keys());
    if (state.currentFieldIndex < 0 || state.currentFieldIndex >= fieldsArray.length) {
      return null;
    }

    const fieldName = fieldsArray[state.currentFieldIndex];
    const fieldValue = state.fields.get(fieldName);
    if (!fieldValue) return null;

    return {
      name: fieldName,
      type: 'text',
      value: fieldValue.value,
      required: state.requiredFields.includes(fieldName),
      readOnly: false,
      page: fieldValue.page,
      rect: [0, 0, 0, 0],
      isComplete: state.completedFields.includes(fieldName),
      validationErrors: fieldValue.errors,
      id: fieldName,
      subtype: ''
    };
  }, [state.fields, state.currentFieldIndex, state.requiredFields, state.completedFields]);

  // Get field by name
  const getFieldByName = useCallback((fieldName: string): FormField | null => {
    const fieldValue = state.fields.get(fieldName);
    if (!fieldValue) return null;

    return {
      name: fieldName,
      type: 'text',
      value: fieldValue.value,
      required: state.requiredFields.includes(fieldName),
      readOnly: false,
      page: fieldValue.page,
      rect: [0, 0, 0, 0],
      isComplete: state.completedFields.includes(fieldName),
      validationErrors: fieldValue.errors,
      id: fieldName,
      subtype: ''
    };
  }, [state.fields, state.requiredFields, state.completedFields]);

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    return state.completionPercentage;
  }, [state.completionPercentage]);

  // Get required fields status
  const getRequiredFieldsStatus = useCallback(() => {
    const completedRequired = state.completedFields.filter(fieldName =>
      state.requiredFields.includes(fieldName)
    );

    return {
      completed: completedRequired.length,
      total: state.totalRequiredFields
    };
  }, [state.completedFields, state.requiredFields, state.totalRequiredFields]);

  // Check if form is valid
  const isFormValid = useCallback((): boolean => {
    const allRequiredCompleted = state.requiredFields.every(fieldName =>
      state.completedFields.includes(fieldName)
    );

    const noErrors = Array.from(state.fields.values()).every(field =>
      field.errors.length === 0
    );

    return allRequiredCompleted && noErrors;
  }, [state.requiredFields, state.completedFields, state.fields]);

  // Get all form errors
  const getFormErrors = useCallback((): Record<string, string[]> => {
    const errors: Record<string, string[]> = {};

    state.fields.forEach((field, fieldName) => {
      if (field.errors.length > 0) {
        errors[fieldName] = field.errors;
      }
    });

    return errors;
  }, [state.fields]);

  // Get field validation result
  const getFieldValidation = useCallback((fieldName: string): ValidationResult | null => {
    return state.validationResults.get(fieldName) || null;
  }, [state.validationResults]);

  // Reset form
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
    ValidationService.clearValidationCache();
  }, []);

  // Update isValid when state changes
  useEffect(() => {
    const formValid = isFormValid();
    if (state.isValid !== formValid) {
      // Update state.isValid if needed (would require additional action)
    }
  }, [state.fields, state.completedFields, state.requiredFields, isFormValid, state.isValid]);

  const contextValue: FormContextType = {
    state,
    updateFieldValue,
    setCurrentField,
    markFieldComplete,
    validateField,
    validateAllFields,
    getNextIncompleteField,
    getCurrentField,
    getFieldByName,
    getCompletionPercentage,
    getRequiredFieldsStatus,
    isFormValid,
    getFormErrors,
    getFieldValidation,
    resetForm,
    initializeFields
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

// Hook to use form context
export const useForm = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};