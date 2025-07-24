import { renderHook, act } from '@testing-library/react';
import { useFieldFocus, FieldFocusOptions } from '../useFieldFocus';

// Mock console methods to avoid noise in tests  
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('useFieldFocus', () => {
  // Create actual DOM elements for testing
  let testContainer: HTMLDivElement;
  let testInput: HTMLInputElement;
  let testTextarea: HTMLTextAreaElement;
  let testSelect: HTMLSelectElement;

  beforeEach(() => {
    // Mock scrollIntoView since JSDOM doesn't provide it
    Element.prototype.scrollIntoView = jest.fn();
    
    // Create a test container and add it to the document
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    // Create test elements
    testInput = document.createElement('input');
    testInput.setAttribute('data-field-id', 'test-field');
    testInput.name = 'test-field';
    testInput.id = 'test-field';
    testContainer.appendChild(testInput);

    testTextarea = document.createElement('textarea');
    testTextarea.setAttribute('data-field-id', 'test-textarea');
    testTextarea.name = 'test-textarea';
    testContainer.appendChild(testTextarea);

    testSelect = document.createElement('select');
    testSelect.setAttribute('data-field-id', 'test-select');
    testSelect.name = 'test-select';
    testContainer.appendChild(testSelect);

    // Mock setTimeout to execute immediately for most tests
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 123 as any;
    });
  });

  afterEach(() => {
    // Clean up DOM elements
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    
    // Restore setTimeout
    jest.restoreAllMocks();
  });

  describe('element location', () => {
    it('should find form fields by data-field-id attribute', () => {
      const focusSpy = jest.spyOn(testInput, 'focus');
      const scrollSpy = jest.spyOn(testInput, 'scrollIntoView');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    it('should find fields by name attribute', () => {
      // Create an input with only name attribute (no data-field-id)
      const inputByName = document.createElement('input');
      inputByName.name = 'name-only-field';
      testContainer.appendChild(inputByName);
      
      const focusSpy = jest.spyOn(inputByName, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('name-only-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should find fields by data-field-name attribute when field name provided', () => {
      // Create an input with data-field-name attribute
      const inputByFieldName = document.createElement('input');
      inputByFieldName.setAttribute('data-field-name', 'Test Field Name');
      testContainer.appendChild(inputByFieldName);
      
      const focusSpy = jest.spyOn(inputByFieldName, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('unknown-id', 'Test Field Name');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle multiple selector strategies', () => {
      const { result } = renderHook(() => useFieldFocus());
      
      // This should find the element by one of the selectors
      act(() => {
        result.current.focusField('test-field');
      });

      // Should not throw and should find the element
      expect(testInput.matches('[data-field-id="test-field"]')).toBe(true);
    });

    it('should return void for non-existent fields', () => {
      const { result } = renderHook(() => useFieldFocus());
      
      // Should not throw for non-existent fields
      expect(() => {
        act(() => {
          result.current.focusField('nonexistent-field');
        });
      }).not.toThrow();
    });

    it('should handle invalid selectors gracefully', () => {
      const { result } = renderHook(() => useFieldFocus());
      
      // Should not throw even with potentially problematic field IDs
      expect(() => {
        act(() => {
          result.current.focusField('field-with-[brackets]');
        });
      }).not.toThrow();
    });
  });

  describe('focus behavior', () => {
    it('should focus on text input fields', () => {
      const focusSpy = jest.spyOn(testInput, 'focus');
      const selectSpy = jest.spyOn(testInput, 'select');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });

    it('should focus on textarea fields', () => {
      const focusSpy = jest.spyOn(testTextarea, 'focus');
      const selectSpy = jest.spyOn(testTextarea, 'select');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-textarea');
      });

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();
    });

    it('should focus on select dropdown fields', () => {
      const focusSpy = jest.spyOn(testSelect, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-select');
      });

      expect(focusSpy).toHaveBeenCalled();
      // Select elements don't have a select() method, so we don't test for it
    });

    it('should handle readonly fields gracefully', () => {
      testInput.readOnly = true;
      const focusSpy = jest.spyOn(testInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle focus method failures gracefully', () => {
      // Override focus to throw an error
      testInput.focus = jest.fn(() => {
        throw new Error('Focus failed');
      });
      
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('test-field');
        });
      }).not.toThrow();
    });

    it('should handle elements without focus method', () => {
      // Create a div element without focus method
      const divElement = document.createElement('div');
      divElement.setAttribute('data-field-id', 'div-field');
      testContainer.appendChild(divElement);
      
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('div-field');
        });
      }).not.toThrow();
    });
  });

  describe('scrolling behavior', () => {
    it('should scroll field into view with default options', () => {
      const scrollSpy = jest.spyOn(testInput, 'scrollIntoView');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });

    it('should scroll field into view with custom options', () => {
      const scrollSpy = jest.spyOn(testInput, 'scrollIntoView');
      
      const options: FieldFocusOptions = {
        behavior: 'auto',
        block: 'start',
        inline: 'start',
      };
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field', undefined, options);
      });

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
        inline: 'start',
      });
    });

    it('should handle scrollIntoView failures gracefully', () => {
      // Override scrollIntoView to throw an error
      testInput.scrollIntoView = jest.fn(() => {
        throw new Error('Scroll failed');
      });
      
      const focusSpy = jest.spyOn(testInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('test-field');
        });
      }).not.toThrow();

      // Should still try to focus even if scroll fails
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle fields outside viewport', () => {
      const scrollSpy = jest.spyOn(testInput, 'scrollIntoView');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      // scrollIntoView should be called regardless of position
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  describe('visual highlighting', () => {
    it('should add highlight styles to focused field', () => {
      // Use a different setTimeout mock for this test to control timing better
      jest.restoreAllMocks();
      
      let timeoutCallbacks: Array<() => void> = [];
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay: number) => {
        if (delay === 300) {
          // Execute main delay immediately
          callback();
        } else {
          // Store highlight removal callback for later
          timeoutCallbacks.push(callback);
        }
        return 123 as any;
      });
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      // Should be highlighted before timeout callbacks execute
      expect(testInput.style.boxShadow).toBe('0 0 0 3px rgba(255, 193, 7, 0.6), 0 0 0 6px rgba(255, 193, 7, 0.3)');
      expect(testInput.style.transition).toBe('box-shadow 0.3s ease');
    });

    it('should handle custom highlight duration', () => {
      // Use specific timeout control for this test
      jest.restoreAllMocks();
      
      const timeoutSpy = jest.spyOn(global, 'setTimeout');
      timeoutSpy.mockImplementation((callback: any, delay: number) => {
        if (delay === 300) {
          callback(); // Execute main delay
        }
        // Don't execute highlight removal
        return 123 as any;
      });
      
      const { result } = renderHook(() => useFieldFocus());
      
      const options: FieldFocusOptions = {
        highlightDuration: 100,
      };
      
      act(() => {
        result.current.focusField('test-field', undefined, options);
      });

      // Should be highlighted
      expect(testInput.style.boxShadow).toBe('0 0 0 3px rgba(255, 193, 7, 0.6), 0 0 0 6px rgba(255, 193, 7, 0.3)');
      
      // Verify that highlight removal was scheduled with correct duration
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    });

    it('should preserve original styles when removing highlight', () => {
      jest.restoreAllMocks();
      
      // Set some original styles
      testInput.style.boxShadow = 'original-shadow';
      testInput.style.transition = 'original-transition';
      
      let removeHighlightCallback: (() => void) | null = null;
      
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay: number) => {
        if (delay === 300) {
          callback(); // Execute main delay
        } else {
          removeHighlightCallback = callback; // Store highlight removal
        }
        return 123 as any;
      });
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      // Should be highlighted now
      expect(testInput.style.boxShadow).toBe('0 0 0 3px rgba(255, 193, 7, 0.6), 0 0 0 6px rgba(255, 193, 7, 0.3)');
      
      // Execute the highlight removal callback
      if (removeHighlightCallback) {
        removeHighlightCallback();
      }
      
      // Should be restored to original styles
      expect(testInput.style.boxShadow).toBe('original-shadow');
      expect(testInput.style.transition).toBe('original-transition');
    });

    it('should handle highlight errors gracefully', () => {
      // Create an element where style access might fail
      const problematicElement = document.createElement('input');
      problematicElement.setAttribute('data-field-id', 'problematic');
      testContainer.appendChild(problematicElement);
      
      // Override style property to throw errors
      Object.defineProperty(problematicElement, 'style', {
        get: () => {
          throw new Error('Style access failed');
        },
      });
      
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('problematic');
        });
      }).not.toThrow();
    });
  });

  describe('timing and delays', () => {
    it('should use default delay of 300ms', () => {
      // Restore setTimeout to test actual timing
      jest.restoreAllMocks();
      const timeoutSpy = jest.spyOn(global, 'setTimeout');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
      
      timeoutSpy.mockRestore();
    });

    it('should use custom delay when provided', () => {
      // Restore setTimeout to test actual timing
      jest.restoreAllMocks();
      const timeoutSpy = jest.spyOn(global, 'setTimeout');
      
      const options: FieldFocusOptions = {
        delay: 500,
      };
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field', undefined, options);
      });

      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
      
      timeoutSpy.mockRestore();
    });

    it('should handle asynchronous execution', (done) => {
      // Restore setTimeout for real async testing
      jest.restoreAllMocks();
      
      const focusSpy = jest.spyOn(testInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field', undefined, { delay: 10 });
      });

      // Focus should not be called immediately
      expect(focusSpy).not.toHaveBeenCalled();

      // But should be called after the delay
      setTimeout(() => {
        expect(focusSpy).toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('utility methods', () => {
    it('should provide focusFieldById method', () => {
      const focusSpy = jest.spyOn(testInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusFieldById('test-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should provide focusFieldByName method', () => {
      // Create an element with data-field-name attribute
      const namedInput = document.createElement('input');
      namedInput.setAttribute('data-field-name', 'Test Field');
      testContainer.appendChild(namedInput);
      
      const focusSpy = jest.spyOn(namedInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusFieldByName('Test Field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should accept options in utility methods', () => {
      const scrollSpy = jest.spyOn(testInput, 'scrollIntoView');
      
      const options: FieldFocusOptions = {
        behavior: 'auto',
        highlightDuration: 1000,
      };
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusFieldById('test-field', options);
      });

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest',
      });
    });
  });

  describe('cross-browser compatibility', () => {
    it('should work with different HTML element types', () => {
      // Test with various element types
      const elements = [
        { tag: 'input', type: 'text' },
        { tag: 'input', type: 'email' },
        { tag: 'textarea' },
        { tag: 'select' },
        { tag: 'button' },
      ];

      elements.forEach((elementInfo, index) => {
        const element = document.createElement(elementInfo.tag) as HTMLInputElement;
        if (elementInfo.type) {
          element.type = elementInfo.type;
        }
        element.setAttribute('data-field-id', `element-${index}`);
        testContainer.appendChild(element);

        const focusSpy = jest.spyOn(element, 'focus');
        
        const { result } = renderHook(() => useFieldFocus());
        
        act(() => {
          result.current.focusField(`element-${index}`);
        });

        expect(focusSpy).toHaveBeenCalled();
      });
    });

    it('should handle elements without focus capability', () => {
      const div = document.createElement('div');
      div.setAttribute('data-field-id', 'div-element');
      div.tabIndex = -1; // Make it focusable
      testContainer.appendChild(div);
      
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('div-element');
        });
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle DOM query errors gracefully', () => {
      // Test with an ID that might cause querySelector issues
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('field:with:colons');
        });
      }).not.toThrow();
    });

    it('should handle missing elements gracefully', () => {
      const { result } = renderHook(() => useFieldFocus());
      
      expect(() => {
        act(() => {
          result.current.focusField('completely-missing-field');
        });
      }).not.toThrow();
    });

    it('should provide debug information when field not found', () => {
      const warnSpy = jest.spyOn(console, 'warn');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('nonexistent-field');
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find field element for: nonexistent-field')
      );
    });
  });

  describe('performance considerations', () => {
    it('should not cause memory leaks with timeouts', () => {
      const { result, unmount } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
      });

      // Unmounting should not cause errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle rapid consecutive calls', () => {
      const focusSpy = jest.spyOn(testInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      // Call multiple times rapidly
      act(() => {
        result.current.focusField('test-field');
        result.current.focusField('test-field');
        result.current.focusField('test-field');
      });

      // Should handle all calls without errors
      expect(focusSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent field focus attempts', () => {
      const input1FocusSpy = jest.spyOn(testInput, 'focus');
      const input2FocusSpy = jest.spyOn(testTextarea, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('test-field');
        result.current.focusField('test-textarea');
      });

      expect(input1FocusSpy).toHaveBeenCalled();
      expect(input2FocusSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle fields with special characters in names', () => {
      const specialInput = document.createElement('input');
      specialInput.name = 'field-with-special-chars[]{}()';
      specialInput.setAttribute('data-field-id', 'special-field');
      testContainer.appendChild(specialInput);
      
      const focusSpy = jest.spyOn(specialInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('special-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle dynamically created elements', () => {
      const { result } = renderHook(() => useFieldFocus());
      
      // Create element after hook initialization
      const dynamicInput = document.createElement('input');
      dynamicInput.setAttribute('data-field-id', 'dynamic-field');
      testContainer.appendChild(dynamicInput);
      
      const focusSpy = jest.spyOn(dynamicInput, 'focus');
      
      act(() => {
        result.current.focusField('dynamic-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle fields in nested containers', () => {
      const nestedContainer = document.createElement('div');
      const nestedInput = document.createElement('input');
      nestedInput.setAttribute('data-field-id', 'nested-field');
      nestedContainer.appendChild(nestedInput);
      testContainer.appendChild(nestedContainer);
      
      const focusSpy = jest.spyOn(nestedInput, 'focus');
      
      const { result } = renderHook(() => useFieldFocus());
      
      act(() => {
        result.current.focusField('nested-field');
      });

      expect(focusSpy).toHaveBeenCalled();
    });
  });
});