# Getting Started - Claude Code Implementation Prompt

## Context for Claude Code

You are tasked with implementing the **Sprkz PDF Form Completion Platform**, a React-based interactive PDF form filling application. This is a **greenfield project** with comprehensive documentation but **no implementation code yet**.

### Development Approach

**Testing-Driven Development**: This project follows a testing-first approach where at each phase you should:

- ✅ Implement the features for that phase
- ✅ Get the development server running (`npm start`)
- ✅ Test the functionality manually in the browser
- ✅ Stop and validate with the user before proceeding to the next phase

This ensures steady progress and catches issues early in the development process.

### Project Overview
- **Objective**: Build a guided, wizard-style PDF form completion platform using React + PDF.js
- **Key Features**: Interactive form filling, signature capture (drawing + typed), wizard navigation, real-time validation
- **Target**: Professional-grade form completion with 60fps signature performance and sub-100ms navigation

## Essential Documentation (Read First)

Before beginning implementation, **YOU MUST READ** these documentation files in order:

1. **README.md** - Documentation hierarchy and navigation guide
2. **IMPLEMENTATION_PLAN.md** - Master implementation plan with phases (THIS IS YOUR PRIMARY GUIDE)
3. **PRD.md** - Business requirements and user experience specifications  
4. **TDD_GUIDELINES.md** - Test-driven development methodology (this project REQUIRES TDD)
5. **WIZARD_FEATURE.md** - Detailed wizard navigation specifications

### Architecture Overview
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **PDF Processing**: PDF.js with native annotation layer (NOT CDN - use npm package)
- **State Management**: React Context + useReducer
- **Testing**: Jest + React Testing Library with TDD methodology
- **Build Tool**: Create React App (standard React build tool)
- **Port**: 7779 (spells "SPRZ" on phone keypad)

## Your First Implementation Task

### Phase 1, Step 1: Project Initialization

Execute the following setup exactly as specified in IMPLEMENTATION_PLAN.md Phase 1:

#### 1.1 Create React TypeScript Project
```bash
# Create the project
npx create-react-app sprkz --template typescript
cd sprkz

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

### ✅ Environment Validation
1. **Port configuration**: App should be accessible at `http://localhost:7779`
2. **Environment variables**: `.env` file contains PORT=7779, PDF worker URL, and default PDF path
3. **Development server**: Hot reloading works correctly

### ✅ Phase Testing Protocol

**IMPORTANT**: After each phase implementation, follow this testing protocol:

1. **Start the development server**: `npm start`
2. **Manual testing**: Test all features implemented in the current phase
3. **Browser testing**: Verify functionality works correctly
4. **Console check**: Ensure no errors in the browser console
5. **Stop and validate**: Pause development and validate with the user before proceeding

**Phase Testing Checklist**:
- [ ] Features work as expected in browser
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no lag or freezing)
- [ ] UI looks correct and responsive
- [ ] User tested and approved to proceed to next phase

## Next Steps After Validation

Once basic setup is complete and validated:

1. **Read TDD_GUIDELINES.md** thoroughly - This project requires test-driven development
2. **Proceed to Phase 1, Step 1.7** in IMPLEMENTATION_PLAN.md - Basic App Shell creation
3. **Begin TDD cycle**: Write failing tests first, then implement components
4. **Reference TECHNICAL_SPECIFICATIONS.md** for detailed implementation patterns
5. **Test each phase**: After completing each phase, run the server and test with the user before proceeding

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

## Development Workflow

1. **Always start with tests** (TDD requirement)
2. **Reference TECHNICAL_SPECIFICATIONS.md** for implementation patterns
3. **Follow IMPLEMENTATION_PLAN.md phases** sequentially
4. **Test each phase** - Get server running and test with user before proceeding
5. **Validate each component** before moving to next phase
6. **Run tests continuously** during development

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