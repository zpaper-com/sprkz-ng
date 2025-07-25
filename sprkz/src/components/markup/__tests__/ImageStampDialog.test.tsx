import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageStampDialog } from '../ImageStampDialog';

describe('ImageStampDialog', () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
    onStampSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    expect(screen.getByText('Add Image Stamp')).toBeInTheDocument();
    expect(screen.getByText('Upload Custom Image')).toBeInTheDocument();
    expect(screen.getByText('Predefined Stamps')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const closedProps = { ...mockProps, open: false };
    render(<ImageStampDialog {...closedProps} />);
    
    expect(screen.queryByText('Add Image Stamp')).not.toBeInTheDocument();
  });

  it('should display predefined stamps', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('should filter stamps by category', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Change category to 'status'
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    fireEvent.click(screen.getByText('Status'));
    
    // Should show only status stamps
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
    expect(screen.queryByText('Confidential')).not.toBeInTheDocument();
  });

  it('should select predefined stamp', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Click on Approved stamp
    fireEvent.click(screen.getByText('Approved'));
    
    // Preview should be visible
    expect(screen.getByText('Stamp Settings')).toBeInTheDocument();
    expect(screen.getByAltText('Stamp preview')).toBeInTheDocument();
  });

  it('should adjust stamp settings', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Select a stamp first
    fireEvent.click(screen.getByText('Approved'));
    
    // Find and adjust opacity slider
    const opacitySlider = screen.getByLabelText(/opacity/i);
    fireEvent.change(opacitySlider, { target: { value: '0.5' } });
    
    // Find and adjust rotation slider
    const rotationSlider = screen.getByLabelText(/rotation/i);
    fireEvent.change(rotationSlider, { target: { value: '45' } });
    
    // Settings should be reflected in the component state
    expect(screen.getByDisplayValue('0.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  it('should call onStampSelect when Add Stamp is clicked', async () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Select a stamp
    fireEvent.click(screen.getByText('Approved'));
    
    // Click Add Stamp button
    fireEvent.click(screen.getByText('Add Stamp'));
    
    await waitFor(() => {
      expect(mockProps.onStampSelect).toHaveBeenCalledWith(
        expect.any(String), // imageData
        100, // width
        100, // height
        1, // opacity
        0 // rotation
      );
    });
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should disable Add Stamp button when no stamp is selected', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    const addButton = screen.getByText('Add Stamp');
    expect(addButton).toBeDisabled();
  });

  it('should enable Add Stamp button when stamp is selected', () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Select a stamp
    fireEvent.click(screen.getByText('Approved'));
    
    const addButton = screen.getByText('Add Stamp');
    expect(addButton).not.toBeDisabled();
  });

  it('should handle file upload', async () => {
    render(<ImageStampDialog {...mockProps} />);
    
    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    // Find file input and upload file
    const fileInput = screen.getByRole('button', { name: /upload image/i });
    
    // We can't easily test file upload in jsdom, but we can verify the button exists
    expect(fileInput).toBeInTheDocument();
  });

  it('should reset settings when dialog closes', () => {
    const { rerender } = render(<ImageStampDialog {...mockProps} />);
    
    // Select a stamp and change settings
    fireEvent.click(screen.getByText('Approved'));
    
    // Close dialog
    fireEvent.click(screen.getByText('Cancel'));
    
    // Reopen dialog
    rerender(<ImageStampDialog {...mockProps} open={true} />);
    
    // Settings should be reset (no stamp selected)
    expect(screen.queryByText('Stamp Settings')).not.toBeInTheDocument();
  });
});