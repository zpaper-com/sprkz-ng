# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sprkz** is an interactive PDF form completion platform designed to provide guided, wizard-style navigation through PDF forms. The application uses React with PDF.js integration to enable intelligent form field detection, signature capture, and seamless form submission.

**Current Status**: This repository contains comprehensive documentation and specifications but no implementation code yet. All actual development work needs to be done according to the documented architecture.

## Development Commands

Since this is a greenfield React project, standard commands will be:

```bash
# Initial setup (when package.json exists)
npm install

# Development server (typically runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests (TDD approach)
npm test

# Run tests in watch mode for TDD
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Code Quality Commands
npm run lint              # Check for linting errors (strict)
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format all source files
npm run format:check      # Verify formatting compliance

# Type checking (TypeScript strict mode)
npx tsc --noEmit
```

## Development Server

The React development server should run on **port 7779** (http://localhost:7779) for this project. This port number spells "SPRZ" using phone keypad mapping:
- S = 7 (PQRS key)
- P = 7 (PQRS key) 
- R = 7 (PQRS key)
- Z = 9 (WXYZ key)

Configure the port with:

```bash
# Use project-specific port
PORT=7779 npm start

# Or set in .env file
echo "PORT=7779" > .env
```

**Note**: While React defaults to port 3000, this project uses 7779 as a memorable port that relates to the project name.

## Architecture Overview

### Technology Stack
- **Frontend Framework**: React with Material-UI (MUI)
- **PDF Processing**: PDF.js (pdfjs-dist) with native annotation layer
- **Form Data Processing**: PDF-lib for final PDF generation
- **Signature Component**: React-signature-canvas with font selection
- **HTTP Client**: Axios or Fetch API

### Core Component Structure
```
App
├── PDFFormContainer
│   ├── Toolbar (ActionButton, ProgressTracker, ErrorDisplay)
│   ├── ThumbnailSidebar (PageThumbnail[])
│   └── PDFViewer (PDF.js Integration)
│       ├── CanvasLayer (visual content)
│       ├── TextLayer (text selection)
│       ├── AnnotationLayer (interactive forms)
│       └── CustomFieldOverlay (highlighting/guidance)
├── SignatureModal
│   ├── SignatureCanvas (drawing mode)
│   ├── TypedSignature (text mode with FontSelector)
│   └── SignatureControls
├── FormFieldManager
├── ValidationService
├── PDFProcessor (PDF-lib integration)
└── SubmissionService
```

### PDF.js Multi-Layer Architecture
The application uses PDF.js's three-layer rendering system:
1. **Canvas Layer**: Renders visual PDF content
2. **Text Layer**: Enables text selection and search
3. **Annotation Layer**: Handles interactive form fields with native HTML elements

## Key Implementation Patterns

### Form Field Management
- Extract form fields using PDF.js annotation layer: `page.getAnnotations({ intent: "display" })`
- Categorize fields into required vs optional based on PDF metadata
- Exclude read-only fields from required field validation
- Support field types: text, checkbox, radio, dropdown, signature

### Wizard Navigation System
The wizard provides guided form completion with dynamic button states:
- **"Start"** (Blue): Begin form completion
- **"Next"** (Orange): Navigate to next required field
- **"Sign"** (Purple): Navigate to signature fields
- **"Submit"** (Green): Submit completed form

### State Management Requirements
- PDF document data and metadata
- Form field definitions and current values
- Wizard state and current field tracking
- Validation states and error messages
- Progress tracking and completion status

### Signature Implementation
Support two signature modes:
- **Canvas Drawing**: HTML5 canvas with mouse/touch/stylus input
- **Typed Signatures**: Text input with font selection (serif, sans-serif, cursive/script)

## Development Methodology

This project uses **Test-Driven Development (TDD)**. Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass  
3. **Refactor**: Improve code quality while keeping tests green

See `docs/TDD_GUIDELINES.md` for comprehensive TDD implementation guidance.

### Testing Requirements
- Minimum 80% code coverage overall
- 90% coverage for critical components (validation, PDF processing, wizard)
- All new features must include tests
- Bug fixes must include regression tests

### Code Quality Standards
This project maintains professional code quality through automated tooling:

- **ESLint**: JavaScript/TypeScript linting with strict rules (`--max-warnings 0`)
- **Prettier**: Automatic code formatting for consistent style
- **Husky**: Git hooks for pre-commit quality enforcement
- **lint-staged**: Process only staged files for fast commits
- **TypeScript**: Strict mode compilation with enhanced type checking

#### Pre-commit Automation
Git commits automatically trigger:
1. ESLint fixes for common issues
2. Prettier formatting for consistency
3. Test execution to prevent regressions
4. Commit succeeds only if all checks pass

See `docs/CODE_QUALITY.md` for complete configuration and workflow details.

## Development Guidelines

### PDF.js Integration
- Always use annotation layer for form field interaction
- Handle coordinate transformations and scaling automatically via PDF.js
- Implement proper viewport management for responsive design
- Use `pdfjsLib.getDocument()` for loading, `page.render()` for canvas rendering

### Form Field Event Handling
- Listen for annotation layer events to track form completion
- Implement real-time validation as users interact with fields
- Monitor field completion status across all pages
- Programmatically focus next required field in wizard mode

### Error Handling Requirements
- Network errors (connection failures, timeouts)
- PDF processing errors (invalid PDF, unsupported features)
- Validation errors (incomplete or invalid form data)
- Server errors (submission failures)

### Security Considerations
- Implement client-side input sanitization for XSS prevention
- Validate data types and formats
- Use HTTPS for all form submissions
- Never store sensitive form data on server
- Implement proper memory cleanup for PDF resources

## Configuration

### PDF File Configuration
- **Default PDF**: `makana2025.pdf` served from `public/pdfs/` directory
- **Environment variable**: `REACT_APP_DEFAULT_PDF=/pdfs/makana2025.pdf`
- **Static file serving**: React server must serve files from `public/pdfs/` directory

### URL Parameters
- Support `?f=` parameter for direct PDF loading from URL (e.g., `?f=tremfya.pdf`)
- Support alternative parameters: `?file=` and `?pdf=`
- Handle relative paths (automatically resolved to `/pdfs/` directory)
- Fall back to default PDF (`makana2025.pdf`) when no parameter provided
- Handle file upload for local PDF selection
- Display appropriate messaging when PDF loading fails

### Submission Configuration
- Configurable server endpoint for form submission
- POST request with JSON payload containing form data
- Include PDF URL and timestamp in submission
- Handle response confirmation and error states

## Browser Support
- Chrome 90+ (primary target)
- Firefox 88+
- Safari 14+ (desktop and mobile)
- Edge 90+
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance Requirements
- PDF loading within 3 seconds for typical documents
- Field navigation transitions under 100ms
- Support documents up to 50MB
- Efficient memory management for large PDFs

## Accessibility Requirements
- Full keyboard navigation support
- Screen reader compatibility with ARIA labels
- WCAG 2.1 AA color contrast compliance
- Logical focus management and tab order

## Testing Strategy
- Test across all supported browsers
- Validate with various PDF form types and structures
- Test responsive design on mobile and tablet devices
- Verify accessibility with screen readers
- Performance testing with large PDF files

## API Integration

### Form Submission Format
```javascript
{
  "formData": {
    "fieldName1": "value1",
    "fieldName2": "value2",
    "signature_field": "data:image/png;base64,..."
  },
  "pdfUrl": "http://example.com/form.pdf",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Documentation Reference

Key documentation files in this repository:
- `README.md`: Documentation directory guide and file hierarchy
- `docs/GETTING_STARTED.md`: **START HERE** - Claude Code implementation prompt with complete first-step instructions
- `docs/IMPLEMENTATION_PLAN.md`: Master implementation plan (supersedes all others for technical decisions)
- `docs/TDD_GUIDELINES.md`: Test-driven development methodology and guidelines (MANDATORY)
- `docs/FEATURE_FLAGS.md`: Feature flags strategy and implementation using Unleash
- `docs/ERROR_MONITORING.md`: Error monitoring and tracking strategy using Sentry
- `docs/PRD.md`: Product requirements and user experience specifications
- `docs/WIZARD_FEATURE.md`: Detailed wizard navigation feature specification
- `docs/CODE_QUALITY.md`: Code quality standards, linting, formatting, and Git hooks setup
- `archive/`: Historical documentation that has been superseded

## Code Quality Standards

This project maintains professional code quality through automated tooling:

### Pre-commit Hooks (Husky + lint-staged)
- **Automatic Formatting**: Prettier formats code on every commit
- **Linting Enforcement**: ESLint fixes issues and prevents commits with errors
- **Test Validation**: Tests run before commits to prevent regressions
- **TypeScript Strict**: Enhanced compiler checks catch issues early

### Quality Commands
```bash
# Manual quality checks
npm run lint              # Zero warnings allowed
npm run format:check      # Verify formatting compliance
npm test -- --coverage   # Comprehensive test coverage

# Auto-fix quality issues
npm run lint:fix          # Fix linting problems automatically
npm run format            # Format all source files
```

### Standards Enforced
- ✅ **ESLint Clean**: No warnings or errors allowed
- ✅ **Prettier Formatted**: Consistent code formatting
- ✅ **TypeScript Strict**: Enhanced type checking enabled
- ✅ **TDD Coverage**: 80% overall, 90% for critical components
- ✅ **Professional Workflow**: Industry-standard development practices

See `docs/CODE_QUALITY.md` for comprehensive setup and configuration details.

## Development Notes

- This is a greenfield project - no implementation code exists yet
- **For implementation: START with `docs/GETTING_STARTED.md`** - This contains the complete first-step prompt and setup instructions
- All development should follow the React + Material-UI architecture documented in IMPLEMENTATION_PLAN.md
- **TDD is mandatory** - Follow docs/TDD_GUIDELINES.md strictly
- Focus on PDF.js annotation layer integration for native form field rendering
- Implement proper separation of concerns between PDF rendering, form management, and UI components