import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
} from 'react';
import type {
  FormField,
  PageFormFields,
  FormValidationResult,
} from '../services/formFieldService';
import { formFieldService } from '../services/formFieldService';

// Form State Interface
export interface FormState {
  // Form field definitions from PDF
  allPageFields: PageFormFields[];

  // Current form data values
  formData: Record<string, any>;

  // Validation state
  validationErrors: Record<string, string>;
  validationResult: FormValidationResult | null;

  // Current field focus and wizard state
  currentFieldId: string | null;
  currentPageNumber: number;

  // Form completion tracking
  completedFields: Set<string>;
  requiredFields: FormField[];

  // Form submission state
  isSubmitting: boolean;
  submissionError: string | null;
  isSubmitted: boolean;
}

// Action Types
type FormAction =
  | { type: 'SET_FORM_FIELDS'; payload: PageFormFields[] }
  | { type: 'SET_FIELD_VALUE'; payload: { fieldId: string; value: any } }
  | { type: 'SET_CURRENT_FIELD'; payload: string | null }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_VALIDATION_RESULT'; payload: FormValidationResult }
  | { type: 'MARK_FIELD_COMPLETED'; payload: string }
  | { type: 'MARK_FIELD_INCOMPLETE'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_SUBMISSION_ERROR'; payload: string | null }
  | { type: 'SET_SUBMITTED'; payload: boolean }
  | { type: 'RESET_FORM' };

// Initial State
const initialState: FormState = {
  allPageFields: [],
  formData: {},
  validationErrors: {},
  validationResult: null,
  currentFieldId: null,
  currentPageNumber: 1,
  completedFields: new Set<string>(),
  requiredFields: [],
  isSubmitting: false,
  submissionError: null,
  isSubmitted: false,
};

// Reducer Function
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_FIELDS': {
      const allPageFields = action.payload;
      const requiredFields = formFieldService.getRequiredFields(allPageFields);

      return {
        ...state,
        allPageFields,
        requiredFields,
      };
    }

    case 'SET_FIELD_VALUE': {
      const { fieldId, value } = action.payload;
      const newFormData = { ...state.formData, [fieldId]: value };

      // Clear validation error for this field when value changes
      const newValidationErrors = { ...state.validationErrors };
      delete newValidationErrors[fieldId];

      // Update completed fields
      const newCompletedFields = new Set(state.completedFields);
      if (value !== null && value !== undefined && value !== '') {
        newCompletedFields.add(fieldId);
      } else {
        newCompletedFields.delete(fieldId);
      }

      return {
        ...state,
        formData: newFormData,
        validationErrors: newValidationErrors,
        completedFields: newCompletedFields,
      };
    }

    case 'SET_CURRENT_FIELD':
      return {
        ...state,
        currentFieldId: action.payload,
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPageNumber: action.payload,
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload,
      };

    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        validationResult: action.payload,
      };

    case 'MARK_FIELD_COMPLETED': {
      const newCompletedFields = new Set(state.completedFields);
      newCompletedFields.add(action.payload);
      return {
        ...state,
        completedFields: newCompletedFields,
      };
    }

    case 'MARK_FIELD_INCOMPLETE': {
      const newCompletedFields = new Set(state.completedFields);
      newCompletedFields.delete(action.payload);
      return {
        ...state,
        completedFields: newCompletedFields,
      };
    }

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case 'SET_SUBMISSION_ERROR':
      return {
        ...state,
        submissionError: action.payload,
      };

    case 'SET_SUBMITTED':
      return {
        ...state,
        isSubmitted: action.payload,
      };

    case 'RESET_FORM':
      return {
        ...initialState,
        allPageFields: state.allPageFields, // Keep the field definitions
        requiredFields: state.requiredFields, // Keep required fields
      };

    default:
      return state;
  }
}

// Context Type
interface FormContextType {
  state: FormState;

  // Field Management
  setFormFields: (fields: PageFormFields[]) => void;
  setFieldValue: (fieldId: string, value: any) => void;
  getFieldValue: (fieldId: string) => any;
  findFieldById: (fieldId: string) => FormField | null;

  // Current Field Navigation
  setCurrentField: (fieldId: string | null) => void;
  setCurrentPage: (pageNumber: number) => void;

  // Field Completion Tracking
  markFieldCompleted: (fieldId: string) => void;
  markFieldIncomplete: (fieldId: string) => void;
  isFieldCompleted: (fieldId: string) => boolean;

  // Validation
  validateForm: () => FormValidationResult;
  validateField: (fieldId: string) => string | null;
  clearValidationErrors: () => void;

  // Progress Calculation
  getFormProgress: () => {
    completed: number;
    total: number;
    percentage: number;
  };
  getNextRequiredField: () => FormField | null;
  getNextIncompleteField: () => FormField | null;

  // Form Submission
  submitForm: () => Promise<void>;
  resetForm: () => void;

  // Wizard Navigation Helpers
  getSignatureFields: () => FormField[];
  hasRequiredFields: () => boolean;
  hasSignatureFields: () => boolean;
  areRequiredFieldsCompleted: () => boolean;
}

// Create Context
const FormContext = createContext<FormContextType | undefined>(undefined);

// Form Provider Props
interface FormProviderProps {
  children: React.ReactNode;
  onSubmit?: (formData: Record<string, any>) => Promise<void>;
}

// Form Provider Component
export const FormProvider: React.FC<FormProviderProps> = ({
  children,
  onSubmit,
}) => {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Field Management
  const setFormFields = useCallback((fields: PageFormFields[]) => {
    dispatch({ type: 'SET_FORM_FIELDS', payload: fields });
  }, []);

  const setFieldValue = useCallback((fieldId: string, value: any) => {
    dispatch({ type: 'SET_FIELD_VALUE', payload: { fieldId, value } });
  }, []);

  const getFieldValue = useCallback(
    (fieldId: string) => {
      return state.formData[fieldId];
    },
    [state.formData]
  );

  const findFieldById = useCallback(
    (fieldId: string) => {
      return formFieldService.findFieldById(state.allPageFields, fieldId);
    },
    [state.allPageFields]
  );

  // Current Field Navigation
  const setCurrentField = useCallback((fieldId: string | null) => {
    dispatch({ type: 'SET_CURRENT_FIELD', payload: fieldId });
  }, []);

  const setCurrentPage = useCallback((pageNumber: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageNumber });
  }, []);

  // Field Completion Tracking
  const markFieldCompleted = useCallback((fieldId: string) => {
    dispatch({ type: 'MARK_FIELD_COMPLETED', payload: fieldId });
  }, []);

  const markFieldIncomplete = useCallback((fieldId: string) => {
    dispatch({ type: 'MARK_FIELD_INCOMPLETE', payload: fieldId });
  }, []);

  const isFieldCompleted = useCallback(
    (fieldId: string) => {
      return state.completedFields.has(fieldId);
    },
    [state.completedFields]
  );

  // Validation
  const validateForm = useCallback(() => {
    const result = formFieldService.validateFormData(
      state.allPageFields,
      state.formData
    );
    dispatch({ type: 'SET_VALIDATION_RESULT', payload: result });

    // Convert validation errors to field-specific errors
    const fieldErrors: Record<string, string> = {};
    result.errors.forEach((error) => {
      fieldErrors[error.fieldId] = error.message;
    });
    result.missingRequired.forEach((fieldId) => {
      const field = findFieldById(fieldId);
      fieldErrors[fieldId] = `${field?.name || 'Field'} is required`;
    });

    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: fieldErrors });

    return result;
  }, [state.allPageFields, state.formData, findFieldById]);

  const validateField = useCallback(
    (fieldId: string) => {
      const field = findFieldById(fieldId);
      if (!field) return null;

      const value = state.formData[fieldId];

      // Import validation utility
      const { validateFieldValue } = require('../utils/validationUtils');
      const error = validateFieldValue(field, value);
      return error;
    },
    [state.formData, findFieldById]
  );

  const clearValidationErrors = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: {} });
    dispatch({
      type: 'SET_VALIDATION_RESULT',
      payload: { isValid: true, errors: [], missingRequired: [] },
    });
  }, []);

  // Progress Calculation
  const getFormProgress = useCallback(() => {
    const totalFields = state.requiredFields.length;
    const completedFields = state.requiredFields.filter((field) =>
      state.completedFields.has(field.id)
    ).length;

    return {
      completed: completedFields,
      total: totalFields,
      percentage:
        totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0,
    };
  }, [state.requiredFields, state.completedFields]);

  const getNextRequiredField = useCallback(() => {
    return (
      state.requiredFields.find(
        (field) => !state.completedFields.has(field.id)
      ) || null
    );
  }, [state.requiredFields, state.completedFields]);

  const getNextIncompleteField = useCallback(() => {
    // Get all fields (required and optional) that are incomplete
    for (const pageFields of state.allPageFields) {
      for (const field of pageFields.fields) {
        if (!field.readOnly && !state.completedFields.has(field.id)) {
          return field;
        }
      }
    }
    return null;
  }, [state.allPageFields, state.completedFields]);

  // Form Submission
  const submitForm = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_SUBMISSION_ERROR', payload: null });

    try {
      // Validate before submission
      const validationResult = validateForm();
      if (!validationResult.isValid) {
        throw new Error(
          'Form validation failed. Please correct the errors and try again.'
        );
      }

      // Call the provided submit handler
      if (onSubmitRef.current) {
        await onSubmitRef.current(state.formData);
      }

      dispatch({ type: 'SET_SUBMITTED', payload: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while submitting the form';
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [state.formData, validateForm]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // Wizard Navigation Helpers
  const getSignatureFields = useCallback(() => {
    return formFieldService.getFieldsByType(state.allPageFields, 'signature');
  }, [state.allPageFields]);

  const hasRequiredFields = useCallback(() => {
    return state.requiredFields.length > 0;
  }, [state.requiredFields]);

  const hasSignatureFields = useCallback(() => {
    return getSignatureFields().length > 0;
  }, [getSignatureFields]);

  const areRequiredFieldsCompleted = useCallback(() => {
    return state.requiredFields.every((field) =>
      state.completedFields.has(field.id)
    );
  }, [state.requiredFields, state.completedFields]);

  const contextValue: FormContextType = {
    state,
    setFormFields,
    setFieldValue,
    getFieldValue,
    findFieldById,
    setCurrentField,
    setCurrentPage,
    markFieldCompleted,
    markFieldIncomplete,
    isFieldCompleted,
    validateForm,
    validateField,
    clearValidationErrors,
    getFormProgress,
    getNextRequiredField,
    getNextIncompleteField,
    submitForm,
    resetForm,
    getSignatureFields,
    hasRequiredFields,
    hasSignatureFields,
    areRequiredFieldsCompleted,
  };

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};

// Hook to use Form Context
export const useForm = (): FormContextType => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};
