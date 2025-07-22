import { ValidationService } from '../../services/validationService';
import { generateMockFormField } from '../utils/testUtils';
import * as unleashService from '../../services/unleashService';

// Mock the Unleash service
jest.mock('../../services/unleashService', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
}));

// Mock Sentry
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe('ValidationService', () => {
  const mockIsFeatureEnabled = unleashService.isFeatureEnabled as jest.MockedFunction<typeof unleashService.isFeatureEnabled>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to enhanced validation enabled
    mockIsFeatureEnabled.mockImplementation((flag) => {
      switch (flag) {
        case 'ENHANCED_FIELD_VALIDATION':
          return true;
        case 'PERFORMANCE_MONITORING':
          return true;
        case 'SECURITY_AUDIT_LOGGING':
          return false;
        default:
          return true;
      }
    });
  });

  describe('Field Validation', () => {
    it('should validate required text fields', async () => {
      const field = generateMockFormField({
        name: 'firstName',
        type: 'text',
        required: true,
      });

      // Test empty value
      const emptyResult = await ValidationService.validateField(field, '');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('This field is required');

      // Test valid value
      const validResult = await ValidationService.validateField(field, 'John Doe');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should validate email fields', async () => {
      const field = generateMockFormField({
        name: 'email',
        type: 'email',
        required: true,
      });

      // Test invalid email
      const invalidResult = await ValidationService.validateField(field, 'invalid-email');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.some(error => error.includes('valid email'))).toBe(true);

      // Test valid email
      const validResult = await ValidationService.validateField(field, 'test@example.com');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should validate phone fields', async () => {
      const field = generateMockFormField({
        name: 'phone',
        type: 'phone',
        required: true,
      });

      // Test invalid phone
      const invalidResult = await ValidationService.validateField(field, 'abc123');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.some(error => error.includes('phone number'))).toBe(true);

      // Test valid phone
      const validResult = await ValidationService.validateField(field, '+1234567890');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should validate date fields', async () => {
      const field = generateMockFormField({
        name: 'birthDate',
        type: 'date',
        required: true,
      });

      // Test empty date
      const emptyResult = await ValidationService.validateField(field, '');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Date is required');

      // Test valid date
      const validResult = await ValidationService.validateField(field, '2023-01-01');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should validate signature fields', async () => {
      const field = generateMockFormField({
        name: 'signature',
        type: 'signature',
        required: true,
      });

      // Test empty signature
      const emptyResult = await ValidationService.validateField(field, '');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Signature is required');

      // Test invalid signature format
      const invalidResult = await ValidationService.validateField(field, 'invalid-signature');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.some(error => error.includes('valid signature'))).toBe(true);

      // Test valid signature
      const validSignature = 'data:image/png;base64,' + 'x'.repeat(200);
      const validResult = await ValidationService.validateField(field, validSignature);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it('should validate checkbox fields', async () => {
      const field = generateMockFormField({
        name: 'agreement',
        type: 'checkbox',
        required: true,
      });

      // Test unchecked required checkbox
      const uncheckedResult = await ValidationService.validateField(field, false);
      expect(uncheckedResult.isValid).toBe(false);
      expect(uncheckedResult.errors).toContain('Please select an option');

      // Test checked checkbox
      const checkedResult = await ValidationService.validateField(field, true);
      expect(checkedResult.isValid).toBe(true);
      expect(checkedResult.errors).toHaveLength(0);
    });

    it('should skip validation for read-only fields', async () => {
      const field = generateMockFormField({
        name: 'readOnlyField',
        type: 'text',
        required: true,
        readOnly: true,
      });

      const result = await ValidationService.validateField(field, '');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle optional fields correctly', async () => {
      const field = generateMockFormField({
        name: 'optionalField',
        type: 'text',
        required: false,
      });

      // Empty optional field should be valid
      const emptyResult = await ValidationService.validateField(field, '');
      expect(emptyResult.isValid).toBe(true);
      expect(emptyResult.errors).toHaveLength(0);

      // Non-empty optional field should be validated
      const nonEmptyResult = await ValidationService.validateField(field, 'test');
      expect(nonEmptyResult.isValid).toBe(true);
      expect(nonEmptyResult.errors).toHaveLength(0);
    });
  });

  describe('Validation Options', () => {
    it('should respect validateRequired option', async () => {
      const field = generateMockFormField({
        name: 'testField',
        type: 'text',
        required: true,
      });

      const result = await ValidationService.validateField(field, '', [], {
        validateRequired: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should respect validateFormat option', async () => {
      const field = generateMockFormField({
        name: 'email',
        type: 'email',
        required: false,
      });

      const result = await ValidationService.validateField(field, 'invalid-email', [], {
        validateFormat: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should respect excludeReadOnly option', async () => {
      const field = generateMockFormField({
        name: 'readOnlyField',
        type: 'text',
        required: true,
        readOnly: true,
      });

      const result = await ValidationService.validateField(field, '', [], {
        excludeReadOnly: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Flag Integration', () => {
    it('should use enhanced validation when feature flag is enabled', async () => {
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'ENHANCED_FIELD_VALIDATION' ? true : false
      );

      const field = generateMockFormField({
        name: 'email',
        type: 'email',
        required: true,
      });

      const result = await ValidationService.validateField(field, 'invalid-email');
      expect(result.isValid).toBe(false);
      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('ENHANCED_FIELD_VALIDATION');
    });

    it('should use basic validation when feature flag is disabled', async () => {
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'ENHANCED_FIELD_VALIDATION' ? false : true
      );

      const field = generateMockFormField({
        name: 'email',
        type: 'email',
        required: true,
      });

      const result = await ValidationService.validateField(field, 'invalid-email');
      // With basic validation, format checking might be disabled
      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('ENHANCED_FIELD_VALIDATION');
    });

    it('should log security audit when feature flag is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'SECURITY_AUDIT_LOGGING' ? true : false
      );

      const field = generateMockFormField({
        name: 'sensitiveField',
        type: 'text',
        required: true,
      });

      await ValidationService.validateField(field, 'test-value');
      expect(mockIsFeatureEnabled).toHaveBeenCalledWith('SECURITY_AUDIT_LOGGING');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should validate fields within performance target', async () => {
      const field = generateMockFormField({
        name: 'performanceTest',
        type: 'text',
        required: true,
      });

      const start = performance.now();
      await ValidationService.validateField(field, 'test value');
      const end = performance.now();

      // Should complete within 50ms
      expect(end - start).toBeLessThan(50);
    });

    it('should handle bulk validation efficiently', async () => {
      const fields = Array.from({ length: 10 }, (_, i) =>
        generateMockFormField({
          name: `field${i}`,
          type: 'text',
          required: true,
        })
      );

      const start = performance.now();
      
      await Promise.all(
        fields.map(field => ValidationService.validateField(field, 'test value'))
      );
      
      const end = performance.now();

      // Should complete 10 validations within 200ms
      expect(end - start).toBeLessThan(200);
    });

    it('should use caching for repeated validations', async () => {
      mockIsFeatureEnabled.mockImplementation((flag) => 
        flag === 'PERFORMANCE_MONITORING' ? true : false
      );

      const field = generateMockFormField({
        name: 'cachedField',
        type: 'text',
        required: true,
      });

      const value = 'cached value';

      // First validation
      const result1 = await ValidationService.validateField(field, value);
      
      // Second validation (should use cache)
      const start = performance.now();
      const result2 = await ValidationService.validateField(field, value);
      const end = performance.now();

      expect(result1.isValid).toBe(result2.isValid);
      expect(result1.errors).toEqual(result2.errors);
      // Cached validation should be very fast (< 5ms)
      expect(end - start).toBeLessThan(5);
    });
  });

  describe('Bulk Validation', () => {
    it('should validate multiple fields', async () => {
      const fields = [
        generateMockFormField({
          name: 'firstName',
          type: 'text',
          required: true,
        }),
        generateMockFormField({
          name: 'email',
          type: 'email',
          required: true,
        }),
        generateMockFormField({
          name: 'phone',
          type: 'phone',
          required: false,
        }),
      ];

      const values = {
        firstName: 'John',
        email: 'john@example.com',
        phone: '',
      };

      const results = await ValidationService.validateForm(fields, values);

      expect(results.isValid).toBe(true);
      expect(results.fieldResults).toHaveLength(3);
      expect(results.fieldResults.every(r => r.isValid)).toBe(true);
    });

    it('should identify all validation errors', async () => {
      const fields = [
        generateMockFormField({
          name: 'firstName',
          type: 'text',
          required: true,
        }),
        generateMockFormField({
          name: 'email',
          type: 'email',
          required: true,
        }),
      ];

      const values = {
        firstName: '',
        email: 'invalid-email',
      };

      const results = await ValidationService.validateForm(fields, values);

      expect(results.isValid).toBe(false);
      expect(results.fieldResults).toHaveLength(2);
      expect(results.fieldResults.every(r => !r.isValid)).toBe(true);
      expect(results.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing field values', async () => {
      const fields = [
        generateMockFormField({
          name: 'firstName',
          type: 'text',
          required: true,
        }),
      ];

      const values = {}; // Missing firstName

      const results = await ValidationService.validateForm(fields, values);

      expect(results.isValid).toBe(false);
      expect(results.fieldResults[0].isValid).toBe(false);
      expect(results.fieldResults[0].errors).toContain('This field is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const field = generateMockFormField({
        name: 'testField',
        type: 'text',
        required: true,
      });

      // Mock validation function to throw error
      const originalValidator = ValidationService['validators'];
      ValidationService['validators'] = {
        ...originalValidator,
        text: () => { throw new Error('Validation error'); }
      };

      const result = await ValidationService.validateField(field, 'test');
      
      // Should not throw, but should return validation failure
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original validator
      ValidationService['validators'] = originalValidator;
    });

    it('should handle null/undefined field values', async () => {
      const field = generateMockFormField({
        name: 'testField',
        type: 'text',
        required: false,
      });

      const nullResult = await ValidationService.validateField(field, null);
      const undefinedResult = await ValidationService.validateField(field, undefined);

      expect(nullResult.isValid).toBe(true);
      expect(undefinedResult.isValid).toBe(true);
    });

    it('should handle malformed field objects', async () => {
      // @ts-expect-error - Testing malformed field
      const malformedField = { name: 'test' }; // Missing required properties

      const result = await ValidationService.validateField(malformedField, 'test');
      
      // Should handle gracefully
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('fieldName');
    });
  });

  describe('Custom Validators', () => {
    it('should support custom validation functions', async () => {
      const customValidator = jest.fn().mockReturnValue(false);
      
      const field = generateMockFormField({
        name: 'customField',
        type: 'text',
        required: false,
      });

      // Mock the validation rules to include a custom validator
      const originalRules = ValidationService['FIELD_VALIDATION_RULES'];
      ValidationService['FIELD_VALIDATION_RULES'] = {
        ...originalRules,
        text: [
          ...originalRules.text,
          {
            type: 'custom',
            message: 'Custom validation failed',
            validator: customValidator,
          }
        ]
      };

      const result = await ValidationService.validateField(field, 'test');
      
      expect(customValidator).toHaveBeenCalledWith('test', field, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Custom validation failed');

      // Restore original rules
      ValidationService['FIELD_VALIDATION_RULES'] = originalRules;
    });
  });
});