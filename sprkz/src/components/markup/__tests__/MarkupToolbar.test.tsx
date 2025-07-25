import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkupToolbar } from '../MarkupToolbar';
import { useMarkupFeatures } from '../../../hooks/useFeatureFlags';

// Mock the feature flags hook
jest.mock('../../../hooks/useFeatureFlags', () => ({
  useMarkupFeatures: jest.fn(),
}));

const mockUseMarkupFeatures = useMarkupFeatures as jest.MockedFunction<typeof useMarkupFeatures>;

describe('MarkupToolbar', () => {
  const mockProps = {
    activeTool: null,
    onToolSelect: jest.fn(),
    collapsed: false,
    onCollapseToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when markup toolbar feature is disabled', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: false,
      showImageStamp: false,
      showHighlightArea: false,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: false,
    });

    const { container } = render(<MarkupToolbar {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when markup toolbar feature is enabled', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true,
      showImageStamp: true,
      showHighlightArea: true,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: true,
    });

    render(<MarkupToolbar {...mockProps} />);
    
    expect(screen.getByText('Markup Tools')).toBeInTheDocument();
    expect(screen.getByText('Image Stamp')).toBeInTheDocument();
    expect(screen.getByText('Highlight Area')).toBeInTheDocument();
  });

  it('should call onToolSelect when tool is clicked', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true,
      showImageStamp: true,
      showHighlightArea: false,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: true,
    });

    render(<MarkupToolbar {...mockProps} />);
    
    fireEvent.click(screen.getByText('Image Stamp'));
    expect(mockProps.onToolSelect).toHaveBeenCalledWith('image-stamp');
  });

  it('should toggle tool selection', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true,
      showImageStamp: true,
      showHighlightArea: false,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: true,
    });

    const propsWithActiveTool = {
      ...mockProps,
      activeTool: 'image-stamp' as const,
    };

    render(<MarkupToolbar {...propsWithActiveTool} />);
    
    // Click the already active tool should deactivate it
    fireEvent.click(screen.getByText('Image Stamp'));
    expect(mockProps.onToolSelect).toHaveBeenCalledWith(null);
  });

  it('should render collapsed state', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true,
      showImageStamp: true,
      showHighlightArea: true,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: true,
    });

    const collapsedProps = {
      ...mockProps,
      collapsed: true,
    };

    render(<MarkupToolbar {...collapsedProps} />);
    
    // In collapsed state, text labels should not be visible
    expect(screen.queryByText('Image Stamp')).not.toBeInTheDocument();
    expect(screen.queryByText('Highlight Area')).not.toBeInTheDocument();
    
    // But icons should still be accessible via tooltips
    expect(screen.getByTitle(/Image Stamp/)).toBeInTheDocument();
  });

  it('should call onCollapseToggle when collapse button is clicked', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true,
      showImageStamp: true,
      showHighlightArea: false,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: true,
    });

    render(<MarkupToolbar {...mockProps} />);
    
    // Find and click the collapse button
    const collapseButton = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(collapseButton);
    
    expect(mockProps.onCollapseToggle).toHaveBeenCalled();
  });

  it('should not render if no tools are enabled', () => {
    mockUseMarkupFeatures.mockReturnValue({
      showMarkupToolbar: true, // Toolbar feature is enabled
      showImageStamp: false,   // But no individual tools are enabled
      showHighlightArea: false,
      showMarkupSignature: false,
      showDateTimeStamp: false,
      showTextArea: false,
      showImageAttachment: false,
      hasAnyMarkupFeatures: false,
    });

    const { container } = render(<MarkupToolbar {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });
});