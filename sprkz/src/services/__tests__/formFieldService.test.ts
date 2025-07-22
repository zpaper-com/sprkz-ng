import { formFieldService } from '../formFieldService';
import type { FormField, PageFormFields } from '../formFieldService';

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
  });

  describe('extractAllFormFields', () => {
    test('should extract fields from all pages', async () => {
      const allPageFields = await formFieldService.extractAllFormFields(
        mockPDFDocument as any
      );

      expect(allPageFields).toHaveLength(2);
      expect(mockPDFDocument.getPage).toHaveBeenCalledTimes(2);
      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(1);
      expect(mockPDFDocument.getPage).toHaveBeenCalledWith(2);
    });

    test('should handle errors gracefully', async () => {
      mockPDFDocument.getPage.mockRejectedValueOnce(
        new Error('Page load failed')
      );
      const allPageFields = await formFieldService.extractAllFormFields(
        mockPDFDocument as any
      );

      expect(allPageFields).toHaveLength(2);
      expect(allPageFields[0].fields).toHaveLength(0); // Failed page
      expect(allPageFields[1].fields).toHaveLength(5); // Successful page
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
});
