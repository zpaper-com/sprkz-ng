# Getting Started - Claude Code Implementation Prompt

## Context for Claude Code

You are tasked with implementing the **Sprkz PDF Form Completion Platform**, a React-based interactive PDF form filling application. This is a **greenfield project** with comprehensive documentation but **no implementation code yet**.

### ⚠️ CRITICAL INFRASTRUCTURE NOTE

**BEFORE YOU BEGIN**: There is a **placeholder server.js running on port 7779** that is managed by PM2 and **MUST NOT BE REMOVED** during development. This server:

- ✅ Serves the ALB (Application Load Balancer) target group health checks
- ✅ Runs at `sprkz-ng.zpaper.com` with a required `/health` endpoint  
- ✅ Must continue running until the React app implements its own `/health` endpoint
- ✅ **MUST be stopped with PM2** before React can bind to port 7779 (only one process can use the port)
- ✅ Can only be removed in Phase 11 (Deployment) after proper transition

**Read `CURRENT_INFRASTRUCTURE.md` for complete details** before making any infrastructure changes.

### Project Overview
- **Objective**: Build a guided, wizard-style PDF form completion platform using React + PDF.js
- **Key Features**: Interactive form filling, signature capture (drawing + typed), wizard navigation, real-time validation
- **Target**: Professional-grade form completion with 60fps signature performance and sub-100ms navigation

## Essential Documentation (Read First)

Before beginning implementation, **YOU MUST READ** these documentation files in order:

1. **README.md** - Documentation hierarchy and navigation guide
2. **CURRENT_INFRASTRUCTURE.md** - ⚠️ **CRITICAL**: Existing server and ALB configuration
3. **IMPLEMENTATION_PLAN.md** - Master implementation plan with 11 phases (THIS IS YOUR PRIMARY GUIDE)
4. **TECHNICAL_SPECIFICATIONS.md** - Detailed code patterns, PDF.js integration, signature specs, and performance requirements
5. **PRD.md** - Business requirements and user experience specifications  
6. **TDD_GUIDELINES.md** - Test-driven development methodology (this project REQUIRES TDD)
7. **WIZARD_FEATURE.md** - Detailed wizard navigation specifications

### Architecture Overview
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **PDF Processing**: PDF.js with native annotation layer (NOT CDN - use npm package)
- **State Management**: React Context + useReducer
- **Feature Flags**: Unleash Client (https://flags.zpaper.com/)
- **Error Monitoring**: Sentry for error tracking and performance monitoring
- **Testing**: Jest + React Testing Library with TDD methodology
- **Build Tool**: Vite for faster development
- **Port**: 7779 (spells "SPRZ" on phone keypad)

## Your First Implementation Task

### Phase 1, Step 1: Project Initialization

Execute the following setup exactly as specified in IMPLEMENTATION_PLAN.md Phase 1:

#### 1.1 Create React TypeScript Project
```bash
# Create the project
npx create-react-app sprkz-pdf-forms --template typescript
cd sprkz-pdf-forms

# Verify creation was successful
ls -la
```

#### 1.2 Install Core Dependencies
```bash
# UI Framework
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material

# PDF Processing (IMPORTANT: Use npm package, NOT CDN)
npm install pdfjs-dist pdf-lib

# Signature Capture
npm install react-signature-canvas
npm install @types/react-signature-canvas

# Feature Flags
npm install unleash-client

# Error Monitoring
npm install @sentry/react @sentry/tracing
```

#### 1.3 Install Development Dependencies
```bash
# TypeScript and Linting
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev @typescript-eslint/parser
npm install --save-dev prettier eslint-config-prettier

# Testing (Required for TDD)
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom
```

#### 1.4 Configure Development Server Port
```bash
# Set the project-specific port (spells "SPRZ")
echo "PORT=7779" > .env
echo "REACT_APP_PDF_WORKER_URL=/pdf.worker.min.js" >> .env
echo "REACT_APP_UNLEASH_URL=https://flags.zpaper.com/" >> .env
echo "REACT_APP_SENTRY_DSN=https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120" >> .env
echo "REACT_APP_DEFAULT_PDF=/pdfs/makana2025.pdf" >> .env
```

#### 1.5 Project Structure Setup
Create the following directory structure in `src/`:

```bash
mkdir -p src/components/pdf
mkdir -p src/components/forms  
mkdir -p src/components/signature
mkdir -p src/components/ui
mkdir -p src/components/wizard
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/contexts
mkdir -p src/utils
mkdir -p src/config
```

#### 1.6 Copy Required Files
```bash
# Copy PDF.js worker to public directory for proper loading
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/

# Create pdfs directory and copy default PDF file
mkdir -p public/pdfs
cp ../makana2025.pdf public/pdfs/
# Note: makana2025.pdf should exist in project root directory
```

## Validation Checkpoints

After completing the setup, verify the following:

### ✅ Basic Setup Validation
1. **Project runs successfully**: `npm start` should start development server on port 7779
2. **Dependencies installed**: Check package.json for all required packages
3. **Directory structure**: Verify all component and service directories exist
4. **TypeScript compilation**: No TypeScript errors in default setup
5. **PDF.js worker**: Worker file exists in `public/pdf.worker.min.js`
6. **Default PDF file**: `makana2025.pdf` exists in `public/pdfs/` directory
7. **Sentry error tracking**: Test error reporting with debug endpoint (see below)

### ✅ Environment Validation
1. **Port configuration**: App should be accessible at `http://localhost:7779`
2. **Environment variables**: `.env` file contains PORT=7779, PDF worker URL, Unleash URL, Sentry DSN, and default PDF path
3. **Development server**: Hot reloading works correctly

### ✅ Sentry Error Tracking Validation

**IMPORTANT**: After Sentry is configured, test error reporting by temporarily adding this debug endpoint:

1. **Add temporary debug endpoint** to your main App.tsx or create a temporary component:
```typescript
// Add this temporarily for testing Sentry integration
useEffect(() => {
  // Create a debug endpoint for testing Sentry
  const testSentryError = () => {
    throw new Error("My first Sentry error!");
  };
  
  // Add button for testing (remove after validation)
  const debugButton = document.createElement('button');
  debugButton.innerHTML = 'Test Sentry Error';
  debugButton.style.position = 'fixed';
  debugButton.style.top = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '9999';
  debugButton.style.backgroundColor = 'red';
  debugButton.style.color = 'white';
  debugButton.style.padding = '10px';
  debugButton.onclick = testSentryError;
  document.body.appendChild(debugButton);
  
  // Cleanup function
  return () => {
    if (document.body.contains(debugButton)) {
      document.body.removeChild(debugButton);
    }
  };
}, []);
```

2. **Test the error reporting**:
   - Start the development server: `npm start`
   - Click the "Test Sentry Error" button that appears in the top-right
   - Verify the error appears in your Sentry dashboard
   - Check that error context includes environment and application details

3. **Remove the debug code** after successful validation:
   - Delete the debug button code from your component
   - Confirm Sentry is working by checking the dashboard for the test error

4. **Validation success criteria**:
   - Error appears in Sentry dashboard within 30 seconds
   - Error includes correct environment (development)
   - Error includes stack trace and component information
   - No console errors related to Sentry configuration

## Next Steps After Validation

Once basic setup is complete and validated:

1. **Read TDD_GUIDELINES.md** thoroughly - This project requires test-driven development
2. **Proceed to Phase 1, Step 1.7** in IMPLEMENTATION_PLAN.md - Basic App Shell creation
3. **Begin TDD cycle**: Write failing tests first, then implement components
4. **Reference TECHNICAL_SPECIFICATIONS.md** for detailed implementation patterns

## Critical Implementation Notes

### PDF.js Integration Requirements
- **MUST use npm package** `pdfjs-dist`, NOT CDN links
- **MUST implement multi-layer rendering**: Canvas + Text + Annotation layers
- **MUST use annotation layer** for native form field rendering
- **Worker configuration**: Use local worker file, not CDN

### TDD Requirements (Non-Negotiable)
- **Write tests first** before any component implementation
- **Red-Green-Refactor cycle** for all features
- **Minimum 80% code coverage** overall
- **90% coverage** for critical components (validation, PDF processing, wizard)
- **Follow TDD_GUIDELINES.md** exactly

### Performance Requirements
- **PDF Loading**: Under 3 seconds for 10MB documents
- **Field Navigation**: Under 100ms response time
- **Signature Canvas**: 60fps performance
- **Memory Management**: Efficient handling up to 50MB PDFs

### Architecture Constraints
- **No class components** - Use functional components with hooks only
- **TypeScript strict mode** - No `any` types without justification
- **Material-UI consistency** - All UI components must use MUI
- **State management** - Use React Context + useReducer, not external libraries
- **Feature flags** - Use Unleash client for controlled feature rollouts

## Development Workflow

1. **Always start with tests** (TDD requirement)
2. **Reference TECHNICAL_SPECIFICATIONS.md** for implementation patterns
3. **Follow IMPLEMENTATION_PLAN.md phases** sequentially
4. **Validate each component** before moving to next phase
5. **Run tests continuously** during development

## Warning: Common Pitfalls to Avoid

❌ **Don't use PDF.js from CDN** - Must use npm package for React integration
❌ **Don't skip tests** - TDD is mandatory for this project
❌ **Don't implement without reading specs** - Review TECHNICAL_SPECIFICATIONS.md patterns first
❌ **Don't deviate from plan** - Follow IMPLEMENTATION_PLAN.md phases sequentially
❌ **Don't ignore performance** - Monitor and optimize for specified targets

## Success Criteria for Phase 1

✅ **Project Setup Complete**
- React TypeScript app runs on port 7779
- All dependencies installed and configured
- Directory structure created
- PDF.js worker properly configured
- Basic app shell with Material-UI theme

✅ **Development Environment Ready**
- TDD workflow established
- ESLint and Prettier configured
- TypeScript strict mode enabled
- Tests running successfully

✅ **Ready for Phase 2**
- PDF.js integration preparation complete
- Documentation thoroughly reviewed
- Team aligned on TDD methodology
- Development server stable and performant

## Questions or Issues?

If you encounter any issues during setup:
1. **Verify Node.js version** (18+ recommended)
2. **Clear npm cache**: `npm cache clean --force`
3. **Delete node_modules** and reinstall if needed
4. **Check port availability**: Ensure 7779 is not in use
5. **Review error messages** carefully and resolve dependencies

## Your Mission

**Implement the complete Sprkz PDF Form Completion Platform following the comprehensive documentation provided.** 

Start with Phase 1, Step 1 project initialization, validate your setup, then proceed methodically through each phase using TDD methodology. Reference TECHNICAL_SPECIFICATIONS.md for detailed implementation patterns and maintain the high performance standards specified.

**Remember**: This is a professional-grade application with demanding performance requirements. Quality and attention to detail are paramount.

Begin implementation now! 🚀