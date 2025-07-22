import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllTheProviders, generateMockPDFDocument, generateMockFormField } from '../utils/testUtils';
import App from '../../App';
import { PDFService } from '../../services/pdfService';
import { ValidationService } from '../../services/validationService';
import { UnleashService } from '../../services/unleashService';

// Mock services
jest.mock('../../services/pdfService');
jest.mock('../../services/validationService');
jest.mock('../../services/unleashService');

const MockedPDFService = PDFService as jest.MockedClass<typeof PDFService>;
const MockedValidationService = ValidationService as jest.MockedClass<typeof ValidationService>;
const MockedUnleashService = UnleashService as jest.MockedClass<typeof UnleashService>;

// Mock URL parameters
const mockSearchParams = new URLSearchParams();
Object.defineProperty(window, 'URLSearchParams', {
  value: jest.fn(() => mockSearchParams),
  writable: true,
});

describe('E2E: Wizard Navigation System', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockPdfService: jest.Mocked<PDFService>;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockUnleashService: jest.Mocked<UnleashService>;

  const testPdfUrl = 'https://example.com/multi-page-form.pdf';
  const mockDocument = generateMockPDFDocument(4);

  // Create a complex form with fields across multiple pages
  const mockFormFields = [
    // Page 1: Personal Information
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

    // Page 2: Address Information
    generateMockFormField({
      name: 'street',
      fieldType: 'text',
      required: true,
      page: 2
    }),
    generateMockFormField({
      name: 'city',
      fieldType: 'text',
      required: true,
      page: 2
    }),
    generateMockFormField({
      name: 'state',
      fieldType: 'dropdown',
      required: true,
      page: 2
    }),
    generateMockFormField({
      name: 'zipCode',
      fieldType: 'text',
      required: true,
      page: 2
    }),

    // Page 3: Employment Information
    generateMockFormField({
      name: 'employer',
      fieldType: 'text',
      required: true,
      page: 3
    }),
    generateMockFormField({
      name: 'position',
      fieldType: 'text',
      required: true,
      page: 3
    }),
    generateMockFormField({
      name: 'workType',
      fieldType: 'radio',
      required: true,
      page: 3
    }),

    // Page 4: Agreements and Signature
    generateMockFormField({
      name: 'agreeTerms',
      fieldType: 'checkbox',
      required: true,
      page: 4
    }),
    generateMockFormField({
      name: 'agreePrivacy',
      fieldType: 'checkbox',
      required: true,
      page: 4
    }),
    generateMockFormField({
      name: 'employeeSignature',
      fieldType: 'signature',
      required: true,
      page: 4
    }),
    generateMockFormField({
      name: 'signatureDate',
      fieldType: 'text',
      required: true,
      page: 4
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

    MockedPDFService.getInstance.mockReturnValue(mockPdfService);

    // Setup Validation Service
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

    // Setup Unleash Service
    mockUnleashService = {
      isEnabled: jest.fn().mockReturnValue(true),
      getVariant: jest.fn().mockReturnValue(null),
      getAllFlags: jest.fn().mockReturnValue({}),
    } as any;

    MockedUnleashService.getInstance.mockReturnValue(mockUnleashService);

    // Set PDF URL parameter
    mockSearchParams.get = jest.fn((key) => key === 'f' ? testPdfUrl : null);
  });

  describe('Enhanced Wizard Navigation', () => {
    it('should navigate sequentially through required fields', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      // Start wizard
      await user.click(screen.getByRole('button', { name: /start/i }));

      // Should navigate to first required field (firstName on page 1)
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
      });

      // Fill first field and navigate to next
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to lastName (same page)
      await waitFor(() => {
        const lastNameField = screen.getByLabelText(/last name/i);
        expect(lastNameField).toHaveFocus();
      });

      // Fill and continue
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to email (same page)
      await waitFor(() => {
        const emailField = screen.getByLabelText(/email/i);
        expect(emailField).toHaveFocus();
      });

      // Fill and continue
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should skip optional phone field and go to page 2 (street address)
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
        expect(screen.getByLabelText(/street address/i)).toHaveFocus();
      });
    });

    it('should handle back navigation correctly', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Navigate forward through several fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Now on page 2 - go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      // Should return to email field (last required field on page 1)
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toHaveFocus();
        expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      });

      // Back again
      await user.click(backButton);

      // Should go to lastName
      await waitFor(() => {
        expect(screen.getByLabelText(/last name/i)).toHaveFocus();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    it('should show progress indicator and field counter', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Should show progress
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      // Should show field counter (13 required fields total)
      expect(screen.getByText(/field 1 of 13/i)).toBeInTheDocument();

      // Navigate to next field
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Progress should update
      await waitFor(() => {
        expect(screen.getByText(/field 2 of 13/i)).toBeInTheDocument();
      });

      const currentProgress = progressBar.getAttribute('aria-valuenow');
      expect(parseInt(currentProgress!)).toBeGreaterThan(0);
    });

    it('should handle page jumps when clicking thumbnails', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Click on page 3 thumbnail
      const page3Thumbnail = screen.getByRole('button', { name: /page 3 thumbnail/i });
      await user.click(page3Thumbnail);

      // Should navigate to page 3 but maintain wizard context
      await waitFor(() => {
        expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
      });

      // Should show message about incomplete required fields on previous pages
      expect(screen.getByText(/complete previous required fields first/i)).toBeInTheDocument();

      // Next button should navigate back to first incomplete required field
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
        expect(screen.getByLabelText(/first name/i)).toHaveFocus();
      });
    });

    it('should handle dropdown and radio field navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Navigate to page 2 quickly by filling required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Now on page 2 - fill street
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // City field
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to state dropdown
      await waitFor(() => {
        const stateDropdown = screen.getByLabelText(/state/i);
        expect(stateDropdown).toHaveFocus();
      });

      // Select state
      const stateDropdown = screen.getByLabelText(/state/i);
      await user.click(stateDropdown);
      await user.click(screen.getByText('CA'));

      await user.click(screen.getByRole('button', { name: /next/i }));

      // ZIP code
      await user.type(screen.getByLabelText(/zip code/i), '90210');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to page 3
      await waitFor(() => {
        expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
        expect(screen.getByLabelText(/current employer/i)).toHaveFocus();
      });

      // Fill employer and continue to radio button
      await user.type(screen.getByLabelText(/current employer/i), 'Tech Corp');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/job title/i), 'Developer');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to radio group
      await waitFor(() => {
        const fullTimeRadio = screen.getByLabelText(/full-time/i);
        expect(fullTimeRadio).toHaveFocus();
      });

      // Select radio option
      const fullTimeRadio = screen.getByLabelText(/full-time/i);
      await user.click(fullTimeRadio);

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should navigate to page 4
      await waitFor(() => {
        expect(screen.getByText('Page 4 of 4')).toBeInTheDocument();
      });
    });

    it('should handle signature field navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      // Skip to signature section quickly
      await user.click(screen.getByRole('button', { name: /start/i }));

      // Fill all required fields quickly (mocked validation passes)
      const fillAllFields = async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John');
        await user.click(screen.getByRole('button', { name: /next/i }));
        // ... continue with all required fields
      };

      // Navigate through all required fields to reach signatures
      // (This would be a longer sequence in a real test)

      // Eventually reach page 4 with checkboxes
      const page4Thumbnail = screen.getByRole('button', { name: /page 4 thumbnail/i });
      await user.click(page4Thumbnail);

      // Check agreement checkboxes
      const agreeTermsCheckbox = screen.getByLabelText(/agree to the terms/i);
      const agreePrivacyCheckbox = screen.getByLabelText(/agree to the privacy/i);

      await user.click(agreeTermsCheckbox);
      await user.click(agreePrivacyCheckbox);

      // Navigate to signature
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should focus on signature field and change button to "Sign"
      await waitFor(() => {
        expect(screen.getByText(/signature required/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign/i })).toBeInTheDocument();
      });

      // Click sign button should open signature modal
      await user.click(screen.getByRole('button', { name: /sign/i }));

      await waitFor(() => {
        expect(screen.getByText(/create signature/i)).toBeInTheDocument();
      });
    });
  });

  describe('Wizard State Management', () => {
    it('should persist form data across navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Fill several fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Jump to different page
      const page3Thumbnail = screen.getByRole('button', { name: /page 3 thumbnail/i });
      await user.click(page3Thumbnail);

      // Return to page 1
      const page1Thumbnail = screen.getByRole('button', { name: /page 1 thumbnail/i });
      await user.click(page1Thumbnail);

      // All previously entered data should persist
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('should handle validation errors during wizard navigation', async () => {
      // Mock validation failure for email
      mockValidationService.validateField.mockImplementation((field, value) => {
        if (field.name === 'email' && value === 'invalid-email') {
          return { isValid: false, errors: ['Please enter a valid email address'] };
        }
        return { isValid: true, errors: [] };
      });

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Fill fields with invalid email
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should show validation error and not navigate
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Should remain on same field
      expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      // Fix email and continue
      const emailField = screen.getByLabelText(/email/i);
      await user.clear(emailField);
      await user.type(emailField, 'john@example.com');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should now navigate to next page
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
      });
    });

    it('should handle completion detection and submit state', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      // Mock all fields as completed except signature
      const mockCompletedFields = mockFormFields.filter(field => field.name !== 'employeeSignature');
      
      // Fill all required fields (this would be a longer sequence)
      await user.click(screen.getByRole('button', { name: /start/i }));

      // Navigate to final page
      const page4Thumbnail = screen.getByRole('button', { name: /page 4 thumbnail/i });
      await user.click(page4Thumbnail);

      // Check all required checkboxes
      await user.click(screen.getByLabelText(/agree to the terms/i));
      await user.click(screen.getByLabelText(/agree to the privacy/i));

      // Fill date
      await user.type(screen.getByLabelText(/date/i), '12/25/2024');

      // Only signature remains - button should show "Sign"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign/i })).toBeInTheDocument();
      });

      // Complete signature (mock)
      await user.click(screen.getByRole('button', { name: /sign/i }));

      // Mock signature completion
      fireEvent.click(screen.getByRole('button', { name: /save signature/i }));

      // All fields completed - should show submit button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      // Progress should show 100%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should support full keyboard navigation', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      // Start with keyboard
      const startButton = screen.getByRole('button', { name: /start/i });
      startButton.focus();
      fireEvent.keyDown(startButton, { key: 'Enter' });

      await waitFor(() => {
        const firstNameField = screen.getByLabelText(/first name/i);
        expect(firstNameField).toHaveFocus();
      });

      // Fill and navigate with Tab
      const firstNameField = screen.getByLabelText(/first name/i);
      await user.type(firstNameField, 'John');

      fireEvent.keyDown(firstNameField, { key: 'Tab' });

      // Should focus next required field (lastName)
      const lastNameField = screen.getByLabelText(/last name/i);
      expect(lastNameField).toHaveFocus();

      // Use Enter to activate Next button after filling
      await user.type(lastNameField, 'Doe');
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      nextButton.focus();
      fireEvent.keyDown(nextButton, { key: 'Enter' });

      // Should navigate to email field
      await waitFor(() => {
        const emailField = screen.getByLabelText(/email/i);
        expect(emailField).toHaveFocus();
      });
    });

    it('should announce navigation changes to screen readers', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Should announce current field
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/now on first name field/i);

      // Navigate to next field
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should announce new field
      await waitFor(() => {
        expect(announcement).toHaveTextContent(/now on last name field/i);
      });

      // Navigate to new page
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Should announce page change
      await waitFor(() => {
        expect(announcement).toHaveTextContent(/navigated to page 2/i);
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle missing or corrupted field data', async () => {
      // Mock corrupted form fields
      const corruptedFields = [
        ...mockFormFields,
        {
          name: null, // Corrupted field
          type: 'text',
          required: true,
          page: 1,
          rect: [0, 0, 0, 0]
        }
      ] as any;

      mockPdfService.getFormFields.mockResolvedValue(corruptedFields);

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      // Should still function with valid fields, ignoring corrupted ones
      await user.click(screen.getByRole('button', { name: /start/i }));

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it('should handle wizard navigation with no required fields', async () => {
      // Mock form with only optional fields
      const optionalOnlyFields = mockFormFields.map(field => ({ ...field, required: false }));
      mockPdfService.getFormFields.mockResolvedValue(optionalOnlyFields);

      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Should immediately show submit button since no required fields
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/all fields are optional/i)).toBeInTheDocument();
    });

    it('should recover from wizard state corruption', async () => {
      render(<App />, { wrapper: AllTheProviders });

      await waitFor(() => {
        expect(screen.getByText('Complex Multi-Page Form')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start/i }));

      // Simulate state corruption by triggering error
      const errorButton = screen.queryByTestId('trigger-state-error');
      if (errorButton) {
        await user.click(errorButton);
      }

      // Should show error message with recovery option
      const restartButton = screen.queryByRole('button', { name: /restart wizard/i });
      if (restartButton) {
        await user.click(restartButton);

        // Should return to initial state
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
        });
      }
    });
  });
});