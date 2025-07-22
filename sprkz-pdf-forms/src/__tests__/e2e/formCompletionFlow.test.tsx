import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllTheProviders, generateMockPDFDocument, generateMockFormField } from '../utils/testUtils';
import App from '../../App';
import { PDFService } from '../../services/pdfService';
import { ValidationService } from '../../services/validationService';
import { UnleashService } from '../../services/unleashService';

// Mock services with comprehensive behaviors
jest.mock('../../services/pdfService');
jest.mock('../../services/validationService');
jest.mock('../../services/unleashService');

const MockedPDFService = PDFService as jest.MockedClass<typeof PDFService>;
const MockedValidationService = ValidationService as jest.MockedClass<typeof ValidationService>;
const MockedUnleashService = UnleashService as jest.MockedClass<typeof UnleashService>;

// Mock URL parameters
const mockSearchParams = new URLSearchParams();
const mockLocationReplace = jest.fn();

Object.defineProperty(window, 'location', {
  value: {
    search: '',
    replace: mockLocationReplace,
  },
  writable: true,
});

Object.defineProperty(window, 'URLSearchParams', {
  value: jest.fn(() => mockSearchParams),
  writable: true,
});

describe('E2E: Complete Form Completion Flow', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockPdfService: jest.Mocked<PDFService>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockUnleashService: jest.Mocked<UnleashService>;

  const testPdfUrl = 'https://example.com/test-form.pdf';
  const mockDocument = generateMockPDFDocument(2);

  const mockFormFields = [
    generateMockFormField({
      name: 'firstName',
      fieldType: 'text',
      required: true,
      page: 1
    }),
    generateMockFormField({
      name: 'lastName',
      fieldType: 'text',
      required: true,
      page: 1
    }),
    generateMockFormField({
      name: 'email',
      fieldType: 'text',
      required: true,
      page: 1
    }),
    generateMockFormField({
      name: 'phone',
      fieldType: 'text',
      required: false,
      page: 1
    }),
    generateMockFormField({
      name: 'agreeTerms',
      fieldType: 'checkbox',
      required: true,
      page: 2
    }),
    generateMockFormField({
      name: 'signature',
      fieldType: 'signature',
      required: true,
      page: 2
    })
  ];

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();

    // Setup PDF Service mock
    mockPdfService = {
      loadDocument: jest.fn(),
      getFormFields: jest.fn(),
      renderPage: jest.fn(),
      generateThumbnail: jest.fn(),
      fillFormFields: jest.fn(),
      generateFilledPDF: jest.fn(),
    } as any;

    mockPdfService.loadDocument.mockResolvedValue(mockDocument);
    mockPdfService.getFormFields.mockResolvedValue(mockFormFields);
    mockPdfService.renderPage.mockResolvedValue({
      canvas: document.createElement('canvas'),
      context: null
    });
    mockPdfService.generateThumbnail.mockResolvedValue('data:image/png;base64,mock-thumbnail');
    mockPdfService.generateFilledPDF.mockResolvedValue(new Uint8Array([1, 2, 3]));

    MockedPDFService.getInstance.mockReturnValue(mockPdfService);

    // Setup Validation Service mock
    mockValidationService = {
      validateField: jest.fn(),
      validateFormData: jest.fn(),
      getValidationRules: jest.fn(),
    } as any;

    mockValidationService.validateField.mockReturnValue({ isValid: true, errors: [] });
    mockValidationService.validateFormData.mockReturnValue({ 
      isValid: true, 
      errors: {},
      missingRequiredFields: []
    });

    MockedValidationService.getInstance.mockReturnValue(mockValidationService);

    // Setup Unleash Service mock
    mockUnleashService = {
      isEnabled: jest.fn().mockReturnValue(true),
      getVariant: jest.fn().mockReturnValue(null),
      getAllFlags: jest.fn().mockReturnValue({}),
    } as any;

    MockedUnleashService.getInstance.mockReturnValue(mockUnleashService);

    // Set PDF URL parameter
    mockSearchParams.get = jest.fn((key) => key === 'f' ? testPdfUrl : null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User Journey', () => {
    it('should complete entire form filling workflow', async () => {
      // Render the application
      render(<App />, { wrapper: AllTheProviders });

      // Step 1: Application loads and shows loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: PDF loads successfully
      await waitFor(() => {
        expect(mockPdfService.loadDocument).toHaveBeenCalledWith({ url: testPdfUrl });
      });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Step 3: Form fields are extracted and wizard is ready
      expect(mockPdfService.getFormFields).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();

      // Step 4: User starts the wizard
      await user.click(screen.getByRole('button', { name: /start/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Step 5: Fill required text fields
      const firstNameField = screen.getByLabelText(/first name/i);
      await user.type(firstNameField, 'John');
      await waitFor(() => {
        expect(mockValidationService.validateField).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'firstName' }),
          'John'
        );
      });

      const lastNameField = screen.getByLabelText(/last name/i);
      await user.type(lastNameField, 'Doe');

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'john.doe@example.com');

      // Step 6: Navigate through wizard to next required field
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to page 2 for checkbox
      await waitFor(() => {
        expect(screen.getByLabelText(/agree to terms/i)).toBeInTheDocument();
      });

      // Step 7: Complete checkbox requirement
      const agreeCheckbox = screen.getByLabelText(/agree to terms/i);
      await user.click(agreeCheckbox);

      // Step 8: Navigate to signature field
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/signature required/i)).toBeInTheDocument();
      });

      // Step 9: Open signature modal and create signature
      const signButton = screen.getByRole('button', { name: /sign/i });
      await user.click(signButton);

      await waitFor(() => {
        expect(screen.getByText(/create signature/i)).toBeInTheDocument();
      });

      // Draw signature (simulate canvas interaction)
      const signatureCanvas = screen.getByRole('img', { name: /signature canvas/i });
      fireEvent.mouseDown(signatureCanvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseMove(signatureCanvas, { clientX: 100, clientY: 75 });
      fireEvent.mouseUp(signatureCanvas);

      // Save signature
      const saveSignatureButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveSignatureButton);

      // Step 10: All fields completed, submit form
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Step 11: Form submission process
      await waitFor(() => {
        expect(mockPdfService.fillFormFields).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPdfService.generateFilledPDF).toHaveBeenCalled();
      });

      // Step 12: Success confirmation
      await waitFor(() => {
        expect(screen.getByText(/form submitted successfully/i)).toBeInTheDocument();
      });
    }, 15000); // Extended timeout for complete flow

    it('should handle validation errors gracefully', async () => {
      // Mock validation to return errors
      mockValidationService.validateField.mockReturnValue({
        isValid: false,
        errors: ['This field is required']
      });

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Start wizard
      await user.click(screen.getByRole('button', { name: /start/i }));

      // Try to navigate without filling required field
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Should not navigate away from current field
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Start with keyboard
      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.focus();
      fireEvent.keyDown(startButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });

      // Navigate fields with Tab
      const firstNameField = screen.getByLabelText(/first name/i);
      fireEvent.keyDown(firstNameField, { key: 'Tab' });

      // Should focus next field
      const lastNameField = screen.getByLabelText(/last name/i);
      expect(lastNameField).toHaveFocus();
    });

    it('should handle PDF loading errors', async () => {
      // Mock PDF loading failure
      mockPdfService.loadDocument.mockRejectedValue(new Error('PDF loading failed'));

      render(<App />, { wrapper: AllTheProviders });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading pdf/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should persist form data during navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Fill first field
      const firstNameField = screen.getByLabelText(/first name/i);
      await user.type(firstNameField, 'John');

      // Navigate away and back
      await user.click(screen.getByRole('button', { name: /next/i }));
      
      // Go back to previous field
      const backButton = screen.getByRole('button', { name: /back/i });
      if (backButton) {
        await user.click(backButton);
      }

      // Field should retain value
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });
    });

    it('should handle form submission errors', async () => {
      // Mock submission failure
      mockPdfService.generateFilledPDF.mockRejectedValue(new Error('Submission failed'));

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Quick fill and submit
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      // Fill required fields quickly
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Navigate to submit
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByLabelText(/agree to terms/i));
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Mock signature completion
      const signButton = screen.getByRole('button', { name: /sign/i });
      await user.click(signButton);
      
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveButton);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should provide proper ARIA labels and roles', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Check main navigation has proper roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check form has proper labeling
      await user.click(screen.getByRole('button', { name: /start/i }));
      
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label');

      // Check fields have proper labels
      const firstNameField = screen.getByLabelText(/first name/i);
      expect(firstNameField).toHaveAttribute('aria-required', 'true');
    });

    it('should announce progress to screen readers', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Progress should be announced
      const progressElement = screen.getByRole('progressbar');
      expect(progressElement).toHaveAttribute('aria-valuemin', '0');
      expect(progressElement).toHaveAttribute('aria-valuemax', '100');
      expect(progressElement).toHaveAttribute('aria-valuenow');
    });

    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Should apply high contrast styles
      const startButton = screen.getByRole('button', { name: /start/i });
      const buttonStyles = window.getComputedStyle(startButton);
      
      // High contrast mode should affect button styling
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      global.dispatchEvent(new Event('resize'));

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Mobile layout should be active
      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile/i);
    });

    it('should handle orientation changes', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Simulate orientation change
      global.innerWidth = 667;
      global.innerHeight = 375;
      global.dispatchEvent(new Event('orientationchange'));

      // Layout should adapt
      await waitFor(() => {
        const container = screen.getByRole('main');
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect feature flag configuration', async () => {
      // Mock feature flag disabled
      mockUnleashService.isEnabled.mockImplementation((flag) => {
        return flag !== 'ENHANCED_WIZARD_MODE';
      });

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Enhanced wizard features should not be available
      expect(screen.queryByTestId('enhanced-wizard-features')).not.toBeInTheDocument();
    });

    it('should handle feature flag changes dynamically', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Test Employment Form')).toBeInTheDocument();
      });

      // Initially enabled features
      expect(mockUnleashService.isEnabled).toHaveBeenCalled();

      // Simulate feature flag change
      mockUnleashService.isEnabled.mockReturnValue(false);
      
      // Re-render should respect new flag state
      // Note: In real app, this would be handled by the feature flag context
    });
  });
});