import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFButton, rgb } from 'pdf-lib';
import * as Sentry from '@sentry/react';
import { FormField } from '../types/pdf';
import { SignatureService } from './signatureService';
import { SignatureData } from '../components/signature/SignatureModal';
import { ValidationService } from './validationService';

export interface PDFGenerationOptions {
  includeSignatures?: boolean;
  preserveFormFields?: boolean;
  flattenForm?: boolean;
  quality?: number;
  validateBeforeGeneration?: boolean;
}

export interface FormSubmissionData {
  formData: Record<string, any>;
  signatures: Record<string, SignatureData>;
  metadata: {
    completedAt: number;
    totalFields: number;
    requiredFields: number;
    completedFields: number;
    validationPassed: boolean;
  };
}

export interface GeneratedPDFResult {
  pdfBytes: Uint8Array;
  formData: FormSubmissionData;
  success: boolean;
  errors: string[];
  warnings: string[];
}

export class PDFGenerationService {
  private static readonly SUPPORTED_FIELD_TYPES = [
    'text', 'checkbox', 'radio', 'dropdown', 'signature'
  ];

  /**
   * Generate a completed PDF with form data and signatures
   */
  static async generateCompletedPDF(
    originalPdfBytes: Uint8Array,
    formFields: FormField[],
    formValues: Record<string, any>,
    signatures: Record<string, SignatureData> = {},
    options: PDFGenerationOptions = {}
  ): Promise<GeneratedPDFResult> {
    const startTime = performance.now();
    
    try {
      const {
        includeSignatures = true,
        preserveFormFields = false,
        flattenForm = true,
        quality = 0.9,
        validateBeforeGeneration = true
      } = options;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Pre-generation validation
      if (validateBeforeGeneration) {
        const validationResult = await this.validateFormData(formFields, formValues, signatures);
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
        
        if (validationResult.errors.length > 0) {
          return {
            pdfBytes: new Uint8Array(),
            formData: this.createFormSubmissionData(formFields, formValues, signatures),
            success: false,
            errors,
            warnings
          };
        }
      }

      // Load the original PDF
      console.log('Loading original PDF for form generation...');
      const pdfDoc = await PDFDocument.load(originalPdfBytes);
      const form = pdfDoc.getForm();
      
      // Get form fields from PDF
      const pdfFields = form.getFields();
      console.log(`Found ${pdfFields.length} form fields in PDF`);

      // Process each form field
      for (const formField of formFields) {
        try {
          await this.processFormField(form, formField, formValues[formField.name], warnings);
        } catch (fieldError) {
          const errorMessage = `Failed to process field "${formField.name}": ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`;
          errors.push(errorMessage);
          console.error(errorMessage, fieldError);
        }
      }

      // Embed signatures
      if (includeSignatures && Object.keys(signatures).length > 0) {
        console.log(`Embedding ${Object.keys(signatures).length} signatures...`);
        
        for (const [fieldName, signatureData] of Object.entries(signatures)) {
          const signatureField = formFields.find(f => f.name === fieldName);
          
          if (signatureField) {
            try {
              const embedOptions = SignatureService.getSignatureFieldDimensions(signatureField);
              const pdfBytesWithSignature = await SignatureService.embedSignatureInPDF(
                await pdfDoc.save(),
                signatureData,
                embedOptions
              );
              
              // Reload PDF with embedded signature
              const updatedPdf = await PDFDocument.load(pdfBytesWithSignature);
              const copiedPages = await pdfDoc.copyPages(updatedPdf, updatedPdf.getPageIndices());
              copiedPages.forEach((page, index) => {
                if (index < pdfDoc.getPageCount()) {
                  // Replace existing page
                  pdfDoc.removePage(index);
                  pdfDoc.insertPage(index, page);
                } else {
                  pdfDoc.addPage(page);
                }
              });
              
            } catch (signatureError) {
              const errorMessage = `Failed to embed signature for field "${fieldName}": ${signatureError instanceof Error ? signatureError.message : 'Unknown error'}`;
              errors.push(errorMessage);
              console.error(errorMessage, signatureError);
            }
          } else {
            warnings.push(`Signature field "${fieldName}" not found in form fields`);
          }
        }
      }

      // Flatten form if requested
      if (flattenForm && !preserveFormFields) {
        try {
          form.flatten();
          console.log('Form fields flattened successfully');
        } catch (flattenError) {
          warnings.push('Failed to flatten form fields, form will remain interactive');
          console.warn('Form flattening failed:', flattenError);
        }
      }

      // Generate final PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false, // Better compatibility
        addDefaultPage: false
      });

      const duration = performance.now() - startTime;
      console.log(`PDF generation completed in ${duration.toFixed(2)}ms`);

      // Performance monitoring
      if (duration > 5000) { // 5 second threshold
        Sentry.addBreadcrumb({
          message: 'Slow PDF generation detected',
          data: {
            duration: duration,
            fieldsCount: formFields.length,
            signaturesCount: Object.keys(signatures).length,
            pdfSize: pdfBytes.length
          },
          level: 'warning'
        });
      }

      return {
        pdfBytes,
        formData: this.createFormSubmissionData(formFields, formValues, signatures),
        success: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('PDF generation failed:', error);
      
      Sentry.captureException(error, {
        tags: {
          component: 'PDFGenerationService',
          operation: 'generateCompletedPDF'
        },
        contexts: {
          formData: {
            fieldsCount: formFields.length,
            signaturesCount: Object.keys(signatures).length
          }
        }
      });

      return {
        pdfBytes: new Uint8Array(),
        formData: this.createFormSubmissionData(formFields, formValues, signatures),
        success: false,
        errors: [`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Process a single form field
   */
  private static async processFormField(
    form: PDFForm,
    formField: FormField,
    value: any,
    warnings: string[]
  ): Promise<void> {
    if (!value && value !== false && value !== 0) {
      return; // Skip empty values
    }

    try {
      const pdfField = form.getField(formField.name);
      
      switch (formField.type) {
        case 'text':
        case 'date':
          if (pdfField instanceof PDFTextField) {
            const textValue = String(value || '').substring(0, pdfField.getMaxLength() || 1000);
            pdfField.setText(textValue);
            
            // Set appearance if needed - skip this for now as it requires specific font objects
            // try {
            //   pdfField.updateAppearances();
            // } catch (appearanceError) {
            //   console.warn(`Failed to update appearance for text field "${formField.name}":`, appearanceError);
            // }
          }
          break;

        case 'checkbox':
          if (pdfField instanceof PDFCheckBox) {
            const isChecked = value === true || value === 'true' || value === 'on' || value === 1;
            if (isChecked) {
              pdfField.check();
            } else {
              pdfField.uncheck();
            }
          }
          break;

        case 'radio':
          if (pdfField instanceof PDFRadioGroup) {
            const selectedValue = String(value);
            const options = pdfField.getOptions();
            
            if (options.includes(selectedValue)) {
              pdfField.select(selectedValue);
            } else {
              warnings.push(`Radio option "${selectedValue}" not found for field "${formField.name}". Available options: ${options.join(', ')}`);
            }
          }
          break;

        case 'dropdown':
          if (pdfField instanceof PDFDropdown) {
            const selectedValue = String(value);
            const options = pdfField.getOptions();
            
            if (options.includes(selectedValue)) {
              pdfField.select(selectedValue);
            } else {
              warnings.push(`Dropdown option "${selectedValue}" not found for field "${formField.name}". Available options: ${options.join(', ')}`);
            }
          }
          break;

        case 'signature':
          // Signatures are handled separately in the main function
          break;

        default:
          warnings.push(`Unsupported field type "${formField.type}" for field "${formField.name}"`);
      }

    } catch (fieldError) {
      // Try to find field with different casing or partial match
      const allFieldNames = form.getFields().map(f => f.getName());
      const possibleMatch = allFieldNames.find(name => 
        name.toLowerCase() === formField.name.toLowerCase() ||
        name.includes(formField.name) ||
        formField.name.includes(name)
      );

      if (possibleMatch) {
        warnings.push(`Field "${formField.name}" not found, but similar field "${possibleMatch}" exists`);
      } else {
        warnings.push(`Field "${formField.name}" not found in PDF form`);
      }
      
      console.warn(`Failed to process field "${formField.name}":`, fieldError);
    }
  }

  /**
   * Validate form data before PDF generation
   */
  private static async validateFormData(
    formFields: FormField[],
    formValues: Record<string, any>,
    signatures: Record<string, SignatureData>
  ): Promise<{ errors: string[]; warnings: string[] }> {
    try {
      // Use ValidationService for comprehensive validation
      const submissionValidation = await ValidationService.validateFormSubmission(formFields, formValues);
      
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check submission readiness
      if (!submissionValidation.canSubmit) {
        errors.push('Form validation failed - not ready for submission');
        
        // Add specific field errors
        Object.entries(submissionValidation.errors).forEach(([fieldName, fieldErrors]) => {
          fieldErrors.forEach(error => {
            errors.push(`Field "${fieldName}": ${error}`);
          });
        });
      }

      // Add warnings
      Object.entries(submissionValidation.warnings).forEach(([fieldName, fieldWarnings]) => {
        fieldWarnings.forEach(warning => {
          warnings.push(`Field "${fieldName}": ${warning}`);
        });
      });

      // Validate signatures
      Object.entries(signatures).forEach(([fieldName, signatureData]) => {
        const validationErrors = SignatureService.validateSignatureData(signatureData);
        validationErrors.forEach(error => {
          errors.push(`Signature "${fieldName}": ${error}`);
        });
      });

      return { errors, warnings };

    } catch (validationError) {
      console.error('Form validation failed:', validationError);
      return {
        errors: ['Form validation failed due to an internal error'],
        warnings: []
      };
    }
  }

  /**
   * Create structured form submission data
   */
  private static createFormSubmissionData(
    formFields: FormField[],
    formValues: Record<string, any>,
    signatures: Record<string, SignatureData>
  ): FormSubmissionData {
    const requiredFields = formFields.filter(f => f.required && !f.readOnly);
    const completedFields = formFields.filter(f => {
      const value = formValues[f.name];
      return value !== null && value !== undefined && value !== '';
    });

    return {
      formData: { ...formValues },
      signatures: { ...signatures },
      metadata: {
        completedAt: Date.now(),
        totalFields: formFields.length,
        requiredFields: requiredFields.length,
        completedFields: completedFields.length,
        validationPassed: completedFields.length >= requiredFields.length
      }
    };
  }

  /**
   * Get form field information from PDF
   */
  static async analyzePDFForm(pdfBytes: Uint8Array): Promise<{
    fieldCount: number;
    supportedFields: number;
    unsupportedFields: string[];
    fieldTypes: Record<string, number>;
  }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      const fieldTypes: Record<string, number> = {};
      const unsupportedFields: string[] = [];
      let supportedCount = 0;

      fields.forEach(field => {
        const fieldType = this.getFieldType(field);
        fieldTypes[fieldType] = (fieldTypes[fieldType] || 0) + 1;

        if (this.SUPPORTED_FIELD_TYPES.includes(fieldType)) {
          supportedCount++;
        } else {
          unsupportedFields.push(`${field.getName()} (${fieldType})`);
        }
      });

      return {
        fieldCount: fields.length,
        supportedFields: supportedCount,
        unsupportedFields,
        fieldTypes
      };

    } catch (error) {
      console.error('Failed to analyze PDF form:', error);
      throw new Error(`PDF form analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get field type from PDF-lib field
   */
  private static getFieldType(field: any): string {
    if (field instanceof PDFTextField) return 'text';
    if (field instanceof PDFCheckBox) return 'checkbox';
    if (field instanceof PDFRadioGroup) return 'radio';
    if (field instanceof PDFDropdown) return 'dropdown';
    if (field instanceof PDFButton) return 'button';
    return 'unknown';
  }

  /**
   * Create a blank PDF for testing
   */
  static async createBlankPDF(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    
    page.drawText('Sprkz PDF Forms - Test Document', {
      x: 50,
      y: page.getHeight() - 50,
      size: 20,
      color: rgb(0, 0, 0)
    });

    return pdfDoc.save();
  }

  /**
   * Performance metrics for PDF generation
   */
  static getPerformanceMetrics(): {
    averageGenerationTime: number;
    totalGenerations: number;
    lastGeneration: number;
  } {
    // This would be enhanced with actual metrics tracking
    return {
      averageGenerationTime: 0,
      totalGenerations: 0,
      lastGeneration: 0
    };
  }
}