import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { FormField } from '../types/pdf';
import { useForm } from './FormContext';

// Wizard States
export type WizardState = 'idle' | 'start' | 'next' | 'sign' | 'submit' | 'complete';

// Wizard Button States
export type WizardButtonState = {
  text: string;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  disabled: boolean;
  action: () => void;
};

// Wizard Context State
interface WizardContextState {
  wizardState: WizardState;
  currentFieldIndex: number;
  currentField: FormField | null;
  requiredFields: FormField[];
  signatureFields: FormField[];
  completedFields: string[];
  totalRequiredFields: number;
  completionPercentage: number;
  isFormValid: boolean;
  showFieldTooltip: boolean;
  tooltipField: FormField | null;
}

// Wizard Actions
type WizardAction =
  | { type: 'INITIALIZE'; payload: { requiredFields: FormField[]; signatureFields: FormField[] } }
  | { type: 'SET_WIZARD_STATE'; payload: WizardState }
  | { type: 'SET_CURRENT_FIELD'; payload: { field: FormField | null; index: number } }
  | { type: 'FIELD_COMPLETED'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: string[]; percentage: number } }
  | { type: 'SET_FORM_VALID'; payload: boolean }
  | { type: 'SHOW_TOOLTIP'; payload: FormField | null }
  | { type: 'HIDE_TOOLTIP' }
  | { type: 'RESET_WIZARD' };

// Wizard Context Type
interface WizardContextType {
  state: WizardContextState;
  // Navigation
  startWizard: () => void;
  nextField: () => void;
  goToSignatures: () => void;
  submitForm: () => void;
  jumpToField: (field: FormField) => void;
  // Field management
  markFieldComplete: (fieldName: string) => void;
  getCurrentButtonState: () => WizardButtonState;
  // Tooltip management
  showFieldTooltip: (field: FormField) => void;
  hideFieldTooltip: () => void;
  // Utility
  resetWizard: () => void;
  initializeWizard: (allFields: FormField[]) => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

// Initial state
const initialState: WizardContextState = {
  wizardState: 'idle',
  currentFieldIndex: -1,
  currentField: null,
  requiredFields: [],
  signatureFields: [],
  completedFields: [],
  totalRequiredFields: 0,
  completionPercentage: 0,
  isFormValid: false,
  showFieldTooltip: false,
  tooltipField: null
};

// Wizard reducer
function wizardReducer(state: WizardContextState, action: WizardAction): WizardContextState {
  switch (action.type) {
    case 'INITIALIZE': {
      const { requiredFields, signatureFields } = action.payload;
      return {
        ...state,
        requiredFields,
        signatureFields,
        totalRequiredFields: requiredFields.length,
        wizardState: 'start'
      };
    }

    case 'SET_WIZARD_STATE': {
      return {
        ...state,
        wizardState: action.payload
      };
    }

    case 'SET_CURRENT_FIELD': {
      const { field, index } = action.payload;
      return {
        ...state,
        currentField: field,
        currentFieldIndex: index
      };
    }

    case 'FIELD_COMPLETED': {
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

    case 'UPDATE_PROGRESS': {
      const { completed, percentage } = action.payload;
      return {
        ...state,
        completedFields: completed,
        completionPercentage: percentage
      };
    }

    case 'SET_FORM_VALID': {
      return {
        ...state,
        isFormValid: action.payload
      };
    }

    case 'SHOW_TOOLTIP': {
      return {
        ...state,
        showFieldTooltip: true,
        tooltipField: action.payload
      };
    }

    case 'HIDE_TOOLTIP': {
      return {
        ...state,
        showFieldTooltip: false,
        tooltipField: null
      };
    }

    case 'RESET_WIZARD': {
      return {
        ...initialState
      };
    }
    
    case 'UPDATE_FEATURE_FLAGS': {
      return {
        ...state,
        enhancedMode: action.payload.enhancedMode,
        progressiveMode: action.payload.progressiveMode,
        smartDetection: action.payload.smartDetection
      };
    }

    default:
      return state;
  }
}

// Wizard Provider
export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const formContext = useForm();
  
  // Feature flags for wizard behavior
  const { isEnabled: enhancedWizardMode } = useFeatureFlag('ENHANCED_WIZARD_MODE');
  const { isEnabled: progressiveFormFilling } = useFeatureFlag('PROGRESSIVE_FORM_FILLING');
  const { isEnabled: smartFieldDetection } = useFeatureFlag('SMART_FIELD_DETECTION');
  
  // Update feature flags in wizard state
  useEffect(() => {
    dispatch({
      type: 'UPDATE_FEATURE_FLAGS',
      payload: {
        enhancedMode: enhancedWizardMode,
        progressiveMode: progressiveFormFilling,
        smartDetection: smartFieldDetection
      }
    });
  }, [enhancedWizardMode, progressiveFormFilling, smartFieldDetection]);

  // Initialize wizard with form fields
  const initializeWizard = useCallback((allFields: FormField[]) => {
    const requiredFields = allFields.filter(field => field.required && !field.readOnly);
    const signatureFields = allFields.filter(field => 
      field.type === 'signature' || 
      field.name.toLowerCase().includes('signature') ||
      field.name.toLowerCase().includes('sign')
    );

    dispatch({
      type: 'INITIALIZE',
      payload: { requiredFields, signatureFields }
    });
  }, []);

  // Start the wizard
  const startWizard = useCallback(() => {
    const firstIncompleteField = state.requiredFields.find(field => 
      !state.completedFields.includes(field.name)
    );

    if (firstIncompleteField) {
      dispatch({
        type: 'SET_CURRENT_FIELD',
        payload: { field: firstIncompleteField, index: 0 }
      });
      dispatch({ type: 'SET_WIZARD_STATE', payload: 'next' });
      
      // Show tooltip for the field
      showFieldTooltip(firstIncompleteField);
    } else {
      // All required fields complete, check signatures
      if (state.signatureFields.length > 0) {
        dispatch({ type: 'SET_WIZARD_STATE', payload: 'sign' });
      } else {
        dispatch({ type: 'SET_WIZARD_STATE', payload: 'submit' });
      }
    }
  }, [state.requiredFields, state.completedFields, state.signatureFields]);

  // Navigate to next field
  const nextField = useCallback(() => {
    const incompleteRequired = state.requiredFields.filter(field => 
      !state.completedFields.includes(field.name)
    );

    if (incompleteRequired.length > 0) {
      const nextField = incompleteRequired[0];
      const fieldIndex = state.requiredFields.findIndex(f => f.name === nextField.name);
      
      dispatch({
        type: 'SET_CURRENT_FIELD',
        payload: { field: nextField, index: fieldIndex }
      });
      
      showFieldTooltip(nextField);
    } else {
      // All required fields complete
      if (state.signatureFields.length > 0) {
        const incompleteSignatures = state.signatureFields.filter(field =>
          !state.completedFields.includes(field.name)
        );
        
        if (incompleteSignatures.length > 0) {
          dispatch({ type: 'SET_WIZARD_STATE', payload: 'sign' });
          const firstSignature = incompleteSignatures[0];
          dispatch({
            type: 'SET_CURRENT_FIELD',
            payload: { field: firstSignature, index: 0 }
          });
          showFieldTooltip(firstSignature);
        } else {
          dispatch({ type: 'SET_WIZARD_STATE', payload: 'submit' });
        }
      } else {
        dispatch({ type: 'SET_WIZARD_STATE', payload: 'submit' });
      }
    }
  }, [state.requiredFields, state.signatureFields, state.completedFields]);

  // Go to signature fields
  const goToSignatures = useCallback(() => {
    if (state.signatureFields.length > 0) {
      const firstIncompleteSignature = state.signatureFields.find(field =>
        !state.completedFields.includes(field.name)
      );

      if (firstIncompleteSignature) {
        dispatch({
          type: 'SET_CURRENT_FIELD',
          payload: { field: firstIncompleteSignature, index: 0 }
        });
        dispatch({ type: 'SET_WIZARD_STATE', payload: 'sign' });
        showFieldTooltip(firstIncompleteSignature);
      } else {
        // All signatures complete
        dispatch({ type: 'SET_WIZARD_STATE', payload: 'submit' });
      }
    }
  }, [state.signatureFields, state.completedFields]);

  // Submit form
  const submitForm = useCallback(() => {
    if (state.isFormValid) {
      dispatch({ type: 'SET_WIZARD_STATE', payload: 'complete' });
      console.log('Form submitted successfully!');
      
      // TODO: Implement actual form submission in Phase 7
      alert('Form submission will be implemented in Phase 7. All fields completed!');
    } else {
      console.warn('Form is not valid for submission');
    }
  }, [state.isFormValid]);

  // Jump to specific field
  const jumpToField = useCallback((field: FormField) => {
    const fieldIndex = state.requiredFields.findIndex(f => f.name === field.name);
    
    dispatch({
      type: 'SET_CURRENT_FIELD',
      payload: { field, index: fieldIndex >= 0 ? fieldIndex : 0 }
    });

    // Update wizard state based on field type
    if (field.type === 'signature') {
      dispatch({ type: 'SET_WIZARD_STATE', payload: 'sign' });
    } else if (field.required) {
      dispatch({ type: 'SET_WIZARD_STATE', payload: 'next' });
    }

    showFieldTooltip(field);
  }, [state.requiredFields]);

  // Mark field as complete
  const markFieldComplete = useCallback((fieldName: string) => {
    dispatch({ type: 'FIELD_COMPLETED', payload: fieldName });
    
    // Update form context as well
    formContext.markFieldComplete(fieldName);
  }, [formContext]);

  // Show field tooltip
  const showFieldTooltip = useCallback((field: FormField) => {
    dispatch({ type: 'SHOW_TOOLTIP', payload: field });
  }, []);

  // Hide field tooltip
  const hideFieldTooltip = useCallback(() => {
    dispatch({ type: 'HIDE_TOOLTIP' });
  }, []);

  // Get current button state
  const getCurrentButtonState = useCallback((): WizardButtonState => {
    switch (state.wizardState) {
      case 'idle':
      case 'start':
        return {
          text: 'Start',
          color: 'primary', // Blue
          disabled: state.totalRequiredFields === 0,
          action: startWizard
        };

      case 'next': {
        const incompleteRequired = state.requiredFields.filter(field => 
          !state.completedFields.includes(field.name)
        );
        
        if (incompleteRequired.length > 0) {
          return {
            text: 'Next',
            color: 'secondary', // Orange
            disabled: false,
            action: nextField
          };
        } else {
          // All required complete, check signatures
          if (state.signatureFields.length > 0) {
            return {
              text: 'Sign',
              color: 'info', // Purple
              disabled: false,
              action: goToSignatures
            };
          } else {
            return {
              text: 'Submit',
              color: 'success', // Green
              disabled: !state.isFormValid,
              action: submitForm
            };
          }
        }
      }

      case 'sign': {
        const incompleteSignatures = state.signatureFields.filter(field =>
          !state.completedFields.includes(field.name)
        );
        
        if (incompleteSignatures.length > 0) {
          return {
            text: 'Sign',
            color: 'info', // Purple
            disabled: false,
            action: nextField
          };
        } else {
          return {
            text: 'Submit',
            color: 'success', // Green
            disabled: !state.isFormValid,
            action: submitForm
          };
        }
      }

      case 'submit':
        return {
          text: 'Submit',
          color: 'success', // Green
          disabled: !state.isFormValid,
          action: submitForm
        };

      case 'complete':
        return {
          text: 'Complete',
          color: 'success', // Green
          disabled: true,
          action: () => {}
        };

      default:
        return {
          text: 'Start',
          color: 'primary',
          disabled: true,
          action: startWizard
        };
    }
  }, [state.wizardState, state.requiredFields, state.signatureFields, state.completedFields, state.isFormValid, startWizard, nextField, goToSignatures, submitForm]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    dispatch({ type: 'RESET_WIZARD' });
  }, []);

  // Update form validity when form context changes
  useEffect(() => {
    const formValid = formContext.isFormValid();
    dispatch({ type: 'SET_FORM_VALID', payload: formValid });
  }, [formContext]);

  // Update completion progress when form context changes
  useEffect(() => {
    const percentage = formContext.getCompletionPercentage();
    const { completed } = formContext.getRequiredFieldsStatus();
    
    dispatch({
      type: 'UPDATE_PROGRESS',
      payload: {
        completed: Array.from(formContext.state.fields.keys()).filter(fieldName =>
          formContext.state.completedFields.includes(fieldName)
        ),
        percentage
      }
    });
  }, [formContext]);

  const contextValue: WizardContextType = {
    state,
    startWizard,
    nextField,
    goToSignatures,
    submitForm,
    jumpToField,
    markFieldComplete,
    getCurrentButtonState,
    showFieldTooltip,
    hideFieldTooltip,
    resetWizard,
    initializeWizard
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
};

// Hook to use wizard context
export const useWizard = () => {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};