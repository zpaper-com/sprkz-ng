module.exports = async () => {
  // Global test setup
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_UNLEASH_PROXY_URL = 'http://localhost:3002/proxy';
  process.env.REACT_APP_UNLEASH_CLIENT_KEY = 'test-key';
  process.env.REACT_APP_SENTRY_DSN = 'test-dsn';
  
  // Mock global objects that might be needed
  global.URL = global.URL || {
    createObjectURL: jest.fn(() => 'mocked-object-url'),
    revokeObjectURL: jest.fn(),
  };
  
  // Set up performance monitoring for tests
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      getEntriesByType: jest.fn(() => []),
    };
  }
  
  // Mock console methods to reduce test noise (except errors)
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = jest.fn();
  console.debug = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn((message, ...args) => {
    // Only show warnings that are not from React Testing Library
    if (!message.includes('Warning: ReactDOM.render is no longer supported')) {
      originalWarn(message, ...args);
    }
  });
  
  // Keep error logging but filter out expected test errors
  console.error = jest.fn((message, ...args) => {
    // Filter out known test-related errors
    const knownTestErrors = [
      'Warning: validateDOMNesting',
      'Warning: React.createFactory',
      'Warning: componentWillReceiveProps',
      'The above error occurred in the <',
    ];
    
    if (!knownTestErrors.some(error => message.includes(error))) {
      originalError(message, ...args);
    }
  });
  
  console.log('✅ Test environment setup complete');
};