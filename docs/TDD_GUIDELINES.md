# Test-Driven Development (TDD) Guidelines

## Overview

The Sprkz PDF form completion platform follows **Test-Driven Development (TDD)** methodology. All new features and bug fixes should be developed using the Red-Green-Refactor cycle.

## TDD Cycle

### 1. Red Phase - Write Failing Test
- Write a test that defines the desired functionality
- Ensure the test fails (demonstrates the feature doesn't exist yet)
- Keep tests small and focused on a single behavior

### 2. Green Phase - Make Test Pass
- Write the minimal code necessary to make the test pass
- Don't worry about perfect implementation yet
- Focus only on making the test green

### 3. Refactor Phase - Improve Code
- Clean up the implementation without changing behavior
- Improve code quality, readability, and performance
- Ensure all tests still pass after refactoring

## Testing Stack

### Frontend Testing
```bash
# Primary testing framework
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Additional tools
npm install --save-dev jest-environment-jsdom
npm install --save-dev @types/jest
```

### Test Types

#### 1. Unit Tests
Test individual functions, components, and services in isolation.

**Examples:**
- PDF field extraction functions
- Form validation logic
- Utility functions
- Individual React components

```javascript
// Example: Form field validation
describe('FormValidator', () => {
  it('should mark required field as invalid when empty', () => {
    const field = { name: 'email', required: true, value: '' };
    const result = validateField(field);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });
});
```

#### 2. Integration Tests
Test how multiple components work together.

**Examples:**
- PDF loading and field extraction flow
- Form submission with validation
- Wizard navigation through multiple fields
- Signature capture and embedding

```javascript
// Example: PDF loading integration
describe('PDF Loading Integration', () => {
  it('should extract form fields after PDF loads', async () => {
    const pdfUrl = 'test-form.pdf';
    await loadPDF(pdfUrl);
    const fields = await extractFormFields();
    expect(fields).toHaveLength(5);
    expect(fields[0]).toHaveProperty('name', 'patient_name');
  });
});
```

#### 3. Component Tests
Test React components with user interactions.

**Examples:**
- Button state changes in wizard
- Form field input handling
- Modal dialogs (signature capture)
- Progress tracking updates

```javascript
// Example: Wizard button component
describe('WizardButton', () => {
  it('should show "Start" initially and change to "Next" after click', () => {
    render(<WizardButton onStart={mockStart} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Start');
    
    fireEvent.click(button);
    expect(button).toHaveTextContent('Next');
  });
});
```

#### 4. End-to-End Tests (Future)
Test complete user workflows.

**Examples:**
- Complete form filling and submission
- PDF upload and processing
- Error handling flows

## TDD Implementation by Component

### Phase 1: Core Setup
```javascript
// Test: PDF.js initialization
describe('PDF Service', () => {
  it('should initialize PDF.js worker', () => {
    initializePDFJS();
    expect(pdfjsLib.GlobalWorkerOptions.workerSrc).toBeDefined();
  });
});

// Test: Basic React app structure
describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

### Phase 2: PDF Processing
```javascript
// Test: PDF loading
describe('PDF Document Loading', () => {
  it('should load PDF from URL parameter', async () => {
    window.history.pushState({}, '', '?f=test.pdf');
    const pdf = await loadPDFFromURL();
    expect(pdf).toBeDefined();
    expect(pdf.numPages).toBeGreaterThan(0);
  });
});

// Test: Form field extraction
describe('Form Field Extraction', () => {
  it('should extract all form fields from PDF annotations', async () => {
    const mockPDF = createMockPDF();
    const fields = await extractFormFields(mockPDF);
    expect(fields).toEqual([
      { name: 'firstName', type: 'text', required: true },
      { name: 'signature', type: 'signature', required: false }
    ]);
  });
});
```

### Phase 3: Form Management
```javascript
// Test: Form state management
describe('Form Context', () => {
  it('should update field value and mark as completed', () => {
    const { result } = renderHook(() => useForm());
    
    act(() => {
      result.current.updateField('email', 'test@example.com');
    });
    
    expect(result.current.formData.email).toBe('test@example.com');
    expect(result.current.completedFields).toContain('email');
  });
});

// Test: Field validation
describe('Field Validation', () => {
  it('should validate email format', () => {
    const field = { name: 'email', type: 'email', value: 'invalid-email' };
    const errors = validateField(field);
    expect(errors).toContain('Please enter a valid email address');
  });
});
```

### Phase 4: Wizard Navigation
```javascript
// Test: Wizard state management
describe('Wizard Navigation', () => {
  it('should navigate to next incomplete required field', () => {
    const fields = [
      { name: 'name', required: true, completed: true },
      { name: 'email', required: true, completed: false },
      { name: 'phone', required: false, completed: false }
    ];
    
    const nextField = getNextRequiredField(fields);
    expect(nextField.name).toBe('email');
  });
});

// Test: Button state transitions
describe('Wizard Button States', () => {
  it('should transition from Start -> Next -> Sign -> Submit', () => {
    const { rerender } = render(<WizardButton state="start" />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    
    rerender(<WizardButton state="next" />);
    expect(screen.getByText('Next')).toBeInTheDocument();
    
    rerender(<WizardButton state="sign" />);
    expect(screen.getByText('Sign')).toBeInTheDocument();
    
    rerender(<WizardButton state="submit" />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
```

### Phase 5: Signature Implementation
```javascript
// Test: Signature canvas
describe('Signature Canvas', () => {
  it('should capture drawing strokes', () => {
    render(<SignatureCanvas onSave={mockSave} />);
    const canvas = screen.getByRole('img'); // canvas with role
    
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);
    
    expect(mockSave).toHaveBeenCalledWith(expect.any(String)); // base64 data
  });
});

// Test: Typed signature
describe('Typed Signature', () => {
  it('should generate signature with selected font', () => {
    render(<TypedSignature onSave={mockSave} />);
    
    fireEvent.change(screen.getByLabelText('Signature Text'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Font'), {
      target: { value: 'Dancing Script' }
    });
    
    fireEvent.click(screen.getByText('Save Signature'));
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'John Doe',
        font: 'Dancing Script'
      })
    );
  });
});
```

## Test Organization

### Directory Structure
```
src/
├── components/
│   ├── __tests__/
│   │   ├── PDFViewer.test.tsx
│   │   ├── SignatureModal.test.tsx
│   │   └── WizardButton.test.tsx
├── services/
│   ├── __tests__/
│   │   ├── pdfService.test.ts
│   │   ├── formFieldService.test.ts
│   │   └── validationService.test.ts
├── hooks/
│   ├── __tests__/
│   │   ├── useForm.test.ts
│   │   └── useWizard.test.ts
└── utils/
    ├── __tests__/
    │   ├── pdfUtils.test.ts
    │   └── validationUtils.test.ts
```

### Test Naming Conventions
- Test files: `ComponentName.test.tsx` or `serviceName.test.ts`
- Describe blocks: Use the component/function name being tested
- Test cases: Use "should [expected behavior] when [condition]" format

```javascript
describe('FormValidator', () => {
  describe('validateRequired', () => {
    it('should return error when required field is empty', () => {
      // test implementation
    });
    
    it('should return no error when required field has value', () => {
      // test implementation
    });
  });
});
```

## Mock Data and Utilities

### PDF Mocks
Create reusable mock objects for testing PDF-related functionality:

```javascript
// src/utils/testUtils.ts
export const createMockPDF = () => ({
  numPages: 2,
  getPage: jest.fn().mockResolvedValue({
    getAnnotations: jest.fn().mockResolvedValue([
      { fieldName: 'firstName', fieldType: 'Tx', required: true },
      { fieldName: 'signature', fieldType: 'Sig', required: false }
    ])
  })
});

export const createMockFormField = (overrides = {}) => ({
  name: 'testField',
  type: 'text',
  required: false,
  value: '',
  page: 1,
  rect: [100, 100, 200, 120],
  ...overrides
});
```

## Running Tests

### Development Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test PDFViewer.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validation"
```

### CI/CD Integration
Tests should run automatically on:
- Pull request creation
- Commits to main branch
- Before deployment

### Coverage Requirements
- **Minimum Coverage**: 80% overall
- **Critical Components**: 90% coverage required
  - Form validation logic
  - PDF processing services
  - Wizard navigation
  - Signature capture

## TDD Best Practices

### 1. Start Small
- Begin with the simplest test case
- Test one behavior at a time
- Gradually build complexity

### 2. Descriptive Test Names
```javascript
// Good
it('should mark form as invalid when required email field is empty', () => {});

// Bad
it('should validate email', () => {});
```

### 3. Arrange-Act-Assert Pattern
```javascript
it('should calculate completion percentage correctly', () => {
  // Arrange
  const totalFields = 10;
  const completedFields = 3;
  
  // Act
  const percentage = calculateProgress(completedFields, totalFields);
  
  // Assert
  expect(percentage).toBe(30);
});
```

### 4. Test Edge Cases
- Empty inputs
- Invalid data types
- Boundary conditions
- Error scenarios

### 5. Keep Tests Independent
- Each test should be able to run in isolation
- No shared state between tests
- Use proper setup and teardown

## Development Workflow

### 1. Feature Development
1. **Write failing test** for new feature
2. **Run test** to confirm it fails
3. **Write minimal implementation** to pass test
4. **Run test** to confirm it passes
5. **Refactor** code while keeping test green
6. **Repeat** for next piece of functionality

### 2. Bug Fixes
1. **Write test** that reproduces the bug
2. **Confirm test fails** (reproduces bug)
3. **Fix the bug** to make test pass
4. **Run all tests** to ensure no regressions

### 3. Code Reviews
- Verify tests are included with new features
- Check test quality and coverage
- Ensure tests actually test the intended behavior
- Review test readability and maintainability

## Benefits for Sprkz Project

### 1. PDF Processing Reliability
TDD ensures PDF loading, field extraction, and rendering work correctly across different PDF types and browsers.

### 2. Form Validation Accuracy
Critical for medical/legal forms where data accuracy is essential.

### 3. Wizard Navigation Consistency
Ensures the guided form completion works reliably for all user scenarios.

### 4. Cross-Browser Compatibility
Tests help catch browser-specific issues early.

### 5. Regression Prevention
Prevents new changes from breaking existing functionality.

### 6. Documentation
Tests serve as living documentation of how components should behave.

## Integration with Implementation Plan

TDD should be applied throughout all phases:

- **Phase 1**: Test project setup and basic components
- **Phase 2**: Test PDF loading and rendering
- **Phase 3**: Test form field extraction and management
- **Phase 4**: Test wizard navigation logic
- **Phase 5**: Test signature capture functionality
- **Phase 6**: Test validation and error handling
- **Phase 7**: Test PDF generation and submission
- **Phase 8**: Test responsive design and UI components
- **Phase 9**: Test accessibility and browser compatibility

Each phase should achieve the minimum coverage requirements before proceeding to the next phase.