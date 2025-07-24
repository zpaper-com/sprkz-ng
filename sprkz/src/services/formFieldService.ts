import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';

export interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  name: string;
  rect: number[];
  pageNumber: number;
  required: boolean;
  readOnly: boolean;
  options?: string[];
  value?: string | boolean;
  maxLength?: number;
  multiLine?: boolean;
  placeholder?: string;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
  annotationElement?: HTMLElement; // Reference to PDF.js annotation element
}

export interface FormFieldGroup {
  radioName: string;
  fields: FormField[];
}

export interface PageFormFields {
  pageNumber: number;
  fields: FormField[];
  radioGroups: FormFieldGroup[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: { fieldId: string; message: string }[];
  missingRequired: string[];
}

class FormFieldService {
  private fieldIdCounter = 0;

  /**
   * Extract all form fields from a PDF page with enhanced categorization
   */
  async extractFormFields(
    page: PDFPageProxy,
    pageNumber: number
  ): Promise<PageFormFields> {
    try {
      const annotations = await page.getAnnotations({ intent: 'display' });

      const fields: FormField[] = [];
      const radioGroups: Map<string, FormField[]> = new Map();

      console.log(`📋 Page ${pageNumber} annotations:`, annotations.length);

      for (const annotation of annotations) {
        if (!annotation.fieldType) {
          console.log('⚠️ Skipping annotation without fieldType:', annotation);
          continue;
        }

        // Skip fields that start with "X_" or are system fields
        if (
          annotation.fieldName &&
          (annotation.fieldName.startsWith('X_') ||
            annotation.fieldName === 'dbTablename' ||
            annotation.fieldName === 'dbAction' ||
            annotation.fieldName === 'dbID' ||
            annotation.fieldName === 'zPaper' ||
            annotation.fieldName === 'kbup')
        ) {
          console.log(`🚫 Skipping system field: ${annotation.fieldName}`);
          continue;
        }

        console.log(`📝 Processing field: ${annotation.fieldName || 'unnamed'}`, {
          fieldType: annotation.fieldType,
          fieldFlags: annotation.fieldFlags
        });

        const field = this.createFormField(annotation, pageNumber);
        if (!field) {
          console.log('❌ Failed to create field');
          continue;
        }

        fields.push(field);
        console.log(`✅ Added field: ${field.name} (required: ${field.required})`);

        // Group radio buttons by name
        if (field.type === 'radio' && field.name) {
          if (!radioGroups.has(field.name)) {
            radioGroups.set(field.name, []);
          }
          radioGroups.get(field.name)!.push(field);
        }
      }

      // Convert radio groups to array format
      const radioGroupsArray: FormFieldGroup[] = Array.from(
        radioGroups.entries()
      ).map(([radioName, groupFields]) => ({
        radioName,
        fields: groupFields,
      }));

      const requiredFields = fields.filter(f => f.required);
      console.log(`📊 Page ${pageNumber} summary:`, {
        totalFields: fields.length,
        requiredFields: requiredFields.length,
        requiredFieldNames: requiredFields.map(f => f.name),
        radioGroups: radioGroups.size
      });

      return {
        pageNumber,
        fields,
        radioGroups: radioGroupsArray,
      };
    } catch (error) {
      console.error(
        `Error extracting form fields from page ${pageNumber}:`,
        error
      );
      return {
        pageNumber,
        fields: [],
        radioGroups: [],
      };
    }
  }

  /**
   * Extract form fields from all pages of a PDF
   */
  async extractAllFormFields(
    pdfDocument: pdfjsLib.PDFDocumentProxy
  ): Promise<PageFormFields[]> {
    const allPageFields: PageFormFields[] = [];
    const numPages = pdfDocument.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const pageFields = await this.extractFormFields(page, pageNum);
        allPageFields.push(pageFields);
      } catch (error) {
        console.error(`Error processing page ${pageNum}:`, error);
        // Continue with other pages even if one fails
        allPageFields.push({
          pageNumber: pageNum,
          fields: [],
          radioGroups: [],
        });
      }
    }

    return allPageFields;
  }

  /**
   * Create a FormField object from PDF.js annotation
   */
  private createFormField(
    annotation: any,
    pageNumber: number
  ): FormField | null {
    const fieldType = this.mapFieldType(annotation);
    if (!fieldType) return null;

    // Generate unique field ID
    const fieldId = `field_${pageNumber}_${this.fieldIdCounter++}`;

    const field: FormField = {
      id: fieldId,
      type: fieldType,
      name: annotation.fieldName || fieldId,
      rect: annotation.rect || [0, 0, 0, 0],
      pageNumber,
      required: this.isFieldRequired(annotation),
      readOnly: annotation.readOnly || false,
      value: this.getFieldValue(annotation, fieldType),
    };

    // Add type-specific properties
    this.enhanceFieldProperties(field, annotation);

    return field;
  }

  /**
   * Map PDF.js field types to our internal types with enhanced detection
   */
  private mapFieldType(annotation: any): FormField['type'] | null {
    const fieldType = annotation.fieldType;
    // const subtype = annotation.subtype; // unused

    switch (fieldType) {
      case 'Tx': // Text field
        return 'text';
      case 'Btn': // Button field
        return this.determineButtonType(annotation);
      case 'Ch': // Choice field
        return 'dropdown';
      case 'Sig': // Signature field
        return 'signature';
      default:
        // Skip unsupported field types
        return null;
    }
  }

  /**
   * Determine if a button field is checkbox or radio
   */
  private determineButtonType(annotation: any): 'checkbox' | 'radio' {
    const fieldFlags = annotation.fieldFlags || 0;
    const isRadio = (fieldFlags & 32768) !== 0; // Radio button flag
    return isRadio ? 'radio' : 'checkbox';
  }

  /**
   * Determine if field is required based on PDF metadata
   */
  private isFieldRequired(annotation: any): boolean {
    const fieldFlags = annotation.fieldFlags || 0;
    const isRequired = (fieldFlags & 2) !== 0; // Required flag from PDF metadata

    // Trust the PDF's metadata as the primary authority
    // Only use fallback methods if the PDF doesn't provide clear guidance
    const fieldName = annotation.fieldName || '';
    
    // Fallback 1: Check for explicit visual indicators (asterisks, "required" text)
    const hasExplicitIndicator = fieldName.includes('*') || fieldName.includes('required');

    // Use PDF metadata first, then explicit visual indicators as fallback
    // Remove name-based guessing as it overrides PDF author's intent
    const finalRequired = isRequired || hasExplicitIndicator;

    // Debug logging
    if (fieldName) {
      console.log(`🔍 Field "${fieldName}":`, {
        fieldFlags,
        isRequired,
        hasExplicitIndicator,
        finalRequired
      });
    }

    return finalRequired;
  }

  /**
   * Extract field value based on field type
   */
  private getFieldValue(
    annotation: any,
    fieldType: FormField['type']
  ): string | boolean | undefined {
    if (annotation.fieldValue === undefined) return undefined;

    switch (fieldType) {
      case 'checkbox':
      case 'radio':
        return Boolean(annotation.fieldValue);
      case 'text':
      case 'dropdown':
      case 'signature':
        return String(annotation.fieldValue);
      default:
        return annotation.fieldValue;
    }
  }

  /**
   * Add type-specific properties to form field
   */
  private enhanceFieldProperties(field: FormField, annotation: any): void {
    switch (field.type) {
      case 'text':
        field.maxLength = annotation.maxLen || undefined;
        field.multiLine = annotation.multiLine || false;
        field.placeholder = annotation.alternativeText || undefined;

        // Add email validation for email fields
        if (field.name.toLowerCase().includes('email')) {
          field.validation = {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          };
        }
        break;

      case 'dropdown':
        field.options = annotation.options || [];
        break;

      case 'signature':
        field.placeholder = 'Click to sign';
        break;
    }
  }

  /**
   * Get all required fields across all pages
   */
  getRequiredFields(allPageFields: PageFormFields[]): FormField[] {
    const requiredFields: FormField[] = [];

    for (const pageFields of allPageFields) {
      for (const field of pageFields.fields) {
        if (field.required && !field.readOnly) {
          requiredFields.push(field);
        }
      }
    }

    return requiredFields;
  }

  /**
   * Get all fields of a specific type across all pages
   */
  getFieldsByType(
    allPageFields: PageFormFields[],
    fieldType: FormField['type']
  ): FormField[] {
    const fieldsOfType: FormField[] = [];

    for (const pageFields of allPageFields) {
      for (const field of pageFields.fields) {
        if (field.type === fieldType) {
          fieldsOfType.push(field);
        }
      }
    }

    return fieldsOfType;
  }

  /**
   * Find field by ID across all pages
   */
  findFieldById(
    allPageFields: PageFormFields[],
    fieldId: string
  ): FormField | null {
    for (const pageFields of allPageFields) {
      for (const field of pageFields.fields) {
        if (field.id === fieldId) {
          return field;
        }
      }
    }
    return null;
  }

  /**
   * Validate all form fields
   */
  validateFormData(
    allPageFields: PageFormFields[],
    formData: Record<string, any>
  ): FormValidationResult {
    const errors: { fieldId: string; message: string }[] = [];
    const missingRequired: string[] = [];

    for (const pageFields of allPageFields) {
      for (const field of pageFields.fields) {
        // Skip read-only fields from validation
        if (field.readOnly) continue;

        const value = formData[field.id];

        // Check required fields
        if (
          field.required &&
          (value === undefined || value === null || value === '')
        ) {
          missingRequired.push(field.id);
          continue;
        }

        // Skip validation if field is empty and not required
        if (
          !field.required &&
          (value === undefined || value === null || value === '')
        ) {
          continue;
        }

        // Validate field-specific constraints
        const fieldErrors = this.validateField(field, value);
        errors.push(...fieldErrors);
      }
    }

    return {
      isValid: errors.length === 0 && missingRequired.length === 0,
      errors,
      missingRequired,
    };
  }

  /**
   * Validate individual field based on its constraints
   */
  private validateField(
    field: FormField,
    value: any
  ): { fieldId: string; message: string }[] {
    const errors: { fieldId: string; message: string }[] = [];

    switch (field.type) {
      case 'text':
        if (typeof value === 'string') {
          // Check max length
          if (field.maxLength && value.length > field.maxLength) {
            errors.push({
              fieldId: field.id,
              message: `Text exceeds maximum length of ${field.maxLength} characters`,
            });
          }

          // Check validation pattern
          if (
            field.validation?.pattern &&
            !field.validation.pattern.test(value)
          ) {
            errors.push({
              fieldId: field.id,
              message: field.validation.message || 'Invalid format',
            });
          }
        }
        break;

      case 'dropdown':
        if (
          field.options &&
          field.options.length > 0 &&
          !field.options.includes(String(value))
        ) {
          errors.push({
            fieldId: field.id,
            message: 'Selected value is not a valid option',
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Transform PDF coordinates to viewport coordinates
   */
  transformCoordinates(
    rect: number[],
    viewport: any
  ): { x: number; y: number; width: number; height: number } {
    const [x1, y1, x2, y2] = rect;

    // PDF coordinates start from bottom-left, viewport from top-left
    const x = Math.min(x1, x2);
    const y = viewport.height - Math.max(y1, y2); // Flip Y coordinate
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    return { x, y, width, height };
  }

  /**
   * Setup event listeners on PDF.js annotation layer elements
   */
  setupAnnotationLayerListeners(
    annotationLayer: HTMLDivElement,
    onFieldFocus: (fieldId: string) => void,
    onFieldChange: (fieldId: string, value: any) => void,
    onFieldBlur: (fieldId: string) => void
  ): void {
    // Listen for focus events on form elements
    annotationLayer.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      const fieldElement = this.findFormFieldElement(target);
      if (fieldElement) {
        const fieldId = this.getFieldIdFromElement(fieldElement);
        if (fieldId) {
          onFieldFocus(fieldId);
        }
      }
    });

    // Listen for change events on form elements
    annotationLayer.addEventListener('change', (event) => {
      const target = event.target as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;
      const fieldElement = this.findFormFieldElement(target);
      if (fieldElement) {
        const fieldId = this.getFieldIdFromElement(fieldElement);
        if (fieldId) {
          const value = this.getElementValue(target);
          onFieldChange(fieldId, value);
        }
      }
    });

    // Listen for input events for real-time updates
    annotationLayer.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const fieldElement = this.findFormFieldElement(target);
      if (fieldElement) {
        const fieldId = this.getFieldIdFromElement(fieldElement);
        if (fieldId) {
          const value = target.value;
          onFieldChange(fieldId, value);
        }
      }
    });

    // Listen for blur events
    annotationLayer.addEventListener('focusout', (event) => {
      const target = event.target as HTMLElement;
      const fieldElement = this.findFormFieldElement(target);
      if (fieldElement) {
        const fieldId = this.getFieldIdFromElement(fieldElement);
        if (fieldId) {
          onFieldBlur(fieldId);
        }
      }
    });
  }

  /**
   * Find the form field element from an event target
   */
  private findFormFieldElement(element: HTMLElement): HTMLElement | null {
    let current = element;
    while (current && current !== document.body) {
      if (
        current.classList.contains('formFieldAnnotation') ||
        current.hasAttribute('data-field-id') ||
        current.tagName === 'INPUT' ||
        current.tagName === 'SELECT' ||
        current.tagName === 'TEXTAREA'
      ) {
        return current;
      }
      current = current.parentElement as HTMLElement;
    }
    return null;
  }

  /**
   * Extract field ID from PDF.js annotation element
   */
  private getFieldIdFromElement(element: HTMLElement): string | null {
    return (
      element.getAttribute('data-field-id') ||
      element.getAttribute('name') ||
      element.id ||
      null
    );
  }

  /**
   * Get value from form element based on its type
   */
  private getElementValue(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  ): any {
    switch (element.type) {
      case 'checkbox':
      case 'radio':
        return (element as HTMLInputElement).checked;
      case 'select-one':
      case 'select-multiple':
        return (element as HTMLSelectElement).value;
      default:
        return element.value;
    }
  }

  /**
   * Focus on a specific form field by ID
   */
  focusFieldById(annotationLayer: HTMLDivElement, fieldId: string): boolean {
    const fieldElement = this.findFieldElementById(annotationLayer, fieldId);
    if (fieldElement && fieldElement instanceof HTMLElement) {
      fieldElement.focus();
      fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
    return false;
  }

  /**
   * Find form field element by field ID
   */
  private findFieldElementById(
    annotationLayer: HTMLDivElement,
    fieldId: string
  ): HTMLElement | null {
    // Try different ways to find the element
    let element = annotationLayer.querySelector(
      `[data-field-id="${fieldId}"]`
    ) as HTMLElement;
    if (!element) {
      element = annotationLayer.querySelector(
        `[name="${fieldId}"]`
      ) as HTMLElement;
    }
    if (!element) {
      element = annotationLayer.querySelector(`#${fieldId}`) as HTMLElement;
    }
    return element;
  }

  /**
   * Highlight a form field by adding CSS class
   */
  highlightField(
    annotationLayer: HTMLDivElement,
    fieldId: string,
    highlightClass: string = 'field-highlighted'
  ): void {
    // Remove previous highlights
    const previousHighlighted = annotationLayer.querySelectorAll(
      `.${highlightClass}`
    );
    previousHighlighted.forEach((el) => el.classList.remove(highlightClass));

    // Add highlight to current field
    const fieldElement = this.findFieldElementById(annotationLayer, fieldId);
    if (fieldElement) {
      fieldElement.classList.add(highlightClass);
    }
  }

  /**
   * Remove all field highlights
   */
  removeAllHighlights(
    annotationLayer: HTMLDivElement,
    highlightClass: string = 'field-highlighted'
  ): void {
    const highlighted = annotationLayer.querySelectorAll(`.${highlightClass}`);
    highlighted.forEach((el) => el.classList.remove(highlightClass));
  }
}

export const formFieldService = new FormFieldService();
