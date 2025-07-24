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
import { useFieldFocus } from '../hooks/useFieldFocus';

// Wizard State Interface
export interface WizardState {
  // Wizard mode (true when actively guiding user through form)
  isWizardMode: boolean;
  
  // Current wizard phase
  currentPhase: 'start' | 'filling' | 'signing' | 'complete';
  
  // Field navigation history for back button
  fieldHistory: string[];
  
  // Current field being highlighted in wizard
  highlightedFieldId: string | null;
  
  // Tooltip state
  showTooltip: boolean;
  tooltipMessage: string;
  tooltipFieldId: string | null;
}

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

  // Wizard state
  wizard: WizardState;
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
  | { type: 'RESET_FORM' }
  | { type: 'START_WIZARD' }
  | { type: 'STOP_WIZARD' }
  | { type: 'SET_WIZARD_PHASE'; payload: 'start' | 'filling' | 'signing' | 'complete' }
  | { type: 'SET_HIGHLIGHTED_FIELD'; payload: string | null }
  | { type: 'NAVIGATE_TO_FIELD'; payload: string }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'SHOW_TOOLTIP'; payload: { fieldId: string; message: string } }
  | { type: 'HIDE_TOOLTIP' };

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
  wizard: {
    isWizardMode: false,
    currentPhase: 'start',
    fieldHistory: [],
    highlightedFieldId: null,
    showTooltip: false,
    tooltipMessage: '',
    tooltipFieldId: null,
  },
};

// Reducer Function
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_FIELDS': {
      const allPageFields = action.payload;
      const requiredFields = formFieldService.getRequiredFields(allPageFields);

      console.log('📋 FormContext SET_FORM_FIELDS:', {
        pagesReceived: allPageFields.length,
        totalFieldsAcrossPages: allPageFields.reduce((sum, page) => sum + page.fields.length, 0),
        requiredFieldsFound: requiredFields.length,
        requiredFieldNames: requiredFields.map(f => f.name),
        allPageFieldsStructure: allPageFields.map(page => ({
          pageNumber: page.pageNumber,
          fieldCount: page.fields.length,
          fieldNames: page.fields.map(f => f.name)
        }))
      });

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

    case 'START_WIZARD':
      return {
        ...state,
        wizard: {
          ...state.wizard,
          isWizardMode: true,
          currentPhase: 'filling',
          fieldHistory: [],
        },
      };

    case 'STOP_WIZARD':
      return {
        ...state,
        wizard: {
          ...state.wizard,
          isWizardMode: false,
          currentPhase: 'start',
          fieldHistory: [],
          highlightedFieldId: null,
          showTooltip: false,
          tooltipMessage: '',
          tooltipFieldId: null,
        },
      };

    case 'SET_WIZARD_PHASE':
      return {
        ...state,
        wizard: {
          ...state.wizard,
          currentPhase: action.payload,
        },
      };

    case 'SET_HIGHLIGHTED_FIELD':
      return {
        ...state,
        wizard: {
          ...state.wizard,
          highlightedFieldId: action.payload,
        },
      };

    case 'NAVIGATE_TO_FIELD': {
      const fieldId = action.payload;
      const newFieldHistory = [...state.wizard.fieldHistory];
      
      // Add current field to history if it exists and is different
      if (state.currentFieldId && state.currentFieldId !== fieldId) {
        newFieldHistory.push(state.currentFieldId);
      }
      
      return {
        ...state,
        currentFieldId: fieldId,
        wizard: {
          ...state.wizard,
          fieldHistory: newFieldHistory,
          highlightedFieldId: fieldId,
        },
      };
    }

    case 'NAVIGATE_BACK': {
      const fieldHistory = [...state.wizard.fieldHistory];
      const previousFieldId = fieldHistory.pop() || null;
      
      return {
        ...state,
        currentFieldId: previousFieldId,
        wizard: {
          ...state.wizard,
          fieldHistory,
          highlightedFieldId: previousFieldId,
        },
      };
    }

    case 'SHOW_TOOLTIP': {
      const { fieldId, message } = action.payload;
      return {
        ...state,
        wizard: {
          ...state.wizard,
          showTooltip: true,
          tooltipMessage: message,
          tooltipFieldId: fieldId,
        },
      };
    }

    case 'HIDE_TOOLTIP':
      return {
        ...state,
        wizard: {
          ...state.wizard,
          showTooltip: false,
          tooltipMessage: '',
          tooltipFieldId: null,
        },
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

  // Wizard Management
  startWizard: () => void;
  stopWizard: () => void;
  toggleWizard: () => void;
  setWizardPhase: (phase: 'start' | 'filling' | 'signing' | 'complete') => void;
  navigateToField: (fieldId: string) => void;
  navigateBack: () => void;
  setHighlightedField: (fieldId: string | null) => void;
  showTooltip: (fieldId: string, message: string) => void;
  hideTooltip: () => void;

  // Wizard Navigation Logic
  getWizardButtonState: () => {
    type: 'start' | 'next' | 'sign' | 'submit';
    text: string;
    color: 'primary' | 'secondary' | 'warning' | 'success';
    disabled: boolean;
  };
  handleWizardButtonClick: () => void;

  // Field Focus Utilities
  focusFieldById: (fieldId: string) => void;
  focusCurrentField: () => void;
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
  const { focusField } = useFieldFocus();

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
    const nextField = state.requiredFields.find(
      (field) => !state.completedFields.has(field.id)
    ) || null;
    
    console.log('🔍 getNextRequiredField:', {
      totalRequired: state.requiredFields.length,
      requiredFieldNames: state.requiredFields.map(f => f.name),
      completedFields: Array.from(state.completedFields),
      nextField: nextField?.name || 'none'
    });
    
    return nextField;
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

  // Wizard Management
  const startWizard = useCallback(() => {
    dispatch({ type: 'START_WIZARD' });
  }, []);

  const stopWizard = useCallback(() => {
    dispatch({ type: 'STOP_WIZARD' });
  }, []);

  const setWizardPhase = useCallback((phase: 'start' | 'filling' | 'signing' | 'complete') => {
    dispatch({ type: 'SET_WIZARD_PHASE', payload: phase });
  }, []);

  const navigateToField = useCallback((fieldId: string) => {
    dispatch({ type: 'NAVIGATE_TO_FIELD', payload: fieldId });
    
    // Find the field and navigate to its page
    const field = findFieldById(fieldId);
    if (field) {
      setCurrentPage(field.pageNumber);
      
      // Use the enhanced field focus hook
      focusField(fieldId, field.name, {
        behavior: 'smooth',
        block: 'center',
        highlightDuration: 3000,
        delay: 400 // Slightly longer delay for page transitions
      });
    }
  }, [findFieldById, setCurrentPage, focusField]);

  const navigateBack = useCallback(() => {
    dispatch({ type: 'NAVIGATE_BACK' });
  }, []);

  const setHighlightedField = useCallback((fieldId: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_FIELD', payload: fieldId });
  }, []);

  const showTooltip = useCallback((fieldId: string, message: string) => {
    dispatch({ type: 'SHOW_TOOLTIP', payload: { fieldId, message } });
  }, []);

  const hideTooltip = useCallback(() => {
    dispatch({ type: 'HIDE_TOOLTIP' });
  }, []);

  // Wizard Navigation Logic
  const getWizardButtonState = useCallback(() => {
    const { isWizardMode } = state.wizard;
    
    console.log('🎯 Getting wizard button state:', {
      isWizardMode,
      totalRequiredFields: state.requiredFields.length,
      completedFieldsCount: state.completedFields.size
    });
    
    if (!isWizardMode) {
      return {
        type: 'start' as const,
        text: 'Start',
        color: 'primary' as const,
        disabled: false,
      };
    }

    const nextRequiredField = getNextRequiredField();
    const hasRequiredFieldsToComplete = nextRequiredField !== null;
    const hasSignatures = hasSignatureFields();
    const signatureFields = getSignatureFields();
    const signaturesComplete = signatureFields.every(field => 
      state.completedFields.has(field.id)
    );

    console.log('🎯 Wizard state analysis:', {
      nextRequiredField: nextRequiredField?.name || 'none',
      hasRequiredFieldsToComplete,
      hasSignatures,
      signatureFieldsCount: signatureFields.length,
      signaturesComplete
    });

    // If we have required fields to complete
    if (hasRequiredFieldsToComplete) {
      return {
        type: 'next' as const,
        text: 'Next',
        color: 'warning' as const,
        disabled: false,
      };
    }

    // If we have signature fields and they're not complete
    if (hasSignatures && !signaturesComplete) {
      return {
        type: 'sign' as const,
        text: 'Sign',
        color: 'secondary' as const,
        disabled: false,
      };
    }

    // All required fields and signatures are complete
    return {
      type: 'submit' as const,
      text: 'Submit',
      color: 'success' as const,
      disabled: state.isSubmitting,
    };
  }, [
    state.wizard,
    state.completedFields,
    state.isSubmitting,
    getNextRequiredField,
    hasSignatureFields,
    getSignatureFields,
  ]);

  // Toggle wizard mode
  const toggleWizard = useCallback(() => {
    if (state.wizard.isWizardMode) {
      console.log('🎯 Stopping wizard mode');
      stopWizard();
    } else {
      console.log('🎯 Starting wizard mode');
      startWizard();
      // Navigate to first required field
      const firstRequiredField = getNextRequiredField();
      console.log('🎯 First required field:', firstRequiredField?.name || 'none');
      if (firstRequiredField) {
        navigateToField(firstRequiredField.id);
        showTooltip(firstRequiredField.id, `Fill out: ${firstRequiredField.name}`);
      }
    }
  }, [state.wizard.isWizardMode, startWizard, stopWizard, getNextRequiredField, navigateToField, showTooltip]);

  const handleWizardButtonClick = useCallback(() => {
    toggleWizard();
  }, [toggleWizard]);

  // Field Focus Utilities
  const focusFieldById = useCallback((fieldId: string) => {
    const field = findFieldById(fieldId);
    if (field) {
      focusField(fieldId, field.name, {
        behavior: 'smooth',
        block: 'center',
        highlightDuration: 2000,
        delay: 100
      });
    }
  }, [findFieldById, focusField]);

  const focusCurrentField = useCallback(() => {
    if (state.currentFieldId) {
      focusFieldById(state.currentFieldId);
    }
  }, [state.currentFieldId, focusFieldById]);

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
    startWizard,
    stopWizard,
    toggleWizard,
    setWizardPhase,
    navigateToField,
    navigateBack,
    setHighlightedField,
    showTooltip,
    hideTooltip,
    getWizardButtonState,
    handleWizardButtonClick,
    focusFieldById,
    focusCurrentField,
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
