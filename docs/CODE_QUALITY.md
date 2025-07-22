# Code Quality Guidelines

## Overview

The Sprkz PDF Form Completion Platform maintains high code quality standards through automated tooling, consistent formatting, and comprehensive testing. This document outlines the tools, configuration, and workflows used to ensure professional-grade code.

## Code Quality Stack

### Core Tools
- **ESLint**: JavaScript/TypeScript linting with custom rules
- **Prettier**: Code formatting for consistent style
- **Husky**: Git hooks for automated quality checks
- **lint-staged**: Pre-commit processing for staged files only
- **TypeScript**: Strict mode compilation with enhanced checks

### Testing Framework
- **Jest**: Test runner with React Testing Library integration
- **TDD Methodology**: Test-driven development approach (mandatory)
- **Coverage Requirements**: 80% overall, 90% for critical components

## Configuration

### ESLint Setup

**.eslintrc.js**:
```javascript
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### Prettier Configuration

**.prettierrc**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### TypeScript Strict Mode

**tsconfig.json** (enhanced settings):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Git Hooks with Husky

### Pre-commit Hook

**.husky/pre-commit**:
```bash
npx lint-staged
npm run test -- --run --watchAll=false --passWithNoTests
```

### lint-staged Configuration

**package.json**:
```json
{
  "lint-staged": {
    "src/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

## Available Scripts

### Linting Commands
```bash
# Check for linting errors (strict: max-warnings 0)
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Formatting Commands
```bash
# Format all source files with Prettier
npm run format

# Check if files are properly formatted
npm run format:check
```

### Testing Commands
```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/pre-commit)
npm run test -- --watchAll=false

# Run tests with coverage
npm run test -- --coverage
```

## Quality Standards

### Code Style Requirements
- ✅ **ESLint Clean**: Zero warnings allowed (`--max-warnings 0`)
- ✅ **Prettier Formatted**: All files must pass format check
- ✅ **TypeScript Strict**: All strict mode checks must pass
- ✅ **No Console Logs**: Remove before commit (except error handling)

### Testing Requirements
- ✅ **TDD Mandatory**: Write tests before implementation
- ✅ **Coverage Minimums**: 80% overall, 90% for critical components
- ✅ **Test Naming**: Descriptive test names following BDD format
- ✅ **No Skipped Tests**: All tests must be executable

### Component Standards
- ✅ **Functional Components**: Use hooks, not class components
- ✅ **TypeScript Types**: Explicit typing, avoid `any`
- ✅ **Props Interface**: Define interfaces for all component props
- ✅ **Material-UI Consistent**: Use MUI components and theme system

## Workflow

### Development Process
1. **Write Tests First**: Follow TDD red-green-refactor cycle
2. **Implement Features**: Write minimal code to pass tests
3. **Refactor**: Improve code quality while maintaining tests
4. **Commit**: Pre-commit hooks automatically format and lint
5. **Review**: All code goes through pull request review

### Pre-commit Checks
When you commit, the following happens automatically:
1. **lint-staged** processes only staged files
2. **ESLint --fix** automatically fixes common issues
3. **Prettier** formats code for consistency
4. **Tests run** to ensure no regressions
5. **Commit succeeds** only if all checks pass

### Manual Quality Checks
```bash
# Full quality check before push
npm run lint && npm run format:check && npm test -- --watchAll=false

# Fix all quality issues
npm run lint:fix && npm run format

# Comprehensive test run
npm test -- --coverage --watchAll=false
```

## IDE Integration

### VS Code Recommended Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

## Troubleshooting

### Common Issues

**Pre-commit Hook Fails**:
```bash
# Fix linting issues
npm run lint:fix

# Format all files
npm run format

# Run tests to identify failures
npm test
```

**TypeScript Errors**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Review tsconfig.json strict settings
```

**Husky Not Working**:
```bash
# Reinstall Husky hooks
npx husky install
```

### Performance Optimization
- **lint-staged** only processes changed files (fast commits)
- **ESLint cache** speeds up subsequent runs
- **Prettier cache** improves formatting performance
- **Jest cache** accelerates test execution

## Benefits

### Developer Experience
- 🚀 **Faster Development**: Automatic formatting and fixing
- 🔍 **Early Error Detection**: Catch issues before they reach production
- 📏 **Consistent Style**: All team members follow same standards
- 🧪 **Reliable Testing**: TDD ensures comprehensive test coverage

### Code Quality
- 🛡️ **Zero Runtime Errors**: TypeScript strict mode catches issues
- 📝 **Self-Documenting**: Consistent formatting makes code readable
- 🔄 **Easy Refactoring**: Comprehensive tests enable confident changes
- 👥 **Team Collaboration**: Standardized workflow for all contributors

### Professional Standards
- 🏢 **Industry Best Practices**: Follows modern JavaScript/React standards
- 📊 **Measurable Quality**: Coverage reports and linting metrics
- 🔧 **Automated Workflows**: Minimal manual intervention required
- 📈 **Scalable Practices**: Standards that work for teams of any size

This code quality setup ensures the Sprkz platform maintains professional-grade code quality throughout its development lifecycle.