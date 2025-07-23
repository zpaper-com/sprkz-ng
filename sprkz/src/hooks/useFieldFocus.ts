import { useCallback } from 'react';

export interface FieldFocusOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
  highlightDuration?: number;
  delay?: number;
}

export const useFieldFocus = () => {
  const focusField = useCallback((
    fieldId: string,
    fieldName?: string,
    options: FieldFocusOptions = {}
  ) => {
    const {
      behavior = 'smooth',
      block = 'center',
      inline = 'nearest',
      highlightDuration = 2000,
      delay = 300
    } = options;

    console.log(`🎯 Attempting to focus field: ${fieldId} (${fieldName || 'unnamed'})`);

    // Wait for page transitions and DOM updates
    setTimeout(() => {
      // Try multiple selectors to find the field element
      const selectors = [
        `[data-field-id="${fieldId}"]`,
        `input[name="${fieldId}"]`,
        `textarea[name="${fieldId}"]`,
        `select[name="${fieldId}"]`,
        `[id="${fieldId}"]`,
        `[data-testid="${fieldId}"]`,
        // Try with form field naming patterns
        `input[name*="${fieldId}"]`,
        `textarea[name*="${fieldId}"]`,
        // Try by field name if available
        ...(fieldName ? [
          `input[name="${fieldName}"]`,
          `textarea[name="${fieldName}"]`,
          `select[name="${fieldName}"]`,
          `[data-field-name="${fieldName}"]`
        ] : [])
      ];
      
      let fieldElement: HTMLElement | null = null;
      
      // Try each selector until we find the element
      for (const selector of selectors) {
        try {
          fieldElement = document.querySelector(selector) as HTMLElement;
          if (fieldElement) {
            console.log(`🎯 Found field element with selector: ${selector}`);
            break;
          }
        } catch (error) {
          console.warn(`Invalid selector: ${selector}`, error);
        }
      }
      
      if (fieldElement) {
        // Scroll the field into view first
        try {
          fieldElement.scrollIntoView({
            behavior,
            block,
            inline
          });
          console.log(`📜 Scrolled field into view: ${fieldName || fieldId}`);
        } catch (error) {
          console.warn('Error scrolling field into view:', error);
        }

        // Focus the field
        try {
          if (fieldElement.focus) {
            fieldElement.focus();
            console.log(`🎯 Focused field: ${fieldName || fieldId}`);
            
            // Try to select text in input fields
            if (fieldElement instanceof HTMLInputElement || 
                fieldElement instanceof HTMLTextAreaElement) {
              fieldElement.select();
            }
          }
        } catch (error) {
          console.warn('Error focusing field:', error);
        }
        
        // Add visual highlight
        try {
          const originalBoxShadow = fieldElement.style.boxShadow;
          const originalTransition = fieldElement.style.transition;
          
          fieldElement.style.transition = 'box-shadow 0.3s ease';
          fieldElement.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.6), 0 0 0 6px rgba(255, 193, 7, 0.3)';
          
          // Remove highlight after specified duration
          setTimeout(() => {
            if (fieldElement) {
              fieldElement.style.boxShadow = originalBoxShadow;
              fieldElement.style.transition = originalTransition;
            }
          }, highlightDuration);
          
          console.log(`✨ Added highlight to field: ${fieldName || fieldId}`);
        } catch (error) {
          console.warn('Error adding highlight:', error);
        }
        
        return true; // Successfully focused
      } else {
        console.warn(`🎯 Could not find field element for: ${fieldId} (${fieldName || 'unnamed'})`);
        console.warn('Available elements:', {
          allDataFieldIds: Array.from(document.querySelectorAll('[data-field-id]')).map(el => el.getAttribute('data-field-id')),
          allInputNames: Array.from(document.querySelectorAll('input[name]')).map(el => el.getAttribute('name')),
          allTextareaNames: Array.from(document.querySelectorAll('textarea[name]')).map(el => el.getAttribute('name'))
        });
        return false; // Failed to focus
      }
    }, delay);
  }, []);

  const focusFieldById = useCallback((fieldId: string, options?: FieldFocusOptions) => {
    return focusField(fieldId, undefined, options);
  }, [focusField]);

  const focusFieldByName = useCallback((fieldName: string, options?: FieldFocusOptions) => {
    return focusField(fieldName, fieldName, options);
  }, [focusField]);

  return {
    focusField,
    focusFieldById,
    focusFieldByName
  };
};

export default useFieldFocus;