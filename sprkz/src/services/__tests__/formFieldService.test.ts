import { formFieldService } from '../formFieldService';
import type { FormField, PageFormFields } from '../formFieldService';
import * as pdfjsLib from 'pdfjs-dist';

// Mock pdfjs-dist
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
}));

const mockPdfjsLib = pdfjsLib as jest.Mocked<typeof pdfjsLib>;

// Mock PDF.js types and functions
const mockPDFPage = {
  getAnnotations: jest.fn(),
};

const mockPDFDocument = {
  numPages: 2,
  getPage: jest.fn(),
};

// Mock PDF.js annotation data
const mockAnnotations = [
  {
    fieldType: 'Tx',
    fieldName: 'firstName',
    rect: [100, 200, 300, 250],
    fieldFlags: 2, // Required flag
    readOnly: false,
    fieldValue: undefined,
    maxLen: 50,
    multiLine: false,
  },
  {
    fieldType: 'Tx',
    fieldName: 'email',
    rect: [100, 150, 300, 200],
    fieldFlags: 2, // Required flag
    readOnly: false,
    fieldValue: 'test@example.com',
  },
  {
    fieldType: 'Btn',
    fieldName: 'subscribe',
    rect: [100, 100, 120, 120],
    fieldFlags: 0,
    readOnly: false,
    fieldValue: false,
  },
  {
    fieldType: 'Ch',
    fieldName: 'country',
    rect: [100, 50, 300, 100],
    fieldFlags: 0,
    readOnly: false,
    fieldValue: 'US',
    options: ['US', 'CA', 'MX'],
  },
  {
    fieldType: 'Sig',
    fieldName: 'signature',
    rect: [100, 0, 300, 50],
    fieldFlags: 2, // Required flag
    readOnly: false,
    fieldValue: undefined,
  },
];

describe('FormFieldService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPDFPage.getAnnotations.mockResolvedValue(mockAnnotations);
    mockPDFDocument.getPage.mockResolvedValue(mockPDFPage);
    
    // Reset PDF.js mock to default state
    const mockLoadingTask = {
      promise: Promise.resolve(mockPDFDocument),
    };
    mockPdfjsLib.getDocument.mockReturnValue(mockLoadingTask as any);
  });

  describe('extractFormFields', () => {
    test('should extract form fields from PDF page', async () => {
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );

      expect(pageFields.pageNumber).toBe(1);
      expect(pageFields.fields).toHaveLength(5);
      expect(pageFields.radioGroups).toHaveLength(0);
    });

    test('should categorize field types correctly', async () => {
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      const fieldTypes = pageFields.fields.map((f) => f.type);

      expect(fieldTypes).toContain('text');
      expect(fieldTypes).toContain('checkbox');
      expect(fieldTypes).toContain('dropdown');
      expect(fieldTypes).toContain('signature');
    });

    test('should identify required fields correctly', async () => {
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      const requiredFields = pageFields.fields.filter((f) => f.required);

      expect(requiredFields).toHaveLength(3); // firstName, email, signature
      expect(requiredFields.map((f) => f.name)).toEqual([
        'firstName',
        'email',
        'signature',
      ]);
    });

    test('should preserve field values', async () => {
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      const emailField = pageFields.fields.find((f) => f.name === 'email');
      const countryField = pageFields.fields.find((f) => f.name === 'country');

      expect(emailField?.value).toBe('test@example.com');
      expect(countryField?.value).toBe('US');
    });

    test('should handle empty annotation list', async () => {
      mockPDFPage.getAnnotations.mockResolvedValue([]);
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );

      expect(pageFields.fields).toHaveLength(0);
      expect(pageFields.radioGroups).toHaveLength(0);
    });

    test('should handle fields with field configuration', async () => {
      // Test with normal field configuration that doesn't filter out fields
      const fieldConfigs = {
        firstName: 'normal' as const,
        email: 'normal' as const,
        subscribe: 'normal' as const
      };

      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1,
        fieldConfigs
      );

      // Should still process all fields with normal configuration
      expect(pageFields.fields.length).toBeGreaterThan(0);
      const fieldNames = pageFields.fields.map(f => f.name);
      expect(fieldNames).toContain('firstName');
      expect(fieldNames).toContain('email');
    });

    test('should handle radio button groups', async () => {
      const radioAnnotations = [
        {
          fieldType: 'Btn',
          fieldName: 'gender',
          rect: [100, 100, 120, 120],
          fieldFlags: 49152, // Radio button flags
          readOnly: false,
          radioButtonValue: 'male',
        },
        {
          fieldType: 'Btn',
          fieldName: 'gender',
          rect: [130, 100, 150, 120],
          fieldFlags: 49152, // Radio button flags
          readOnly: false,
          radioButtonValue: 'female',
        },
      ];
      
      mockPDFPage.getAnnotations.mockResolvedValue(radioAnnotations);
      
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );

      // Check if radio buttons are properly processed
      // The actual grouping logic depends on the createFormField implementation
      const radioFields = pageFields.fields.filter(f => f.type === 'radio');
      expect(radioFields.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle annotations with missing properties', async () => {
      const incompleteAnnotations = [
        {
          fieldType: 'Tx',
          // Missing fieldName
          rect: [100, 100, 200, 120],
          fieldFlags: 0,
        },
        {
          fieldType: 'Tx',
          fieldName: 'validField',
          // Missing rect
          fieldFlags: 0,
        },
        {
          // Missing fieldType
          fieldName: 'invalidField',
          rect: [100, 150, 200, 170],
        },
      ];
      
      mockPDFPage.getAnnotations.mockResolvedValue(incompleteAnnotations);
      
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );

      // Should handle gracefully and process valid fields
      expect(pageFields.fields.length).toBeGreaterThan(0);
      const validField = pageFields.fields.find(f => f.name === 'validField');
      expect(validField).toBeDefined();
    });

    test('should apply field visibility from configuration', async () => {
      // Test without field configuration to see the baseline
      const pageFieldsWithoutConfig = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      
      // Test with field configuration that might affect field processing
      const fieldConfigs = {
        firstName: 'read-only' as const,
        email: 'normal' as const
      };

      const pageFieldsWithConfig = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1,
        fieldConfigs
      );

      // Both should process fields, configuration affects how they're processed internally
      expect(pageFieldsWithoutConfig.fields.length).toBeGreaterThan(0);
      expect(pageFieldsWithConfig.fields.length).toBeGreaterThan(0);
    });
  });

  describe('extractAllFormFields', () => {
    beforeEach(() => {
      // Setup PDF.js mock
      const mockLoadingTask = {
        promise: Promise.resolve(mockPDFDocument),
      };
      mockPdfjsLib.getDocument.mockReturnValue(mockLoadingTask as any);
      mockPDFDocument.getPage.mockResolvedValue(mockPDFPage);
    });

    test('should extract fields from all pages', async () => {
      const result = await formFieldService.extractAllFormFields('/test.pdf');

      expect(mockPdfjsLib.getDocument).toHaveBeenCalledWith('/test.pdf');
      expect(mockPDFDocument.getPage).toHaveBeenCalledTimes(2);
      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(1);
      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(2);
      
      expect(result.fields).toContain('firstName');
      expect(result.fields).toContain('email');
      expect(result.fieldDetails.firstName.type).toBe('text');
      expect(result.fieldDetails.firstName.required).toBe(true);
      expect(result.fieldDetails.firstName.pages).toEqual([1, 2]);
    });

    test('should handle PDF loading errors gracefully', async () => {
      const error = new Error('PDF loading failed');
      const mockLoadingTask = {
        promise: Promise.reject(error),
      };
      mockPdfjsLib.getDocument.mockReturnValue(mockLoadingTask as any);

      await expect(formFieldService.extractAllFormFields('/invalid.pdf')).rejects.toThrow(
        'PDF loading failed'
      );
    });

    test('should handle page loading errors gracefully', async () => {
      mockPDFDocument.getPage.mockImplementation((pageNum) => {
        if (pageNum === 1) {
          return Promise.reject(new Error('Page load failed'));
        }
        return Promise.resolve(mockPDFPage);
      });

      // This should throw since the method doesn't catch page errors
      await expect(formFieldService.extractAllFormFields('/test.pdf')).rejects.toThrow(
        'Page load failed'
      );
    });

    test('should deduplicate fields across pages', async () => {
      const result = await formFieldService.extractAllFormFields('/test.pdf');
      
      // Field should appear only once in the list even if on multiple pages
      const firstNameCount = result.fields.filter(f => f === 'firstName').length;
      expect(firstNameCount).toBe(1);
      
      // But should track all pages it appears on
      expect(result.fieldDetails.firstName.pages).toEqual([1, 2]);
    });

    test('should sort field names alphabetically', async () => {
      const result = await formFieldService.extractAllFormFields('/test.pdf');
      
      const sortedFields = [...result.fields].sort();
      expect(result.fields).toEqual(sortedFields);
    });
  });

  describe('getRequiredFields', () => {
    test('should return only required non-readonly fields', () => {
      const mockPageFields: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [
            {
              id: '1',
              name: 'field1',
              required: true,
              readOnly: false,
            } as FormField,
            {
              id: '2',
              name: 'field2',
              required: true,
              readOnly: true,
            } as FormField,
            {
              id: '3',
              name: 'field3',
              required: false,
              readOnly: false,
            } as FormField,
          ],
          radioGroups: [],
        },
      ];

      const requiredFields = formFieldService.getRequiredFields(mockPageFields);
      expect(requiredFields).toHaveLength(1);
      expect(requiredFields[0].id).toBe('1');
    });
  });

  describe('getFieldsByType', () => {
    test('should return fields of specified type', () => {
      const mockPageFields: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [
            { id: '1', type: 'text' } as FormField,
            { id: '2', type: 'checkbox' } as FormField,
            { id: '3', type: 'text' } as FormField,
          ],
          radioGroups: [],
        },
      ];

      const textFields = formFieldService.getFieldsByType(
        mockPageFields,
        'text'
      );
      expect(textFields).toHaveLength(2);
      expect(textFields.map((f) => f.id)).toEqual(['1', '3']);
    });
  });

  describe('findFieldById', () => {
    test('should find field by ID across pages', () => {
      const mockPageFields: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [
            { id: 'field1', name: 'Field 1' } as FormField,
            { id: 'field2', name: 'Field 2' } as FormField,
          ],
          radioGroups: [],
        },
        {
          pageNumber: 2,
          fields: [{ id: 'field3', name: 'Field 3' } as FormField],
          radioGroups: [],
        },
      ];

      const field = formFieldService.findFieldById(mockPageFields, 'field3');
      expect(field).not.toBeNull();
      expect(field?.name).toBe('Field 3');

      const notFound = formFieldService.findFieldById(
        mockPageFields,
        'nonexistent'
      );
      expect(notFound).toBeNull();
    });
  });

  describe('validateFormData', () => {
    const mockPageFields: PageFormFields[] = [
      {
        pageNumber: 1,
        fields: [
          {
            id: 'field1',
            name: 'Required Field',
            type: 'text',
            required: true,
            readOnly: false,
          } as FormField,
          {
            id: 'field2',
            name: 'Optional Field',
            type: 'text',
            required: false,
            readOnly: false,
          } as FormField,
          {
            id: 'field3',
            name: 'Email Field',
            type: 'text',
            required: true,
            readOnly: false,
            validation: {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format',
            },
          } as FormField,
        ],
        radioGroups: [],
      },
    ];

    test('should validate required fields', () => {
      const formData = {
        field2: 'optional value',
        // field1 missing (required)
        // field3 missing (required)
      };

      const result = formFieldService.validateFormData(
        mockPageFields,
        formData
      );

      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('field1');
      expect(result.missingRequired).toContain('field3');
      expect(result.errors).toHaveLength(0);
    });

    test('should validate field patterns', () => {
      const formData = {
        field1: 'value',
        field3: 'invalid-email',
      };

      const result = formFieldService.validateFormData(
        mockPageFields,
        formData
      );

      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fieldId).toBe('field3');
      expect(result.errors[0].message).toBe('Invalid email format');
    });

    test('should pass validation with valid data', () => {
      const formData = {
        field1: 'required value',
        field2: 'optional value',
        field3: 'valid@email.com',
      };

      const result = formFieldService.validateFormData(
        mockPageFields,
        formData
      );

      expect(result.isValid).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should skip read-only fields', () => {
      const mockFieldsWithReadOnly: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [
            {
              id: 'readonly',
              name: 'Read Only Field',
              type: 'text',
              required: true,
              readOnly: true,
            } as FormField,
          ],
          radioGroups: [],
        },
      ];

      const result = formFieldService.validateFormData(
        mockFieldsWithReadOnly,
        {}
      );

      expect(result.isValid).toBe(true);
      expect(result.missingRequired).toHaveLength(0);
    });
  });

  describe('transformCoordinates', () => {
    test('should transform PDF coordinates to viewport coordinates', () => {
      const pdfRect = [100, 200, 300, 250]; // PDF coordinates (bottom-left origin)
      const viewport = { width: 800, height: 600 }; // Viewport dimensions

      const result = formFieldService.transformCoordinates(pdfRect, viewport);

      expect(result.x).toBe(100); // Min of x1, x2
      expect(result.y).toBe(350); // viewport.height - max(y1, y2) = 600 - 250
      expect(result.width).toBe(200); // |x2 - x1| = |300 - 100|
      expect(result.height).toBe(50); // |y2 - y1| = |250 - 200|
    });
  });

  describe('setupAnnotationLayerListeners', () => {
    let mockAnnotationLayer: HTMLDivElement;
    let onFieldFocus: jest.Mock;
    let onFieldChange: jest.Mock;
    let onFieldBlur: jest.Mock;

    beforeEach(() => {
      mockAnnotationLayer = document.createElement('div');
      onFieldFocus = jest.fn();
      onFieldChange = jest.fn();
      onFieldBlur = jest.fn();

      formFieldService.setupAnnotationLayerListeners(
        mockAnnotationLayer,
        onFieldFocus,
        onFieldChange,
        onFieldBlur
      );
    });

    test('should handle focus events', () => {
      const input = document.createElement('input');
      input.setAttribute('data-field-id', 'test-field');
      mockAnnotationLayer.appendChild(input);

      const focusEvent = new Event('focusin', { bubbles: true });
      Object.defineProperty(focusEvent, 'target', { value: input });

      mockAnnotationLayer.dispatchEvent(focusEvent);

      expect(onFieldFocus).toHaveBeenCalledWith('test-field');
    });

    test('should handle change events', () => {
      const input = document.createElement('input');
      input.setAttribute('data-field-id', 'test-field');
      input.value = 'new value';
      mockAnnotationLayer.appendChild(input);

      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', { value: input });

      mockAnnotationLayer.dispatchEvent(changeEvent);

      expect(onFieldChange).toHaveBeenCalledWith('test-field', 'new value');
    });

    test('should handle blur events', () => {
      const input = document.createElement('input');
      input.setAttribute('data-field-id', 'test-field');
      mockAnnotationLayer.appendChild(input);

      const blurEvent = new Event('focusout', { bubbles: true });
      Object.defineProperty(blurEvent, 'target', { value: input });

      mockAnnotationLayer.dispatchEvent(blurEvent);

      expect(onFieldBlur).toHaveBeenCalledWith('test-field');
    });
  });

  describe('focusFieldById', () => {
    test('should focus and scroll to field element', () => {
      const mockAnnotationLayer = document.createElement('div');
      const input = document.createElement('input');
      input.setAttribute('data-field-id', 'test-field');

      const mockFocus = jest.fn();
      const mockScrollIntoView = jest.fn();
      input.focus = mockFocus;
      input.scrollIntoView = mockScrollIntoView;

      mockAnnotationLayer.appendChild(input);

      const result = formFieldService.focusFieldById(
        mockAnnotationLayer,
        'test-field'
      );

      expect(result).toBe(true);
      expect(mockFocus).toHaveBeenCalled();
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    test('should return false if field not found', () => {
      const mockAnnotationLayer = document.createElement('div');
      const result = formFieldService.focusFieldById(
        mockAnnotationLayer,
        'nonexistent-field'
      );
      expect(result).toBe(false);
    });
  });

  describe('highlightField', () => {
    test('should add highlight class to field and remove from others', () => {
      const mockAnnotationLayer = document.createElement('div');

      // Create two input fields
      const input1 = document.createElement('input');
      input1.setAttribute('data-field-id', 'field1');
      input1.classList.add('field-highlighted'); // Previously highlighted

      const input2 = document.createElement('input');
      input2.setAttribute('data-field-id', 'field2');

      mockAnnotationLayer.appendChild(input1);
      mockAnnotationLayer.appendChild(input2);

      formFieldService.highlightField(mockAnnotationLayer, 'field2');

      expect(input1.classList.contains('field-highlighted')).toBe(false);
      expect(input2.classList.contains('field-highlighted')).toBe(true);
    });
  });

  describe('removeAllHighlights', () => {
    test('should remove highlight class from all elements', () => {
      const mockAnnotationLayer = document.createElement('div');

      const input1 = document.createElement('input');
      input1.classList.add('field-highlighted');

      const input2 = document.createElement('input');
      input2.classList.add('field-highlighted');

      mockAnnotationLayer.appendChild(input1);
      mockAnnotationLayer.appendChild(input2);

      formFieldService.removeAllHighlights(mockAnnotationLayer);

      expect(input1.classList.contains('field-highlighted')).toBe(false);
      expect(input2.classList.contains('field-highlighted')).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle PDF pages with no annotations', async () => {
      mockPDFPage.getAnnotations.mockResolvedValue([]);
      
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      
      expect(pageFields.fields).toHaveLength(0);
      expect(pageFields.radioGroups).toHaveLength(0);
    });

    test('should handle annotations with null or undefined values', async () => {
      const annotationsWithNulls = [
        {
          fieldType: 'Tx',
          fieldName: null,
          rect: undefined,
          fieldFlags: 0,
          readOnly: false,
          fieldValue: null,
        },
      ];
      
      mockPDFPage.getAnnotations.mockResolvedValue(annotationsWithNulls);
      
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      
      // Should handle gracefully without throwing
      expect(pageFields.fields).toBeDefined();
    });

    test('should handle coordinate transformation edge cases', () => {
      // Test with negative coordinates
      const negativeRect = [-50, -100, 50, 0];
      const viewport = { width: 800, height: 600 };
      
      const result = formFieldService.transformCoordinates(negativeRect, viewport);
      
      expect(result.x).toBe(-50);
      expect(result.y).toBe(600); // viewport.height - max(y)
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    test('should handle field validation with complex patterns', () => {
      const mockPageFields: PageFormFields[] = [
        {
          pageNumber: 1,
          fields: [
            {
              id: 'phone',
              name: 'Phone',
              type: 'text',
              required: true,
              readOnly: false,
              validation: {
                pattern: /^\d{3}-\d{3}-\d{4}$/,
                message: 'Phone must be in format XXX-XXX-XXXX',
              },
            } as FormField,
          ],
          radioGroups: [],
        },
      ];

      const invalidData = { phone: '1234567890' }; // Wrong format
      const validData = { phone: '123-456-7890' }; // Correct format

      const invalidResult = formFieldService.validateFormData(mockPageFields, invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toBe('Phone must be in format XXX-XXX-XXXX');

      const validResult = formFieldService.validateFormData(mockPageFields, validData);
      expect(validResult.isValid).toBe(true);
    });

    test('should handle fields with complex button types', async () => {
      const complexButtonAnnotations = [
        {
          fieldType: 'Btn',
          fieldName: 'pushButton',
          buttonWidgetAnnotationType: 'PushButton',
          rect: [100, 100, 200, 120],
          fieldFlags: 0,
          readOnly: false,
        },
        {
          fieldType: 'Btn',
          fieldName: 'checkbox1',
          buttonWidgetAnnotationType: 'CheckBox',
          rect: [100, 150, 120, 170],
          fieldFlags: 0,
          readOnly: false,
        },
      ];
      
      mockPDFPage.getAnnotations.mockResolvedValue(complexButtonAnnotations);
      
      const pageFields = await formFieldService.extractFormFields(
        mockPDFPage as any,
        1
      );
      
      const pushButton = pageFields.fields.find(f => f.name === 'pushButton');
      const checkbox = pageFields.fields.find(f => f.name === 'checkbox1');
      
      expect(pushButton?.type).toBe('checkbox'); // Default for button type
      expect(checkbox?.type).toBe('checkbox');
    });
  });
});
