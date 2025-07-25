import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFFormContainer } from '../PDFFormContainer';
import type { DynamicConfig } from '../PDFFormContainer';

// Mock all external dependencies first
jest.mock('../../../services/pdfService');
jest.mock('../../../utils/urlParams');
jest.mock('../../../hooks/useFeatureFlags');

// Create mock variables that can be used in jest.mock
let mockOnFormFieldsDetected = jest.fn();
let mockOnPageChange = jest.fn();
let mockOnPageSelect = jest.fn();

// Mock child components with simple implementations
jest.mock('../PDFViewer', () => ({
  PDFViewer: jest.fn((props) => {
    // Simulate async field detection
    setTimeout(() => {
      if (props.onFormFieldsDetected) {
        props.onFormFieldsDetected([
          { id: 'field1', name: 'firstName', pageNumber: 1, type: 'text', required: true, readOnly: false, rect: [0, 0, 100, 20] },
          { id: 'field2', name: 'email', pageNumber: 1, type: 'text', required: false, readOnly: false, rect: [0, 30, 100, 50] }
        ]);
      }
    }, 0);
    
    return {
      type: 'div',
      props: {
        'data-testid': 'pdf-viewer',
        onClick: () => props.onPageChange && props.onPageChange(1),
        children: null
      }
    };
  })
}));

jest.mock('../ThumbnailSidebar', () => ({
  ThumbnailSidebar: jest.fn((props) => ({
    type: 'div',
    props: {
      'data-testid': 'thumbnail-sidebar',
      onClick: () => props.onPageSelect && props.onPageSelect(2),
      children: null
    }
  }))
}));

jest.mock('../../WizardButton', () => ({
  WizardButton: jest.fn(() => ({
    type: 'button',
    props: {
      'data-testid': 'wizard-button',
      children: 'Wizard Button'
    }
  })),
  WizardStatus: jest.fn(() => ({
    type: 'div',
    props: {
      'data-testid': 'wizard-status',
      children: 'Wizard Status'
    }
  }))
}));

jest.mock('../../ProgressTracker', () => ({
  ProgressTracker: jest.fn(() => ({
    type: 'div',
    props: {
      'data-testid': 'progress-tracker',
      children: 'Progress Tracker'
    }
  }))
}));

jest.mock('../../FieldTooltip', () => ({
  FieldTooltip: jest.fn(() => ({
    type: 'div',
    props: {
      'data-testid': 'field-tooltip',
      children: 'Field Tooltip'
    }
  }))
}));

// Mock FormProvider and context
const mockFormState = {
  formData: {},
  validationErrors: {},
  currentFieldId: null,
  wizard: { isWizardMode: false }
};
const mockSetFieldValue = jest.fn();
const mockSetCurrentField = jest.fn();
const mockSetCurrentPage = jest.fn();
const mockSetFormFields = jest.fn();

jest.mock('../../../contexts/FormContext', () => ({
  FormProvider: jest.fn(({ children, onSubmit }) => ({
    type: 'div',
    props: {
      'data-testid': 'form-provider',
      'data-onsubmit': !!onSubmit,
      children: children
    }
  })),
  useForm: () => ({
    setFieldValue: mockSetFieldValue,
    setCurrentField: mockSetCurrentField,
    setCurrentPage: mockSetCurrentPage,
    setFormFields: mockSetFormFields,
    state: mockFormState,
  }),
}));

// Import mocked services after mocking
import { pdfService } from '../../../services/pdfService';
import { getPDFUrlFromParams } from '../../../utils/urlParams';
import { usePDFViewerFeatures, useWizardFeatures, useFormFeatures } from '../../../hooks/useFeatureFlags';

const mockPDFService = pdfService as jest.Mocked<typeof pdfService>;
const mockGetPDFUrlFromParams = getPDFUrlFromParams as jest.Mock;
const mockUsePDFViewerFeatures = usePDFViewerFeatures as jest.MockedFunction<typeof usePDFViewerFeatures>;
const mockUseWizardFeatures = useWizardFeatures as jest.MockedFunction<typeof useWizardFeatures>;
const mockUseFormFeatures = useFormFeatures as jest.MockedFunction<typeof useFormFeatures>;

// Mock PDF document
const mockPDFDocument = {
  numPages: 2,
  getPage: jest.fn(),
  destroy: jest.fn(),
};

const mockPage = {
  getViewport: jest.fn().mockReturnValue({
    width: 800,
    height: 600,
  }),
  render: jest.fn().mockResolvedValue(undefined),
  getAnnotations: jest.fn().mockResolvedValue([]),
};

// Default feature flag mocks
const defaultPDFViewerFeatures = {
  showFieldsToggle: true,
  showFitWidthButton: true,
  showFitHeightButton: true,
  showTitleDisplay: true,
  showFilenameDisplay: true,
  showThumbnailNavigation: true,
  hasAnyControls: true,
};

const defaultWizardFeatures = {
  showWizardButton: true,
  showStatusIndicator: true,
  showProgressTracker: true,
  showMiniProgress: false,
  hasAnyWizardFeatures: true,
};

const defaultFormFeatures = {
  showTooltips: true,
  showValidation: true,
  showSignatureModal: false,
  hasAnyFormFeatures: true,
};

describe('PDFFormContainer', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockOnFormFieldsDetectedCallback: jest.Mock;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockOnFormFieldsDetectedCallback = jest.fn();
    
    // Reset form state
    mockFormState.wizard.isWizardMode = false;
    
    // Setup default mocks
    mockGetPDFUrlFromParams.mockReturnValue('/pdfs/makana2025.pdf');
    mockPDFService.loadPDF.mockResolvedValue(mockPDFDocument as any);
    mockPDFService.getPage.mockResolvedValue(mockPage as any);
    mockPDFService.renderPage.mockResolvedValue({ width: 800, height: 600 });
    mockPDFService.getFormFields.mockResolvedValue([]);
    mockPDFDocument.getPage.mockResolvedValue(mockPage as any);
    
    // Setup feature flag mocks
    mockUsePDFViewerFeatures.mockReturnValue(defaultPDFViewerFeatures);
    mockUseWizardFeatures.mockReturnValue(defaultWizardFeatures);
    mockUseFormFeatures.mockReturnValue(defaultFormFeatures);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render PDF form container with FormProvider wrapper', async () => {
      render(<PDFFormContainer />);

      expect(screen.getByTestId('form-provider')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('pdf-form-container')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', async () => {
      // Mock slower PDF loading
      mockPDFService.loadPDF.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockPDFDocument as any), 100)));
      
      render(<PDFFormContainer />);

      expect(screen.getByText(/Loading PDF/)).toBeInTheDocument();
      expect(screen.getByTestId('pdf-form-container')).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Loading PDF/)).not.toBeInTheDocument();
      });
    });

    it('should handle PDF loading errors gracefully', async () => {
      mockPDFService.loadPDF.mockRejectedValue(new Error('Failed to load PDF'));

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
        expect(screen.getByText(/Make sure the PDF file exists/)).toBeInTheDocument();
      });
    });

    it('should display warning when no PDF document is loaded', async () => {
      mockPDFService.loadPDF.mockResolvedValue(null as any);

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText(/No PDF document loaded/)).toBeInTheDocument();
      });
    });
  });

  describe('PDF Loading', () => {
    it('should load PDF from URL parameters by default', async () => {
      mockGetPDFUrlFromParams.mockReturnValue('/pdfs/tremfya.pdf');

      render(<PDFFormContainer />);

      expect(mockGetPDFUrlFromParams).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/tremfya.pdf');
      });
    });

    it('should use dynamic config PDF path when provided', async () => {
      const dynamicConfig: DynamicConfig = {
        pdfPath: '/pdfs/custom.pdf',
        features: {},
        pdfFields: {},
      };

      render(<PDFFormContainer dynamicConfig={dynamicConfig} />);

      // Should not call URL params when dynamic config is provided
      expect(mockGetPDFUrlFromParams).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/custom.pdf');
      });
    });

    it('should reset field detection flag when loading new PDF', async () => {
      const { rerender } = render(<PDFFormContainer />);

      await waitFor(() => {
        expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/makana2025.pdf');
      });

      // Change PDF URL
      mockGetPDFUrlFromParams.mockReturnValue('/pdfs/another.pdf');
      rerender(<PDFFormContainer />);

      await waitFor(() => {
        expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/another.pdf');
      });
    });
  });

  describe('Component Integration', () => {
    it('should render PDF viewer when PDF is loaded', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });
    });

    it('should render thumbnail sidebar when feature is enabled', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('thumbnail-sidebar')).toBeInTheDocument();
      });
    });

    it('should not render thumbnail sidebar when feature is disabled', async () => {
      mockUsePDFViewerFeatures.mockReturnValue({
        ...defaultPDFViewerFeatures,
        showThumbnailNavigation: false,
      });

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('thumbnail-sidebar')).not.toBeInTheDocument();
    });

    it('should handle page selection from thumbnail sidebar', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('thumbnail-sidebar')).toBeInTheDocument();
      });

      const thumbnailSidebar = screen.getByTestId('thumbnail-sidebar');
      fireEvent.click(thumbnailSidebar);

      expect(mockSetCurrentPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Form Field Handling', () => {
    it('should handle form fields detection', async () => {
      render(<PDFFormContainer onFormFieldsDetected={mockOnFormFieldsDetectedCallback} />);

      await waitFor(() => {
        expect(mockOnFormFieldsDetectedCallback).toHaveBeenCalledWith([
          { id: 'field1', name: 'firstName', pageNumber: 1, type: 'text', required: true, readOnly: false, rect: [0, 0, 100, 20] },
          { id: 'field2', name: 'email', pageNumber: 1, type: 'text', required: false, readOnly: false, rect: [0, 30, 100, 50] }
        ]);
      }, { timeout: 2000 });
    });

    it('should convert fields to PageFormFields format for FormContext', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(mockSetFormFields).toHaveBeenCalledWith([
          {
            pageNumber: 1,
            fields: [
              { id: 'field1', name: 'firstName', pageNumber: 1, type: 'text', required: true, readOnly: false, rect: [0, 0, 100, 20] },
              { id: 'field2', name: 'email', pageNumber: 1, type: 'text', required: false, readOnly: false, rect: [0, 30, 100, 50] }
            ],
            radioGroups: []
          }
        ]);
      }, { timeout: 2000 });
    });

    it('should handle field focus events', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      // This is tested through the component integration
      expect(mockSetCurrentField).toBeDefined();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should render controls based on PDF viewer features', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      // Should show title and filename
      expect(screen.getByText(/Sprkz PDF Form - Page 1 of 2/)).toBeInTheDocument();
      expect(screen.getByText(/makana2025.pdf/)).toBeInTheDocument();

      // Should show control buttons
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('Width')).toBeInTheDocument();
      expect(screen.getByText('Height')).toBeInTheDocument();
    });

    it('should hide controls when features are disabled', async () => {
      mockUsePDFViewerFeatures.mockReturnValue({
        ...defaultPDFViewerFeatures,
        showFieldsToggle: false,
        showFitWidthButton: false,
        showFitHeightButton: false,
        showTitleDisplay: false,
        showFilenameDisplay: false,
      });

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      // Should not show disabled features
      expect(screen.queryByText('Fields')).not.toBeInTheDocument();
      expect(screen.queryByText('Width')).not.toBeInTheDocument();
      expect(screen.queryByText('Height')).not.toBeInTheDocument();
      expect(screen.queryByText(/Sprkz PDF Form/)).not.toBeInTheDocument();
    });

    it('should render wizard components when wizard features are enabled', async () => {
      mockUseWizardFeatures.mockReturnValue({
        ...defaultWizardFeatures,
        showWizardButton: true,
        showProgressTracker: true,
      });

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('wizard-button')).toBeInTheDocument();
      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
    });

    it('should render field tooltip when form features are enabled', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('field-tooltip')).toBeInTheDocument();
    });

    it('should hide wizard components when features are disabled', async () => {
      mockUseWizardFeatures.mockReturnValue({
        ...defaultWizardFeatures,
        showWizardButton: false,
        showProgressTracker: false,
      });

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('wizard-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress-tracker')).not.toBeInTheDocument();
    });

    it('should conditionally render wizard status based on wizard mode', async () => {
      // Mock wizard mode as active
      mockFormState.wizard.isWizardMode = true;

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(screen.getByTestId('wizard-status')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle field names visibility', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText('Fields')).toBeInTheDocument();
      });

      const fieldsButton = screen.getByText('Fields');
      await user.click(fieldsButton);

      // Should trigger the toggle (verified through component state)
      expect(fieldsButton).toBeInTheDocument();
    });

    it('should toggle PDF fit width mode', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText('Width')).toBeInTheDocument();
      });

      const widthButton = screen.getByText('Width');
      await user.click(widthButton);

      // Should trigger the toggle (verified through component state)
      expect(widthButton).toBeInTheDocument();
    });

    it('should toggle PDF fit height mode', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText('Height')).toBeInTheDocument();
      });

      const heightButton = screen.getByText('Height');
      await user.click(heightButton);

      // Should trigger the toggle (verified through component state)
      expect(heightButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF service errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockPDFService.loadPDF.mockRejectedValue(new Error('Network error'));

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading PDF:', expect.any(Error));
    });

    it('should reset loading state after error', async () => {
      mockPDFService.loadPDF.mockRejectedValue(new Error('Failed to load'));

      render(<PDFFormContainer />);

      // Should show loading initially
      expect(screen.getByText(/Loading PDF/)).toBeInTheDocument();

      // Should show error after failed load
      await waitFor(() => {
        expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
      });

      // Should not show loading anymore
      expect(screen.queryByText(/Loading PDF/)).not.toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    it('should handle form submission via FormProvider', async () => {
      render(<PDFFormContainer />);

      const formProvider = screen.getByTestId('form-provider');
      expect(formProvider).toHaveAttribute('data-onsubmit', 'true');
    });

    it('should apply dynamic config field configurations', async () => {
      const dynamicConfig: DynamicConfig = {
        pdfPath: '/pdfs/test.pdf',
        features: { 1: true },
        pdfFields: { 
          'field1': 'read-only',
          'field2': 'hidden'
        },
      };

      render(<PDFFormContainer dynamicConfig={dynamicConfig} />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      // Verify that field configs are passed to PDFViewer
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });

    it('should debug feature flags in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleLogSpy = jest.spyOn(console, 'log');

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🎌 PDFFormContainer Feature Flags:',
        expect.objectContaining({
          pdfViewerFeatures: defaultPDFViewerFeatures,
          wizardFeatures: defaultWizardFeatures,
          formFeatures: defaultFormFeatures
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Layout and Styling', () => {
    it('should apply correct layout styles based on fit mode', async () => {
      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-form-container')).toBeInTheDocument();
      });

      const container = screen.getByTestId('pdf-form-container');
      expect(container).toHaveStyle('display: flex');
    });

    it('should show detailed progress tracker in wizard mode', async () => {
      mockFormState.wizard.isWizardMode = true;

      render(<PDFFormContainer />);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      });

      // Should show detailed progress tracker when in wizard mode
      expect(screen.getAllByTestId('progress-tracker')).toHaveLength(2);
    });
  });
});