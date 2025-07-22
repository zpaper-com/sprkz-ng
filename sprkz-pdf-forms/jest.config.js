const { createJestConfig } = require('@craco/craco');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Critical components require higher coverage
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/contexts/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  testTimeout: 10000,
  maxWorkers: '50%',
  // Performance optimizations
  testRunner: 'jest-circus/runner',
  workerIdleMemoryLimit: '512MB',
  // Custom test categories
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)'],
      testPathIgnorePatterns: ['/integration/', '/e2e/'],
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/src/**/__tests__/integration/**/*.test.(ts|tsx)'],
    },
  ],
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/config/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/config/globalTeardown.js',
  // Snapshot serializers
  snapshotSerializers: [
    '@emotion/jest/serializer',
  ],
  // Mock patterns
  moduleNameMapping: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__tests__/mocks/fileMock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // Test categories with different configurations
  testResultsProcessor: 'jest-sonar-reporter',
};