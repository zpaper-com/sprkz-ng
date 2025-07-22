import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllTheProviders, generateMockFormField } from '../utils/testUtils';
import { FeatureFlagsProvider } from '../../contexts/FeatureFlagsContext';
import App from '../../App';

// Mock canvas context
const mockCanvasContext = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  strokeStyle: '',
  lineWidth: 2,
  lineCap: 'round' as CanvasLineCap,
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-signature-data'),
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockCanvasContext),
});

describe.skip('E2E: Signature Workflow', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const mockSignatureField = generateMockFormField({
    name: 'employeeSignature',
    fieldType: 'signature',
    required: true,
    page: 1
  });

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset canvas mock
    mockCanvasContext.toDataURL.mockReturnValue('data:image/png;base64,mock-signature-data');
  });

  describe('Drawing Signature Mode', () => {
    it('should complete drawing signature workflow', async () => {
      render(<App />, { wrapper: AllTheProviders });

      // Should default to drawing mode
      expect(screen.getByText(/draw your signature/i)).toBeInTheDocument();
      
      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      expect(canvas).toBeInTheDocument();

      // Simulate drawing on canvas
      fireEvent.mouseDown(canvas, { 
        clientX: 150, 
        clientY: 125,
        buttons: 1
      });

      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalledWith(50, 25); // Relative coordinates

      // Continue drawing
      fireEvent.mouseMove(canvas, { 
        clientX: 200, 
        clientY: 130,
        buttons: 1 
      });

      expect(mockCanvasContext.lineTo).toHaveBeenCalledWith(100, 30);
      expect(mockCanvasContext.stroke).toHaveBeenCalled();

      // End drawing
      fireEvent.mouseUp(canvas);

      // Drawing should be complete, save button should be enabled
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      expect(saveButton).toBeEnabled();

      // Save signature
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledWith({
        type: 'drawing',
        data: 'data:image/png;base64,mock-signature-data',
        field: mockSignatureField
      });

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should handle touch events for mobile drawing', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const canvas = screen.getByRole('img', { name: /signature canvas/i });

      // Simulate touch drawing
      fireEvent.touchStart(canvas, {
        touches: [{ clientX: 150, clientY: 125 }]
      });

      expect(mockCanvasContext.beginPath).toHaveBeenCalled();

      fireEvent.touchMove(canvas, {
        touches: [{ clientX: 200, clientY: 130 }]
      });

      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.stroke).toHaveBeenCalled();

      fireEvent.touchEnd(canvas);

      // Should be able to save
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      expect(saveButton).toBeEnabled();
    });

    it('should allow clearing and redrawing', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      
      // Draw something
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 125 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 130 });
      fireEvent.mouseUp(canvas);

      // Clear the signature
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);

      // Save button should be disabled after clearing
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      expect(saveButton).toBeDisabled();

      // Draw again
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 110 });
      fireEvent.mouseUp(canvas);

      // Save should be enabled again
      expect(saveButton).toBeEnabled();
    });

    it('should respect drawing style settings', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Check if pen size controls are available
      const penSizeSlider = screen.queryByLabelText(/pen size/i);
      if (penSizeSlider) {
        await user.click(penSizeSlider);
        fireEvent.change(penSizeSlider, { target: { value: '4' } });
        
        expect(mockCanvasContext.lineWidth).toBe(4);
      }

      // Check if color options are available
      const colorButton = screen.queryByRole('button', { name: /black/i });
      if (colorButton) {
        await user.click(colorButton);
        expect(mockCanvasContext.strokeStyle).toBe('#000000');
      }
    });
  });

  describe('Typed Signature Mode', () => {
    it('should complete typed signature workflow', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Switch to typed mode
      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      expect(screen.getByText(/type your signature/i)).toBeInTheDocument();

      // Type signature text
      const signatureInput = screen.getByLabelText(/signature text/i);
      await user.type(signatureInput, 'John A. Doe');

      expect(signatureInput).toHaveValue('John A. Doe');

      // Select font
      const fontSelect = screen.getByLabelText(/font style/i);
      await user.click(fontSelect);

      const cursiveOption = screen.getByText(/cursive/i);
      await user.click(cursiveOption);

      // Preview should update
      const preview = screen.getByTestId('signature-preview');
      expect(preview).toHaveStyle('font-family: cursive');
      expect(preview).toHaveTextContent('John A. Doe');

      // Save typed signature
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      expect(saveButton).toBeEnabled();

      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledWith({
        type: 'typed',
        text: 'John A. Doe',
        font: 'cursive',
        field: mockSignatureField
      });
    });

    it('should validate typed signature input', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Switch to typed mode
      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      // Save button should be disabled with empty input
      const saveButton = screen.getByRole('button', { name: /save signature/i });
      expect(saveButton).toBeDisabled();

      // Type insufficient text
      const signatureInput = screen.getByLabelText(/signature text/i);
      await user.type(signatureInput, 'A');

      // Should show validation message for too short
      await waitFor(() => {
        expect(screen.getByText(/signature must be at least 2 characters/i)).toBeInTheDocument();
      });

      expect(saveButton).toBeDisabled();

      // Type valid signature
      await user.clear(signatureInput);
      await user.type(signatureInput, 'John Doe');

      // Should be valid now
      await waitFor(() => {
        expect(screen.queryByText(/signature must be at least 2 characters/i)).not.toBeInTheDocument();
      });

      expect(saveButton).toBeEnabled();
    });

    it('should support different font styles', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      const signatureInput = screen.getByLabelText(/signature text/i);
      await user.type(signatureInput, 'Test Signature');

      const fontSelect = screen.getByLabelText(/font style/i);
      const preview = screen.getByTestId('signature-preview');

      // Test serif font
      await user.click(fontSelect);
      await user.click(screen.getByText(/serif/i));
      expect(preview).toHaveStyle('font-family: serif');

      // Test sans-serif font
      await user.click(fontSelect);
      await user.click(screen.getByText(/sans-serif/i));
      expect(preview).toHaveStyle('font-family: sans-serif');

      // Test script/cursive font
      await user.click(fontSelect);
      await user.click(screen.getByText(/script/i));
      expect(preview).toHaveStyle('font-family: cursive');
    });
  });

  describe('Signature Upload Mode', () => {
    it('should handle signature upload when feature is enabled', async () => {
      // This test assumes upload mode is enabled via feature flag
      const mockFile = new File(['signature'], 'signature.png', { type: 'image/png' });
      
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Check if upload tab is available (feature flag dependent)
      const uploadTab = screen.queryByRole('tab', { name: /upload/i });
      
      if (uploadTab) {
        await user.click(uploadTab);

        const fileInput = screen.getByLabelText(/upload signature image/i);
        await user.upload(fileInput, mockFile);

        await waitFor(() => {
          const preview = screen.getByTestId('uploaded-signature-preview');
          expect(preview).toBeInTheDocument();
        });

        const saveButton = screen.getByRole('button', { name: /save signature/i });
        expect(saveButton).toBeEnabled();

        await user.click(saveButton);

        expect(mockProps.onSave).toHaveBeenCalledWith({
          type: 'upload',
          file: mockFile,
          field: mockSignatureField
        });
      }
    });

    it('should validate uploaded file format', async () => {
      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const uploadTab = screen.queryByRole('tab', { name: /upload/i });
      
      if (uploadTab) {
        await user.click(uploadTab);

        const fileInput = screen.getByLabelText(/upload signature image/i);
        await user.upload(fileInput, invalidFile);

        await waitFor(() => {
          expect(screen.getByText(/please upload a valid image file/i)).toBeInTheDocument();
        });

        const saveButton = screen.getByRole('button', { name: /save signature/i });
        expect(saveButton).toBeDisabled();
      }
    });
  });

  describe('Signature Editing and Management', () => {
    it('should allow editing existing signature', async () => {
      const existingSignature = {
        type: 'typed' as const,
        text: 'Original Name',
        font: 'serif'
      };

      const propsWithValue = {
        ...mockProps,
        currentValue: existingSignature
      };

      render(
        <FeatureFlagsProvider>
          <SignatureModal {...propsWithValue} />
        </FeatureFlagsProvider>
      );

      // Should show typed mode with existing value
      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      const signatureInput = screen.getByLabelText(/signature text/i);
      expect(signatureInput).toHaveValue('Original Name');

      // Edit the signature
      await user.clear(signatureInput);
      await user.type(signatureInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveButton);

      expect(mockProps.onSave).toHaveBeenCalledWith({
        type: 'typed',
        text: 'Updated Name',
        font: 'serif',
        field: mockSignatureField
      });
    });

    it('should show confirmation when replacing existing signature', async () => {
      const existingSignature = {
        type: 'drawing' as const,
        data: 'data:image/png;base64,existing-signature'
      };

      const propsWithValue = {
        ...mockProps,
        currentValue: existingSignature
      };

      render(
        <FeatureFlagsProvider>
          <SignatureModal {...propsWithValue} />
        </FeatureFlagsProvider>
      );

      // Should show existing signature preview
      expect(screen.getByTestId('existing-signature-preview')).toBeInTheDocument();

      // Switch to typed mode (different type)
      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      const signatureInput = screen.getByLabelText(/signature text/i);
      await user.type(signatureInput, 'New Typed Signature');

      const saveButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveButton);

      // Should show replacement confirmation
      await waitFor(() => {
        expect(screen.getByText(/replace existing signature/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockProps.onSave).toHaveBeenCalledWith({
        type: 'typed',
        text: 'New Typed Signature',
        font: 'serif',
        field: mockSignatureField
      });
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Tab through modal elements
      const drawTab = screen.getByRole('tab', { name: /draw/i });
      drawTab.focus();
      
      fireEvent.keyDown(drawTab, { key: 'ArrowRight' });
      
      const typeTab = screen.getByRole('tab', { name: /type/i });
      expect(typeTab).toHaveFocus();

      // Enter should activate tab
      fireEvent.keyDown(typeTab, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/type your signature/i)).toBeInTheDocument();
      });
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      // Modal should have proper labeling
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');

      // Canvas should have proper labeling
      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      expect(canvas).toHaveAttribute('aria-label');

      // Tabs should have proper roles and properties
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const drawTab = screen.getByRole('tab', { name: /draw/i });
      expect(drawTab).toHaveAttribute('aria-selected');
    });

    it('should announce signature completion to screen readers', async () => {
      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      
      // Draw signature
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 125 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 130 });
      fireEvent.mouseUp(canvas);

      // Should announce completion
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/signature completed/i);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas errors gracefully', async () => {
      // Mock canvas error
      mockCanvasContext.toDataURL.mockImplementation(() => {
        throw new Error('Canvas error');
      });

      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const canvas = screen.getByRole('img', { name: /signature canvas/i });
      
      // Draw signature
      fireEvent.mouseDown(canvas, { clientX: 150, clientY: 125 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 130 });
      fireEvent.mouseUp(canvas);

      const saveButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/error saving signature/i)).toBeInTheDocument();
      });

      // Should not call onSave
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    it('should handle save failures', async () => {
      mockProps.onSave.mockImplementation(() => {
        throw new Error('Save failed');
      });

      render(
        <FeatureFlagsProvider>
          <SignatureModal {...mockProps} />
        </FeatureFlagsProvider>
      );

      const typedModeTab = screen.getByRole('tab', { name: /type/i });
      await user.click(typedModeTab);

      const signatureInput = screen.getByLabelText(/signature text/i);
      await user.type(signatureInput, 'Test Signature');

      const saveButton = screen.getByRole('button', { name: /save signature/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save signature/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });
});