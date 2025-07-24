import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignatureModal } from '../SignatureModal';

// Mock console methods to avoid noise in tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Create comprehensive Canvas mocks
const mockContext = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  measureText: jest.fn(() => ({
    width: 100,
    actualBoundingBoxAscent: 20,
    actualBoundingBoxDescent: 5,
    fontBoundingBoxAscent: 25,
    fontBoundingBoxDescent: 8,
  })),
  fillText: jest.fn(),
  strokeStyle: '#000',
  fillStyle: '#000',
  lineWidth: 6,
  lineCap: 'round',
  lineJoin: 'round',
  font: '16px Arial',
  textAlign: 'center',
  textBaseline: 'middle',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
};

// Mock HTMLCanvasElement
beforeAll(() => {
  // Mock getContext
  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  
  // Mock toDataURL
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mockSignatureData');
  
  // Mock getBoundingClientRect
  HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 300,
    right: 800,
    bottom: 300,
    x: 0,
    y: 0,
  }));
});

describe('SignatureModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    fieldName: 'Test Signature',
    fieldDimensions: { width: 200, height: 100 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock function calls
    Object.values(mockContext).forEach(mock => {
      if (typeof mock === 'function') {
        mock.mockClear();
      }
    });
  });

  describe('basic rendering', () => {
    it('should render modal when open', () => {
      render(<SignatureModal {...defaultProps} />);
      
      expect(screen.getByText('Sign Test Signature')).toBeInTheDocument();
      expect(screen.getByText('Type Signature')).toBeInTheDocument();
      expect(screen.getByText('Draw Signature')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<SignatureModal {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Sign Test Signature')).not.toBeInTheDocument();
    });

    it('should show action buttons', () => {
      render(<SignatureModal {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Signature')).toBeInTheDocument();
    });
  });

  describe('typed signature', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'John Doe');
      
      expect(input).toHaveValue('John Doe');
    });

    it('should show preview when text entered', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'Test Signature');
      
      expect(screen.getByText('Test Signature')).toBeInTheDocument();
    });

    it('should enable save button with text', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'John');
      
      const saveButton = screen.getByText('Save Signature');
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when empty', () => {
      render(<SignatureModal {...defaultProps} />);
      
      const saveButton = screen.getByText('Save Signature');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('canvas drawing', () => {
    it('should initialize canvas on draw tab', () => {
      render(<SignatureModal {...defaultProps} />);
      
      const drawTab = screen.getByText('Draw Signature');
      fireEvent.click(drawTab);
      
      expect(screen.getByText('Draw your signature in the box below:')).toBeInTheDocument();
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('should handle mouse events on canvas', () => {
      render(<SignatureModal {...defaultProps} />);
      
      const drawTab = screen.getByText('Draw Signature');
      fireEvent.click(drawTab);
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
        expect(mockContext.beginPath).toHaveBeenCalled();
        expect(mockContext.moveTo).toHaveBeenCalled();
        
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });
        expect(mockContext.lineTo).toHaveBeenCalled();
        expect(mockContext.stroke).toHaveBeenCalled();
        
        fireEvent.mouseUp(canvas);
      }
    });

    it('should clear canvas', () => {
      render(<SignatureModal {...defaultProps} />);
      
      const drawTab = screen.getByText('Draw Signature');
      fireEvent.click(drawTab);
      
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('signature saving', () => {
    it('should save typed signature', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      render(<SignatureModal {...defaultProps} onSave={onSave} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'John Doe');
      
      const saveButton = screen.getByText('Save Signature');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('data:image/png;base64,mockSignatureData');
    });

    it('should save drawn signature', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn();
      render(<SignatureModal {...defaultProps} onSave={onSave} />);
      
      const drawTab = screen.getByText('Draw Signature');
      await user.click(drawTab);
      
      // Draw something
      const canvas = document.querySelector('canvas');
      if (canvas) {
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 50 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 75 });
        fireEvent.mouseUp(canvas);
      }
      
      const saveButton = screen.getByText('Save Signature');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('data:image/png;base64,mockSignatureData');
    });
  });

  describe('modal interactions', () => {
    it('should call onClose when cancelled', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<SignatureModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose after saving', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<SignatureModal {...defaultProps} onClose={onClose} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'John Doe');
      
      const saveButton = screen.getByText('Save Signature');
      await user.click(saveButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('tab switching', () => {
    it('should switch between tabs', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      // Start on type tab
      expect(screen.getByLabelText('Type your signature')).toBeInTheDocument();
      
      // Switch to draw tab
      const drawTab = screen.getByText('Draw Signature');
      await user.click(drawTab);
      
      expect(screen.getByText('Draw your signature in the box below:')).toBeInTheDocument();
      
      // Switch back to type tab
      const typeTab = screen.getByText('Type Signature');
      await user.click(typeTab);
      
      expect(screen.getByLabelText('Type your signature')).toBeInTheDocument();
    });

    it('should maintain state when switching tabs', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'John Doe');
      
      const drawTab = screen.getByText('Draw Signature');
      await user.click(drawTab);
      
      const typeTab = screen.getByText('Type Signature');
      await user.click(typeTab);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('font size calculation', () => {
    it('should calculate font size for preview', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'Test Signature');
      
      // Should show font size information
      expect(screen.getByText(/Will render at.*px/)).toBeInTheDocument();
      expect(mockContext.measureText).toHaveBeenCalled();
    });

    it('should handle different text lengths', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      // Mock measureText to return different widths
      mockContext.measureText.mockImplementation((text) => ({
        width: text.length * 10,
        actualBoundingBoxAscent: 20,
        actualBoundingBoxDescent: 5,
        fontBoundingBoxAscent: 25,
        fontBoundingBoxDescent: 8,
      }));
      
      const input = screen.getByLabelText('Type your signature');
      await user.type(input, 'Short');
      
      await user.clear(input);
      await user.type(input, 'This is a very long signature name');
      
      expect(mockContext.measureText).toHaveBeenCalledTimes(expect.any(Number));
    });
  });

  describe('dimensions and scaling', () => {
    it('should handle field dimensions', () => {
      render(<SignatureModal {...defaultProps} fieldDimensions={{ width: 300, height: 150 }} />);
      
      expect(screen.getByText('Sign Test Signature')).toBeInTheDocument();
    });

    it('should handle missing dimensions', () => {
      render(<SignatureModal {...defaultProps} fieldDimensions={undefined} />);
      
      expect(screen.getByText('Sign Test Signature')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle canvas context errors', () => {
      // Temporarily mock getContext to return null
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
      
      render(<SignatureModal {...defaultProps} />);
      
      const drawTab = screen.getByText('Draw Signature');
      expect(() => fireEvent.click(drawTab)).not.toThrow();
      
      // Restore
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should handle touch events', () => {
      render(<SignatureModal {...defaultProps} />);
      
      const drawTab = screen.getByText('Draw Signature');
      fireEvent.click(drawTab);
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const touchEvent = {
          preventDefault: jest.fn(),
          touches: [{ clientX: 100, clientY: 50 }],
        };
        
        expect(() => fireEvent.touchStart(canvas, touchEvent)).not.toThrow();
        expect(touchEvent.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('accessibility', () => {
    it('should have proper labels', () => {
      render(<SignatureModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Type your signature')).toBeInTheDocument();
      expect(screen.getByLabelText('Font Style')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByText('Type Signature')).toHaveFocus();
    });
  });

  describe('font selection', () => {
    it('should render font selector', () => {
      render(<SignatureModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Font Style')).toBeInTheDocument();
    });

    it('should handle font selection change', async () => {
      const user = userEvent.setup();
      render(<SignatureModal {...defaultProps} />);
      
      const fontSelect = screen.getByLabelText('Font Style');
      await user.click(fontSelect);
      
      // Should show font options
      expect(screen.getByText('Dancing Script')).toBeInTheDocument();
    });
  });
});