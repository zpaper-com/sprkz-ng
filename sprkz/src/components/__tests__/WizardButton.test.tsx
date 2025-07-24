import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardButton, WizardStatus } from '../WizardButton';

// Mock the FormContext
const mockGetWizardButtonState = jest.fn();
const mockHandleWizardButtonClick = jest.fn();
const mockGetFormProgress = jest.fn();

const mockFormState = {
  isSubmitting: false,
  wizard: {
    isWizardMode: false,
  },
};

jest.mock('../../contexts/FormContext', () => ({
  useForm: () => ({
    getWizardButtonState: mockGetWizardButtonState,
    handleWizardButtonClick: mockHandleWizardButtonClick,
    getFormProgress: mockGetFormProgress,
    state: mockFormState,
  }),
}));

// Mock Material-UI icons to avoid import issues
jest.mock('@mui/icons-material', () => ({
  PlayArrow: () => <div data-testid="start-icon" />,
  NavigateNext: () => <div data-testid="next-icon" />,
  Draw: () => <div data-testid="sign-icon" />,
  Send: () => <div data-testid="submit-icon" />,
  AutoMode: () => <div data-testid="wizard-icon" />,
}));

describe('WizardButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState.isSubmitting = false;
    mockFormState.wizard.isWizardMode = false;
    
    // Default mock returns
    mockGetFormProgress.mockReturnValue({
      completed: 2,
      total: 5,
      percentage: 40,
    });
  });

  describe('Button States', () => {
    it('should render start button state', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('should render next button state', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByTestId('next-icon')).toBeInTheDocument();
    });

    it('should render sign button state', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'sign',
        text: 'Sign',
        color: 'secondary',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByText('Sign')).toBeInTheDocument();
      expect(screen.getByTestId('sign-icon')).toBeInTheDocument();
    });

    it('should render submit button state', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByTestId('submit-icon')).toBeInTheDocument();
    });

    it('should render wizard mode text when in wizard mode', () => {
      mockFormState.wizard.isWizardMode = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByText('Wizard Mode')).toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  describe('Button Props and Variants', () => {
    beforeEach(() => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: false,
      });
    });

    it('should render with default props', () => {
      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('should render without icon when showIcon is false', () => {
      render(<WizardButton showIcon={false} />);

      expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('should apply fullWidth prop', () => {
      render(<WizardButton fullWidth />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-fullWidth');
    });

    it('should apply custom className', () => {
      render(<WizardButton className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<WizardButton size="small" />);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-sizeSmall');

      rerender(<WizardButton size="medium" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-sizeMedium');

      rerender(<WizardButton size="large" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });

    it('should render with different variants', () => {
      const { rerender } = render(<WizardButton variant="contained" />);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-contained');

      rerender(<WizardButton variant="outlined" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');

      rerender(<WizardButton variant="text" />);
      button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-text');
    });
  });

  describe('Button Colors', () => {
    it('should apply primary color', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-colorPrimary');
    });

    it('should apply warning color', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-colorWarning');
    });

    it('should apply success color', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-colorSuccess');
    });

    it('should apply secondary color', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'sign',
        text: 'Sign',
        color: 'secondary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-colorSecondary');
    });
  });

  describe('Button Disabled State', () => {
    it('should be disabled when buttonState.disabled is true', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: true,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when isSubmitting is true', () => {
      mockFormState.isSubmitting = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when both conditions are true', () => {
      mockFormState.isSubmitting = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: true,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when submitting', () => {
      mockFormState.isSubmitting = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('submit-icon')).not.toBeInTheDocument();
    });

    it('should not show loading spinner for non-submit buttons', () => {
      mockFormState.isSubmitting = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByTestId('next-icon')).toBeInTheDocument();
    });
  });

  describe('Progress Bar in Wizard Mode', () => {
    beforeEach(() => {
      mockFormState.wizard.isWizardMode = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });
    });

    it('should show progress bar when in wizard mode and showProgress is true', () => {
      render(<WizardButton showProgress={true} />);

      // Progress bar should be rendered
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(1);
    });

    it('should not show progress bar when showProgress is false', () => {
      render(<WizardButton showProgress={false} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should not show progress bar when not in wizard mode', () => {
      mockFormState.wizard.isWizardMode = false;

      render(<WizardButton showProgress={true} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Button Click Handler', () => {
    it('should call handleWizardButtonClick when clicked', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockHandleWizardButtonClick).toHaveBeenCalledTimes(1);
    });

    it('should not call handleWizardButtonClick when disabled', async () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: true,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      // Try to click the disabled button using fireEvent instead of userEvent
      // since userEvent respects disabled state and won't click
      fireEvent.click(button);

      expect(mockHandleWizardButtonClick).not.toHaveBeenCalled();
    });
  });

  describe('Tooltips', () => {
    it('should show correct tooltip for start state', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'start',
        text: 'Start',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText('Begin guided form completion')).toBeInTheDocument();
    });

    it('should show correct tooltip for next state', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText('Continue to next required field')).toBeInTheDocument();
    });

    it('should show correct tooltip for sign state', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'sign',
        text: 'Sign',
        color: 'secondary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText('Add signature to complete form')).toBeInTheDocument();
    });

    it('should show correct tooltip for submit state', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'submit',
        text: 'Submit',
        color: 'success',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText('Submit completed form')).toBeInTheDocument();
    });

    it('should show wizard mode tooltip when in wizard mode', async () => {
      const user = userEvent.setup();
      mockFormState.wizard.isWizardMode = true;
      mockGetWizardButtonState.mockReturnValue({
        type: 'next',
        text: 'Next',
        color: 'warning',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText(/Click to exit wizard mode - 2\/5 fields completed \(40%\)/)).toBeInTheDocument();
    });
  });

  describe('Default Icon Fallback', () => {
    it('should show wizard icon for unknown button type', () => {
      mockGetWizardButtonState.mockReturnValue({
        type: 'unknown' as any,
        text: 'Unknown',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      expect(screen.getByTestId('wizard-icon')).toBeInTheDocument();
    });

    it('should show wizard icon for default tooltip', async () => {
      const user = userEvent.setup();
      mockGetWizardButtonState.mockReturnValue({
        type: 'unknown' as any,
        text: 'Unknown',
        color: 'primary',
        disabled: false,
      });

      render(<WizardButton />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(await screen.findByText('Continue with form wizard')).toBeInTheDocument();
    });
  });
});

describe('WizardStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState.wizard.isWizardMode = false;
    
    mockGetFormProgress.mockReturnValue({
      completed: 3,
      total: 7,
      percentage: 43,
    });
  });

  it('should not render when not in wizard mode', () => {
    render(<WizardStatus />);

    expect(screen.queryByText(/Wizard Mode:/)).not.toBeInTheDocument();
  });

  it('should render when in wizard mode', () => {
    mockFormState.wizard.isWizardMode = true;

    render(<WizardStatus />);

    expect(screen.getByText('Wizard Mode: 3 of 7 completed (43%)')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-icon')).toBeInTheDocument();
  });

  it('should update when progress changes', () => {
    mockFormState.wizard.isWizardMode = true;
    mockGetFormProgress.mockReturnValue({
      completed: 5,
      total: 7,
      percentage: 71,
    });

    render(<WizardStatus />);

    expect(screen.getByText('Wizard Mode: 5 of 7 completed (71%)')).toBeInTheDocument();
  });

  it('should show wizard icon', () => {
    mockFormState.wizard.isWizardMode = true;

    render(<WizardStatus />);

    expect(screen.getByTestId('wizard-icon')).toBeInTheDocument();
  });
});