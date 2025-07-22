import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { FormField, FormState, FormFieldValue } from '../types/pdf';
import { FormFieldService } from '../services/formFieldService';

// Form Actions
type FormAction = 
  | { type: 'INITIALIZE_FIELDS'; payload: FormField[] }
  | { type: 'UPDATE_FIELD_VALUE'; payload: { fieldName: string; value: any; page: number } }
  | { type: 'SET_CURRENT_FIELD'; payload: number }
  | { type: 'MARK_FIELD_COMPLETE'; payload: string }
  | { type: 'SET_FIELD_ERRORS'; payload: { fieldName: string; errors: string[] } }
  | { type: 'RESET_FORM' }
  | { type: 'CALCULATE_PROGRESS' };

// Form State Context
interface FormContextType {
  state: FormState;
  // Field management
  updateFieldValue: (fieldName: string, value: any, page: number) => void;
  setCurrentField: (index: number) => void;
  markFieldComplete: (fieldName: string) => void;
  validateField: (fieldName: string) => boolean;
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
  isValid: false
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
    
    // Auto-validate the field
    setTimeout(() => validateField(fieldName), 0);
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

  // Validate field
  const validateField = useCallback((fieldName: string): boolean => {
    const fieldValue = state.fields.get(fieldName);
    if (!fieldValue) return false;

    // Create a temporary FormField for validation
    const tempField: FormField = {
      name: fieldName,
      type: 'text', // Default type, should be enhanced
      value: fieldValue.value,
      required: state.requiredFields.includes(fieldName),
      readOnly: false,
      page: fieldValue.page,
      rect: [0, 0, 0, 0],
      isComplete: false,
      validationErrors: [],
      id: fieldName,
      subtype: ''
    };

    const errors = FormFieldService.validateFieldValue(tempField, fieldValue.value);
    dispatch({ type: 'SET_FIELD_ERRORS', payload: { fieldName, errors } });

    if (errors.length === 0) {
      markFieldComplete(fieldName);
    }

    return errors.length === 0;
  }, [state.fields, state.requiredFields, markFieldComplete]);

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

  // Reset form
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
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
    getNextIncompleteField,
    getCurrentField,
    getFieldByName,
    getCompletionPercentage,
    getRequiredFieldsStatus,
    isFormValid,
    getFormErrors,
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