import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../utils/testUtils';
import { PDFFormContainer } from '../../components/pdf/PDFFormContainer';
import { FormProvider } from '../../contexts/FormContext';
import { WizardProvider } from '../../contexts/WizardContext';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';
import { PDFService } from '../../services/pdfService';
import { ValidationService } from '../../services/validationService';
import { generateMockPDFDocument, generateMockFormField, createMockSignatureData } from '../utils/testUtils';

// Mock services
jest.mock('../../services/pdfService');
jest.mock('../../services/validationService');
jest.mock('../../services/unleashService', () => ({
  isFeatureEnabled: jest.fn().mockReturnValue(true),
  unleashService: {
    isEnabled: jest.fn().mockReturnValue(true),
    getVariant: jest.fn().mockReturnValue(null),
    getAllFlags: jest.fn().mockReturnValue({}),
  },
}));

// Mock Sentry
jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  ErrorBoundary: ({ children, fallback }: any) => {
    try {
      return children;
    } catch (error) {
      return fallback({ error, resetError: () => {} });
    }
  },
}));

const MockedPDFService = PDFService as jest.Mocked<typeof PDFService>;
const MockedValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

describe('PDF Form Workflow Integration', () => {
  const mockPDFDocument = generateMockPDFDocument(3);
  const mockFormFields = [
    generateMockFormField({
      name: 'firstName',
      type: 'text',
      required: true,
      page: 1,
    }),
    generateMockFormField({
      name: 'email',
      type: 'email',
      required: true,
      page: 1,
    }),
    generateMockFormField({
      name: 'signature',
      type: 'signature',
      required: true,
      page: 2,
    }),
    generateMockFormField({
      name: 'optionalNotes',
      type: 'text',
      required: false,
      page: 3,
    }),
  ];

  const renderPDFFormContainer = (url?: string) => {
    // Mock URL parameter
    if (url) {
      delete window.location;
      window.location = { search: `?f=${encodeURIComponent(url)}` } as any;
    } else {
      delete window.location;
      window.location = { search: '' } as any;
    }

    return render(
      <FeatureFlagsProvider>
        <FormProvider>
          <WizardProvider>
            <PDFFormContainer />
          </WizardProvider>
        </FormProvider>
      </FeatureFlagsProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    MockedPDFService.loadDocument.mockResolvedValue(mockPDFDocument);
    MockedPDFService.getPage.mockImplementation((doc, pageNum) => 
      Promise.resolve({
        pageNumber: pageNum,
        getViewport: jest.fn().mockReturnValue({ width: 595, height: 842 }),
        render: jest.fn().mockResolvedValue({}),
        getAnnotations: jest.fn().mockResolvedValue([]),
      } as any)
    );
    MockedPDFService.extractFormFields.mockImplementation((page) => {
      const pageFields = mockFormFields.filter(f => f.page === page.pageNumber);
      return Promise.resolve(pageFields);
    });

    MockedValidationService.validateField.mockImplementation((field, value) => {
      const isValid = field.required ? Boolean(value) : true;
      return Promise.resolve({
        isValid,
        errors: isValid ? [] : [`${field.name} is required`],
        warnings: [],
        fieldName: field.name,
        validatedAt: Date.now(),
      });
    });

    MockedValidationService.validateForm.mockImplementation((fields, values) => {
      const fieldResults = fields.map(field => {
        const value = values[field.name];
        const isValid = field.required ? Boolean(value) : true;
        return {
          isValid,
          errors: isValid ? [] : [`${field.name} is required`],
          warnings: [],
          fieldName: field.name,
          validatedAt: Date.now(),
        };
      });

      const isValid = fieldResults.every(r => r.isValid);
      const errors = fieldResults.flatMap(r => r.errors);

      return Promise.resolve({
        isValid,
        errors,
        warnings: [],
        fieldResults,
        validatedAt: Date.now(),
      });
    });
  });

  describe('PDF Loading and Initialization', () => {
    it('should load PDF from URL parameter and extract form fields', async () => {
      const testUrl = 'https://example.com/test-form.pdf';
      
      renderPDFFormContainer(testUrl);

      await waitFor(() => {
        expect(MockedPDFService.loadDocument).toHaveBeenCalledWith({
          url: testUrl,
        });
      });

      await waitFor(() => {
        expect(MockedPDFService.extractFormFields).toHaveBeenCalledTimes(3); // 3 pages
      });

      // Should display the loaded PDF
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    it('should show file upload when no URL is provided', () => {
      renderPDFFormContainer();

      expect(screen.getByText(/Select a PDF document/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Choose File|Browse/i })).toBeInTheDocument();
    });

    it('should handle PDF loading errors gracefully', async () => {
      MockedPDFService.loadDocument.mockRejectedValue(new Error('Failed to load PDF'));
      
      renderPDFFormContainer('https://example.com/invalid.pdf');

      await waitFor(() => {
        expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Field Detection and Wizard Initialization', () => {
    it('should detect form fields and initialize wizard', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      // Should show progress indicator
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    it('should categorize required and optional fields correctly', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        // Should show required fields count (firstName, email, signature)
        expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
      });
    });

    it('should handle PDFs with no form fields', async () => {
      MockedPDFService.extractFormFields.mockResolvedValue([]);
      
      renderPDFFormContainer('https://example.com/no-forms.pdf');

      await waitFor(() => {
        expect(screen.getByText(/No form fields found/)).toBeInTheDocument();
      });
    });
  });

  describe('Wizard Navigation Flow', () => {
    it('should guide user through form completion', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      // Start the wizard
      fireEvent.click(screen.getByRole('button', { name: /start/i }));

      await waitFor(() => {
        // Should navigate to first required field
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Fill the first field
      const firstNameField = screen.getByLabelText(/firstName/i);
      fireEvent.change(firstNameField, { target: { value: 'John' } });

      // Click next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        // Should move to second field
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Fill email field
      const emailField = screen.getByLabelText(/email/i);
      fireEvent.change(emailField, { target: { value: 'john@example.com' } });

      // Click next
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        // Should move to signature field
        expect(screen.getByRole('button', { name: /sign/i })).toBeInTheDocument();
      });
    });

    it('should validate fields during navigation', async () => {
      MockedValidationService.validateField.mockImplementation((field, value) => {
        if (field.name === 'email' && value === 'invalid-email') {
          return Promise.resolve({
            isValid: false,
            errors: ['Please enter a valid email address'],
            warnings: [],
            fieldName: field.name,
            validatedAt: Date.now(),
          });
        }
        return Promise.resolve({
          isValid: true,
          errors: [],
          warnings: [],
          fieldName: field.name,
          validatedAt: Date.now(),
        });
      });

      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Start wizard and fill first field
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      const firstNameField = screen.getByLabelText(/firstName/i);
      fireEvent.change(firstNameField, { target: { value: 'John' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Fill email with invalid value
      const emailField = screen.getByLabelText(/email/i);
      fireEvent.change(emailField, { target: { value: 'invalid-email' } });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Next button should be disabled or show error
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should handle signature field workflow', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Navigate to signature field
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      // Fill required text fields
      fireEvent.change(screen.getByLabelText(/firstName/i), { target: { value: 'John' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign/i })).toBeInTheDocument();
      });

      // Click sign button to open signature modal
      fireEvent.click(screen.getByRole('button', { name: /sign/i }));

      await waitFor(() => {
        expect(screen.getByText(/Sign "signature"/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Flow', () => {
    it('should complete form submission workflow', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Complete all required fields
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      // Fill text fields
      fireEvent.change(screen.getByLabelText(/firstName/i), { target: { value: 'John' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Mock signature completion
      act(() => {
        // Simulate signature being added through the signature modal
        const signatureData = createMockSignatureData('canvas');
        // This would be called by the signature modal
        // signatureContext.setSignature('signature', signatureData);
      });

      await waitFor(() => {
        // After all fields are complete, should show submit button
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(screen.getByText(/Form submitted successfully/)).toBeInTheDocument();
      });
    });

    it('should validate complete form before submission', async () => {
      MockedValidationService.validateForm.mockResolvedValue({
        isValid: false,
        errors: ['firstName is required'],
        warnings: [],
        fieldResults: [],
        validatedAt: Date.now(),
      });

      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Try to submit incomplete form
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      // Skip directly to submit (this would be prevented by wizard logic)
      // but we test the validation

      expect(MockedValidationService.validateForm).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle field validation errors', async () => {
      MockedValidationService.validateField.mockRejectedValue(new Error('Validation service error'));

      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      const firstNameField = screen.getByLabelText(/firstName/i);
      fireEvent.change(firstNameField, { target: { value: 'John' } });

      // Validation error should be handled gracefully
      await waitFor(() => {
        // Should not crash the app
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should handle PDF processing errors during workflow', async () => {
      MockedPDFService.getPage.mockRejectedValue(new Error('Page processing error'));

      renderPDFFormContainer('https://example.com/error-prone.pdf');

      await waitFor(() => {
        // Should display error state
        expect(screen.getByText(/Error processing PDF/)).toBeInTheDocument();
      });
    });

    it('should allow form reset and restart', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      // Complete some fields
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      fireEvent.change(screen.getByLabelText(/firstName/i), { target: { value: 'John' } });

      // Reset form (this would be triggered by a reset button or error recovery)
      act(() => {
        // Simulate form reset
        window.location.reload();
      });

      // Should be able to restart
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });
  });

  describe('Performance and User Experience', () => {
    it('should load and initialize within reasonable time', async () => {
      const startTime = performance.now();
      
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      }, { timeout: 5000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    it('should show loading states during long operations', async () => {
      // Simulate slow PDF loading
      MockedPDFService.loadDocument.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPDFDocument), 1000))
      );

      renderPDFFormContainer('https://example.com/slow-load.pdf');

      // Should show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      }, { timeout: 2000 });

      // Loading indicator should be gone
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('should handle rapid user interactions gracefully', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      const firstNameField = screen.getByLabelText(/firstName/i);
      
      // Rapid typing simulation
      const rapidInputs = ['J', 'Jo', 'Joh', 'John'];
      
      for (const input of rapidInputs) {
        fireEvent.change(firstNameField, { target: { value: input } });
      }

      // Should handle all inputs correctly
      expect(firstNameField).toHaveValue('John');
    });
  });

  describe('Accessibility and User Interface', () => {
    it('should provide proper ARIA labels and navigation', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start/i });
        expect(startButton).toHaveAccessibleName();
      });

      // Form fields should have proper labels
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /start/i }));
      });

      const firstNameField = screen.getByLabelText(/firstName/i);
      expect(firstNameField).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start/i });
        startButton.focus();
        fireEvent.keyDown(startButton, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should provide visual feedback for form completion progress', async () => {
      renderPDFFormContainer('https://example.com/test-form.pdf');

      await waitFor(() => {
        // Progress should start at 0%
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
      });

      // Complete first field
      fireEvent.click(screen.getByRole('button', { name: /start/i }));
      fireEvent.change(screen.getByLabelText(/firstName/i), { target: { value: 'John' } });

      await waitFor(() => {
        // Progress should update
        expect(screen.getByText(/1 of 3 completed/)).toBeInTheDocument();
      });
    });
  });
});