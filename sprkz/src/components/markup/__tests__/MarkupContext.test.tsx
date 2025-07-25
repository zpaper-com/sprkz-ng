import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkupProvider, useMarkup } from '../../../contexts/MarkupContext';
import type { ImageStampAnnotation } from '../../../contexts/MarkupContext';

// Test component to interact with markup context
const TestComponent: React.FC = () => {
  const {
    state,
    setActiveTool,
    addAnnotation,
    selectAnnotation,
    deleteAnnotation,
  } = useMarkup();

  const handleAddTestAnnotation = () => {
    const annotation: ImageStampAnnotation = {
      id: 'test-annotation-1',
      type: 'image-stamp',
      pageNumber: 1,
      x: 100,
      y: 200,
      width: 150,
      height: 75,
      timestamp: new Date(),
      imageData: 'data:image/png;base64,test',
      opacity: 1,
    };
    addAnnotation(annotation);
  };

  return (
    <div>
      <div data-testid="active-tool">{state.activeTool || 'none'}</div>
      <div data-testid="annotation-count">{state.annotations.length}</div>
      <div data-testid="selected-annotation">{state.selectedAnnotationId || 'none'}</div>
      
      <button onClick={() => setActiveTool('image-stamp')}>
        Set Image Stamp Tool
      </button>
      <button onClick={() => setActiveTool(null)}>
        Clear Tool
      </button>
      <button onClick={handleAddTestAnnotation}>
        Add Test Annotation
      </button>
      <button onClick={() => selectAnnotation('test-annotation-1')}>
        Select Test Annotation
      </button>
      <button onClick={() => deleteAnnotation('test-annotation-1')}>
        Delete Test Annotation
      </button>
    </div>
  );
};

describe('MarkupContext', () => {
  const renderWithProvider = () => {
    return render(
      <MarkupProvider>
        <TestComponent />
      </MarkupProvider>
    );
  };

  it('should have initial state', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('active-tool')).toHaveTextContent('none');
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-annotation')).toHaveTextContent('none');
  });

  it('should set active tool', () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByText('Set Image Stamp Tool'));
    expect(screen.getByTestId('active-tool')).toHaveTextContent('image-stamp');
    
    fireEvent.click(screen.getByText('Clear Tool'));
    expect(screen.getByTestId('active-tool')).toHaveTextContent('none');
  });

  it('should add and manage annotations', () => {
    renderWithProvider();
    
    // Add annotation
    fireEvent.click(screen.getByText('Add Test Annotation'));
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-annotation')).toHaveTextContent('test-annotation-1');
    
    // Select annotation
    fireEvent.click(screen.getByText('Select Test Annotation'));
    expect(screen.getByTestId('selected-annotation')).toHaveTextContent('test-annotation-1');
    
    // Delete annotation
    fireEvent.click(screen.getByText('Delete Test Annotation'));
    expect(screen.getByTestId('annotation-count')).toHaveTextContent('0');
    expect(screen.getByTestId('selected-annotation')).toHaveTextContent('none');
  });

  it('should throw error when used outside provider', () => {
    // Mock console.error to prevent test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useMarkup must be used within a MarkupProvider');
    
    consoleSpy.mockRestore();
  });
});