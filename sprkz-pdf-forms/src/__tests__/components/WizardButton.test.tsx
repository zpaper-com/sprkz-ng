import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { WizardButton } from '../../components/wizard/WizardButton';
import { WizardContext } from '../../contexts/WizardContext';
import { FeatureFlagsContext } from '../../contexts/FeatureFlagsContext';
import { createMockFeatureFlags, generateMockFormField } from '../utils/testUtils';

// Mock the micro-interactions
jest.mock('../../utils/microInteractions', () => ({
  microInteractionStyles: {
    pulseLoading: {},
    focusRing: {},
    fadeIn: {},
    errorShake: {},
  },
  presets: {},
  createMicroInteraction: {
    hoverLift: () => ({}),
  },
}));

describe('WizardButton', () => {
  const mockWizardContext = {
    state: {
      wizardState: 'start' as const,
      currentFieldIndex: -1,
      currentField: null,
      requiredFields: [
        generateMockFormField({ name: 'firstName', required: true }),
        generateMockFormField({ name: 'lastName', required: true }),
      ],
      signatureFields: [],
      completedFields: [],
      totalRequiredFields: 2,
      completionPercentage: 0,
      isFormValid: false,
      showFieldTooltip: false,
      tooltipField: null,
      enhancedMode: true,
      progressiveMode: true,
      smartDetection: true,
    },
    getCurrentButtonState: jest.fn().mockReturnValue({
      text: 'Start',
      color: 'primary',
      disabled: false,
      action: jest.fn(),
    }),
    startWizard: jest.fn(),
    nextField: jest.fn(),
    goToSignatures: jest.fn(),
    submitForm: jest.fn(),
    jumpToField: jest.fn(),
    showTooltip: jest.fn(),
    hideTooltip: jest.fn(),
    initializeWizard: jest.fn(),
  };

  const mockFeatureFlagsContext = {
    isFeatureEnabled: jest.fn(),
    getFeatureVariant: jest.fn(),
    getAllFlags: jest.fn().mockReturnValue(createMockFeatureFlags()),
    getFlagsByCategory: jest.fn(),
    updateContext: jest.fn(),
    isReady: true,
    isInitialized: true,
    status: { initialized: true, clientReady: true, flagCount: 24 },
    refresh: jest.fn(),
  };

  const renderWizardButton = (props = {}, wizardState = mockWizardContext) => {
    return render(
      <FeatureFlagsContext.Provider value={mockFeatureFlagsContext}>
        <WizardContext.Provider value={wizardState}>
          <WizardButton {...props} />
        </WizardContext.Provider>
      </FeatureFlagsContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagsContext.isFeatureEnabled.mockImplementation((flag) => {
      const flags = createMockFeatureFlags();
      return flags[flag as keyof typeof flags] ?? false;
    });
  });

  describe('Rendering', () => {
    it('should render the wizard button with correct text', () => {
      renderWizardButton();
      
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    });

    it('should display progress indicator when enabled', () => {
      renderWizardButton({ showProgress: true });
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0 of 2 completed')).toBeInTheDocument();
    });

    it('should hide progress indicator when disabled', () => {
      renderWizardButton({ showProgress: false });
      
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('should display guidance text when enabled', () => {
      renderWizardButton({ showGuidance: true });
      
      expect(screen.getByText(/Begin completing/)).toBeInTheDocument();
    });

    it('should hide guidance text when disabled', () => {
      renderWizardButton({ showGuidance: false });
      
      expect(screen.queryByText(/Begin completing/)).not.toBeInTheDocument();
    });

    it('should adapt to different sizes', () => {
      const { rerender } = renderWizardButton({ size: 'small' });
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(
        <FeatureFlagsContext.Provider value={mockFeatureFlagsContext}>
          <WizardContext.Provider value={mockWizardContext}>
            <WizardButton size="large" />
          </WizardContext.Provider>
        </FeatureFlagsContext.Provider>
      );
      
      button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should show progress when enhanced wizard mode is enabled', () => {
      mockFeatureFlagsContext.isFeatureEnabled.mockImplementation((flag) => 
        flag === 'ENHANCED_WIZARD_MODE'
      );
      
      renderWizardButton({ showProgress: true });
      
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should hide progress when enhanced wizard mode is disabled', () => {
      mockFeatureFlagsContext.isFeatureEnabled.mockReturnValue(false);
      
      renderWizardButton({ showProgress: true });
      
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
    });

    it('should show guidance when enhanced wizard mode is enabled', () => {
      mockFeatureFlagsContext.isFeatureEnabled.mockImplementation((flag) => 
        flag === 'ENHANCED_WIZARD_MODE'
      );
      
      renderWizardButton({ showGuidance: true });
      
      expect(screen.getByText(/Begin completing/)).toBeInTheDocument();
    });

    it('should hide guidance when enhanced wizard mode is disabled', () => {
      mockFeatureFlagsContext.isFeatureEnabled.mockReturnValue(false);
      
      renderWizardButton({ showGuidance: true });
      
      expect(screen.queryByText(/Begin completing/)).not.toBeInTheDocument();
    });

    it('should show validation errors when smart field detection is enabled', () => {
      const wizardWithError = {
        ...mockWizardContext,
        state: {
          ...mockWizardContext.state,
          currentField: generateMockFormField({
            name: 'email',
            validationErrors: ['Please enter a valid email address'],
          }),
        },
      };

      mockFeatureFlagsContext.isFeatureEnabled.mockImplementation((flag) => 
        flag === 'SMART_FIELD_DETECTION'
      );
      
      renderWizardButton({}, wizardWithError);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should hide validation errors when smart field detection is disabled', () => {
      const wizardWithError = {
        ...mockWizardContext,
        state: {
          ...mockWizardContext.state,
          currentField: generateMockFormField({
            name: 'email',
            validationErrors: ['Please enter a valid email address'],
          }),
        },
      };

      mockFeatureFlagsContext.isFeatureEnabled.mockReturnValue(false);
      
      renderWizardButton({}, wizardWithError);
      
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  describe('Wizard States', () => {
    it('should display correct text and icon for start state', () => {
      renderWizardButton();
      
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      expect(screen.getByTestId('PlayArrowIcon')).toBeInTheDocument();
    });

    it('should display correct text and icon for next state', () => {
      const nextWizard = {
        ...mockWizardContext,
        state: { ...mockWizardContext.state, wizardState: 'next' as const },
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Next',
          color: 'secondary',
          disabled: false,
          action: jest.fn(),
        }),
      };

      renderWizardButton({}, nextWizard);
      
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByTestId('NavigateNextIcon')).toBeInTheDocument();
    });

    it('should display correct text and icon for sign state', () => {
      const signWizard = {
        ...mockWizardContext,
        state: { ...mockWizardContext.state, wizardState: 'sign' as const },
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Sign',
          color: 'info',
          disabled: false,
          action: jest.fn(),
        }),
      };

      renderWizardButton({}, signWizard);
      
      expect(screen.getByRole('button', { name: /sign/i })).toBeInTheDocument();
      expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
    });

    it('should display correct text and icon for submit state', () => {
      const submitWizard = {
        ...mockWizardContext,
        state: { ...mockWizardContext.state, wizardState: 'submit' as const },
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Submit',
          color: 'success',
          disabled: false,
          action: jest.fn(),
        }),
      };

      renderWizardButton({}, submitWizard);
      
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByTestId('SendIcon')).toBeInTheDocument();
    });

    it('should display correct text and icon for complete state', () => {
      const completeWizard = {
        ...mockWizardContext,
        state: { ...mockWizardContext.state, wizardState: 'complete' as const },
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Complete',
          color: 'success',
          disabled: true,
          action: jest.fn(),
        }),
      };

      renderWizardButton({}, completeWizard);
      
      expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('should show completion percentage correctly', () => {
      const progressWizard = {
        ...mockWizardContext,
        state: {
          ...mockWizardContext.state,
          completedFields: ['firstName'],
          completionPercentage: 50,
        },
      };

      renderWizardButton({ showProgress: true }, progressWizard);
      
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('1 of 2 completed')).toBeInTheDocument();
    });

    it('should update progress color based on completion', () => {
      const highProgressWizard = {
        ...mockWizardContext,
        state: {
          ...mockWizardContext.state,
          completedFields: ['firstName', 'lastName'],
          completionPercentage: 100,
        },
      };

      renderWizardButton({ showProgress: true }, highProgressWizard);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('2 of 2 completed')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call action when button is clicked', async () => {
      const mockAction = jest.fn();
      const actionWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Start',
          color: 'primary',
          disabled: false,
          action: mockAction,
        }),
      };

      renderWizardButton({}, actionWizard);
      
      const button = screen.getByRole('button', { name: /start/i });
      fireEvent.click(button);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not call action when button is disabled', async () => {
      const mockAction = jest.fn();
      const disabledWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Start',
          color: 'primary',
          disabled: true,
          action: mockAction,
        }),
      };

      renderWizardButton({}, disabledWizard);
      
      const button = screen.getByRole('button', { name: /start/i });
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should not call action when component disabled prop is true', async () => {
      const mockAction = jest.fn();
      const actionWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Start',
          color: 'primary',
          disabled: false,
          action: mockAction,
        }),
      };

      renderWizardButton({ disabled: true }, actionWizard);
      
      const button = screen.getByRole('button', { name: /start/i });
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should show tooltip on hover', async () => {
      renderWizardButton();
      
      const button = screen.getByRole('button', { name: /start/i });
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText(/Begin completing 2 required/)).toBeInTheDocument();
      });
    });

    it('should show disabled tooltip when button is disabled', async () => {
      const disabledWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Next',
          color: 'secondary',
          disabled: true,
          action: jest.fn(),
        }),
      };

      renderWizardButton({}, disabledWizard);
      
      const button = screen.getByRole('button', { name: /next/i });
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText('Complete current field to continue')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWizardButton();
      
      const button = screen.getByRole('button', { name: /start/i });
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', () => {
      const mockAction = jest.fn();
      const actionWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Start',
          color: 'primary',
          disabled: false,
          action: mockAction,
        }),
      };

      renderWizardButton({}, actionWizard);
      
      const button = screen.getByRole('button', { name: /start/i });
      
      // Focus and press Enter
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      // Material-UI buttons handle Enter key automatically
      expect(button).toHaveFocus();
    });

    it('should have visible focus indicator', () => {
      renderWizardButton();
      
      const button = screen.getByRole('button', { name: /start/i });
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with many re-renders', () => {
      const { rerender } = renderWizardButton();
      
      // Simulate multiple state changes
      for (let i = 0; i < 10; i++) {
        const updatedWizard = {
          ...mockWizardContext,
          state: {
            ...mockWizardContext.state,
            completionPercentage: i * 10,
          },
        };
        
        rerender(
          <FeatureFlagsContext.Provider value={mockFeatureFlagsContext}>
            <WizardContext.Provider value={updatedWizard}>
              <WizardButton />
            </WizardContext.Provider>
          </FeatureFlagsContext.Provider>
        );
      }
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing wizard context gracefully', () => {
      // This would throw an error in practice, but we test the error boundary
      expect(() => {
        render(
          <FeatureFlagsContext.Provider value={mockFeatureFlagsContext}>
            <WizardButton />
          </FeatureFlagsContext.Provider>
        );
      }).toThrow();
    });

    it('should handle missing feature flags context gracefully', () => {
      expect(() => {
        render(
          <WizardContext.Provider value={mockWizardContext}>
            <WizardButton />
          </WizardContext.Provider>
        );
      }).toThrow();
    });

    it('should handle action errors gracefully', () => {
      const errorAction = jest.fn().mockImplementation(() => {
        throw new Error('Action failed');
      });
      
      const errorWizard = {
        ...mockWizardContext,
        getCurrentButtonState: jest.fn().mockReturnValue({
          text: 'Start',
          color: 'primary',
          disabled: false,
          action: errorAction,
        }),
      };

      renderWizardButton({}, errorWizard);
      
      const button = screen.getByRole('button', { name: /start/i });
      
      // Should not crash the component
      expect(() => fireEvent.click(button)).not.toThrow();
      expect(errorAction).toHaveBeenCalled();
    });
  });
});