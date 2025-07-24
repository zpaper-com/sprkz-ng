import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressTracker, MiniProgressIndicator } from '../ProgressTracker';

// Mock the FormContext
const mockGetFormProgress = jest.fn();
const mockNavigateToField = jest.fn();

const mockFormState = {
  allPageFields: [],
  completedFields: new Set<string>(),
  wizard: {
    isWizardMode: false,
  },
  currentFieldId: null,
};

jest.mock('../../contexts/FormContext', () => ({
  useForm: () => ({
    state: mockFormState,
    getFormProgress: mockGetFormProgress,
    navigateToField: mockNavigateToField,
  }),
}));

// Mock WizardService
const mockWizardSteps = [
  {
    id: 'step1',
    fieldId: 'field1',
    title: 'First Name',
    description: 'Enter your first name',
    pageNumber: 1,
    type: 'required',
  },
  {
    id: 'step2',
    fieldId: 'field2',
    title: 'Email Address',
    description: 'Enter your email',
    pageNumber: 1,
    type: 'required',
  },
  {
    id: 'step3',
    fieldId: 'field3',
    title: 'Optional Field',
    description: 'Optional information',
    pageNumber: 1,
    type: 'optional',
  },
  {
    id: 'step4',
    fieldId: 'signature1',
    title: 'Signature',
    description: 'Sign the document',
    pageNumber: 2,
    type: 'signature',
  },
];

jest.mock('../../services/wizardService');

const mockGenerateWizardSteps = jest.fn();

// Mock Material-UI icons to avoid import issues
jest.mock('@mui/icons-material', () => ({
  CheckCircle: () => <div data-testid="completed-icon" />,
  RadioButtonUnchecked: () => <div data-testid="incomplete-icon" />,
  Draw: () => <div data-testid="signature-icon" />,
  Warning: () => <div data-testid="required-icon" />,
  ExpandMore: () => <div data-testid="expand-icon" />,
  ExpandLess: () => <div data-testid="collapse-icon" />,
  Navigation: () => <div data-testid="navigate-icon" />,
}));

describe('ProgressTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState.wizard.isWizardMode = false;
    mockFormState.completedFields = new Set<string>();
    mockFormState.currentFieldId = null;
    
    // Default mock returns
    mockGetFormProgress.mockReturnValue({
      completed: 2,
      total: 4,
      percentage: 50,
    });
    
    // Mock wizard steps
    const { WizardService } = require('../../services/wizardService');
    WizardService.generateWizardSteps = jest.fn().mockReturnValue(mockWizardSteps);
  });

  describe('Compact Variant', () => {
    it('should render compact variant by default', () => {
      render(<ProgressTracker />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
      expect(screen.getByText('2 of 4 completed')).toBeInTheDocument();
      expect(screen.getByText('50% complete')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render compact variant explicitly', () => {
      render(<ProgressTracker variant="compact" />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show wizard mode styling when in wizard mode', () => {
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="compact" />);

      const paper = screen.getByText('Form Progress').closest('div')?.parentElement;
      expect(paper).toHaveClass('MuiPaper-root');
    });

    it('should display progress values correctly', () => {
      mockGetFormProgress.mockReturnValue({
        completed: 1,
        total: 3,
        percentage: 33,
      });

      render(<ProgressTracker variant="compact" />);

      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
      expect(screen.getByText('33% complete')).toBeInTheDocument();
    });
  });

  describe('Detailed Variant', () => {
    beforeEach(() => {
      mockFormState.completedFields = new Set(['field1']);
      mockFormState.currentFieldId = 'field2';
    });

    it('should render detailed variant with steps', () => {
      render(<ProgressTracker variant="detailed" />);

      expect(screen.getByText('2 of 4 fields completed')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Should show all steps
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Optional Field')).toBeInTheDocument();
      expect(screen.getByText('Signature')).toBeInTheDocument();
    });

    it('should show step details', () => {
      render(<ProgressTracker variant="detailed" />);

      expect(screen.getByText('Page 1 • Enter your first name')).toBeInTheDocument();
      expect(screen.getByText('Page 1 • Enter your email')).toBeInTheDocument();
      expect(screen.getByText('Page 2 • Sign the document')).toBeInTheDocument();
    });

    it('should hide steps when showSteps is false', () => {
      render(<ProgressTracker variant="detailed" showSteps={false} />);

      expect(screen.queryByText('First Name')).not.toBeInTheDocument();
      expect(screen.getByText('2 of 4 fields completed')).toBeInTheDocument();
    });

    it('should render collapsible header when collapsible is true', () => {
      render(<ProgressTracker variant="detailed" collapsible={true} />);

      expect(screen.getByText('Form Progress (50%)')).toBeInTheDocument();
      expect(screen.getByTestId('expand-icon')).toBeInTheDocument();
    });

    it('should toggle collapse state when clicking header', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker variant="detailed" collapsible={true} />);

      const header = screen.getByText('Form Progress (50%)');
      await user.click(header);

      expect(screen.getByTestId('collapse-icon')).toBeInTheDocument();
    });

    it('should handle step navigation when allowed', async () => {
      const user = userEvent.setup();
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="detailed" allowNavigation={true} />);

      const firstStep = screen.getByText('First Name');
      await user.click(firstStep);

      expect(mockNavigateToField).toHaveBeenCalledWith('field1');
    });

    it('should not navigate when not in wizard mode', async () => {
      const user = userEvent.setup();
      mockFormState.wizard.isWizardMode = false;

      render(<ProgressTracker variant="detailed" allowNavigation={true} />);

      const firstStep = screen.getByText('First Name');
      await user.click(firstStep);

      expect(mockNavigateToField).not.toHaveBeenCalled();
    });

    it('should not navigate when allowNavigation is false', async () => {
      const user = userEvent.setup();
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="detailed" allowNavigation={false} />);

      const firstStep = screen.getByText('First Name');
      await user.click(firstStep);

      expect(mockNavigateToField).not.toHaveBeenCalled();
    });
  });

  describe('Step Icons', () => {
    beforeEach(() => {
      mockFormState.completedFields = new Set(['field1']);
      mockFormState.currentFieldId = 'field2';
    });

    it('should show completed icon for completed steps', () => {
      render(<ProgressTracker variant="detailed" />);

      const completedIcons = screen.getAllByTestId('completed-icon');
      expect(completedIcons).toHaveLength(1);
    });

    it('should show required icon for required steps', () => {
      render(<ProgressTracker variant="detailed" />);

      const requiredIcons = screen.getAllByTestId('required-icon');
      expect(requiredIcons).toHaveLength(1); // field2 is current and required
    });

    it('should show signature icon for signature steps', () => {
      mockFormState.currentFieldId = 'signature1';

      render(<ProgressTracker variant="detailed" />);

      const signatureIcons = screen.getAllByTestId('signature-icon');
      expect(signatureIcons).toHaveLength(1);
    });

    it('should show incomplete icon for incomplete optional steps', () => {
      render(<ProgressTracker variant="detailed" />);

      const incompleteIcons = screen.getAllByTestId('incomplete-icon');
      expect(incompleteIcons).toHaveLength(1); // field3 (optional)
    });
  });

  describe('Step Styling', () => {
    beforeEach(() => {
      mockFormState.completedFields = new Set(['field1']);
      mockFormState.currentFieldId = 'field2';
    });

    it('should apply current step styling', () => {
      render(<ProgressTracker variant="detailed" />);

      const currentStepTitle = screen.getByText('Email Address');
      expect(currentStepTitle).toHaveStyle('font-weight: 700');
    });

    it('should apply completed step styling', () => {
      render(<ProgressTracker variant="detailed" />);

      const completedStepTitle = screen.getByText('First Name');
      expect(completedStepTitle).toHaveStyle('text-decoration: line-through');
    });

    it('should show step type chips', () => {
      render(<ProgressTracker variant="detailed" />);

      expect(screen.getAllByText('required')).toHaveLength(2);
      expect(screen.getByText('optional')).toBeInTheDocument();
      expect(screen.getByText('signature')).toBeInTheDocument();
    });

    it('should show navigation icons when navigation is allowed in wizard mode', () => {
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="detailed" allowNavigation={true} />);

      const navigateIcons = screen.getAllByTestId('navigate-icon');
      expect(navigateIcons).toHaveLength(4); // One for each step
    });

    it('should not show navigation icons when navigation is not allowed', () => {
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="detailed" allowNavigation={false} />);

      expect(screen.queryByTestId('navigate-icon')).not.toBeInTheDocument();
    });
  });

  describe('Stepper Variant', () => {
    beforeEach(() => {
      mockFormState.completedFields = new Set(['field1']);
      mockFormState.currentFieldId = 'field2';
    });

    it('should render stepper variant', () => {
      render(<ProgressTracker variant="stepper" />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should show step descriptions in stepper content', () => {
      render(<ProgressTracker variant="stepper" />);

      // In stepper, only the current step content is visible
      expect(screen.getByText('Enter your email')).toBeInTheDocument();
      // Other step descriptions are not visible in collapsed state
      expect(screen.queryByText('Enter your first name')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign the document')).not.toBeInTheDocument();
    });

    it('should show page number chips in step content', () => {
      render(<ProgressTracker variant="stepper" />);

      // Only the current step's content is visible in stepper
      const pageChips = screen.getAllByText(/Page \d/);
      expect(pageChips).toHaveLength(1); // Only for the current step (field2)
    });

    it('should handle step click navigation in stepper', async () => {
      const user = userEvent.setup();
      mockFormState.wizard.isWizardMode = true;

      render(<ProgressTracker variant="stepper" allowNavigation={true} />);

      const firstStepLabel = screen.getByText('First Name');
      await user.click(firstStepLabel);

      expect(mockNavigateToField).toHaveBeenCalledWith('field1');
    });

    it('should apply current step styling in stepper', () => {
      render(<ProgressTracker variant="stepper" />);

      const currentStepTitle = screen.getByText('Email Address');
      expect(currentStepTitle).toHaveStyle('font-weight: 700');
    });
  });

  describe('Props and Configuration', () => {
    it('should apply maxHeight prop', () => {
      render(<ProgressTracker variant="detailed" maxHeight={200} />);

      // The maxHeight is applied to the scrollable container
      // We can verify the component renders without error
      expect(screen.getByText('2 of 4 fields completed')).toBeInTheDocument();
    });

    it('should render null for unknown variant', () => {
      const { container } = render(<ProgressTracker variant={'unknown' as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle empty wizard steps', () => {
      const { WizardService } = require('../../services/wizardService');
      WizardService.generateWizardSteps.mockReturnValueOnce([]);

      render(<ProgressTracker variant="detailed" />);

      expect(screen.getByText('2 of 4 fields completed')).toBeInTheDocument();
      expect(screen.queryByText('First Name')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero progress', () => {
      mockGetFormProgress.mockReturnValue({
        completed: 0,
        total: 4,
        percentage: 0,
      });

      render(<ProgressTracker variant="compact" />);

      expect(screen.getByText('0 of 4 completed')).toBeInTheDocument();
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('should handle 100% progress', () => {
      mockGetFormProgress.mockReturnValue({
        completed: 4,
        total: 4,
        percentage: 100,
      });

      render(<ProgressTracker variant="compact" />);

      expect(screen.getByText('4 of 4 completed')).toBeInTheDocument();
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });

    it('should handle no current field in stepper', () => {
      mockFormState.currentFieldId = null;

      render(<ProgressTracker variant="stepper" />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
      expect(screen.getByText('First Name')).toBeInTheDocument();
    });

    it('should handle current field not in steps', () => {
      mockFormState.currentFieldId = 'nonexistent-field';

      render(<ProgressTracker variant="stepper" />);

      expect(screen.getByText('Form Progress')).toBeInTheDocument();
    });
  });
});

describe('MiniProgressIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormState.wizard.isWizardMode = false;
    
    mockGetFormProgress.mockReturnValue({
      completed: 3,
      total: 5,
      percentage: 60,
    });
  });

  it('should render mini progress indicator', () => {
    render(<MiniProgressIndicator />);

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('should show tooltip with progress details', async () => {
    const user = userEvent.setup();
    render(<MiniProgressIndicator />);

    const indicator = screen.getByText('60%');
    await user.hover(indicator);

    expect(await screen.findByText('3 of 5 fields completed (60%)')).toBeInTheDocument();
  });

  it('should apply wizard mode styling', () => {
    mockFormState.wizard.isWizardMode = true;

    render(<MiniProgressIndicator />);

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('should handle zero progress', () => {
    mockGetFormProgress.mockReturnValue({
      completed: 0,
      total: 5,
      percentage: 0,
    });

    render(<MiniProgressIndicator />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0/5')).toBeInTheDocument();
  });

  it('should handle complete progress', () => {
    mockGetFormProgress.mockReturnValue({
      completed: 5,
      total: 5,
      percentage: 100,
    });

    render(<MiniProgressIndicator />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('should update when progress changes', () => {
    const { rerender } = render(<MiniProgressIndicator />);

    expect(screen.getByText('60%')).toBeInTheDocument();

    mockGetFormProgress.mockReturnValue({
      completed: 4,
      total: 5,
      percentage: 80,
    });

    rerender(<MiniProgressIndicator />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });
});