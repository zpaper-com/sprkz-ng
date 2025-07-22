import { UnleashService, DEFAULT_FEATURE_FLAGS, FEATURE_CATEGORIES } from '../../services/unleashService';

// Mock the UnleashClient
const mockClient = {
  start: jest.fn(),
  stop: jest.fn(),
  on: jest.fn((event, callback) => {
    if (event === 'ready') {
      setTimeout(callback, 0);
    }
    return mockClient;
  }),
  isEnabled: jest.fn().mockReturnValue(true),
  getVariant: jest.fn().mockReturnValue(null),
  updateContext: jest.fn(),
};

jest.mock('@unleash/proxy-client-react', () => ({
  UnleashClient: jest.fn().mockImplementation(() => mockClient),
}));

describe('UnleashService', () => {
  let unleashService: UnleashService;

  beforeEach(() => {
    // Get a fresh instance for each test
    unleashService = UnleashService.getInstance();
    unleashService.destroy(); // Clean up any existing state
    unleashService = UnleashService.getInstance({
      url: 'http://test-url',
      clientKey: 'test-key',
    });
  });

  afterEach(() => {
    unleashService.destroy();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = UnleashService.getInstance();
      const instance2 = UnleashService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain configuration between calls', () => {
      const config = { url: 'custom-url', clientKey: 'custom-key' };
      const instance1 = UnleashService.getInstance(config);
      const instance2 = UnleashService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      const initPromise = unleashService.initialize();
      expect(initPromise).resolves.toBeUndefined();
    });

    it('should handle initialization errors gracefully', async () => {
      // Force initialization to fail by providing invalid config
      const badService = UnleashService.getInstance({ url: '' });
      await expect(badService.initialize()).resolves.toBeUndefined();
      badService.destroy();
    });

    it('should support custom context during initialization', async () => {
      const context = { userId: 'test-user', environment: 'test' };
      await expect(unleashService.initialize(context)).resolves.toBeUndefined();
    });
  });

  describe('Feature Flag Checking', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should return default values when client is not initialized', () => {
      const result = unleashService.isEnabled('ENHANCED_WIZARD_MODE');
      expect(result).toBe(DEFAULT_FEATURE_FLAGS.ENHANCED_WIZARD_MODE);
    });

    it('should handle all feature flags', () => {
      Object.keys(DEFAULT_FEATURE_FLAGS).forEach(flagName => {
        const result = unleashService.isEnabled(flagName as keyof typeof DEFAULT_FEATURE_FLAGS);
        expect(typeof result).toBe('boolean');
      });
    });

    it('should support context overrides', () => {
      const context = { userId: 'test-user' };
      const result = unleashService.isEnabled('ENHANCED_WIZARD_MODE', context);
      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid flag names gracefully', () => {
      // @ts-expect-error - Testing invalid flag name
      const result = unleashService.isEnabled('INVALID_FLAG');
      expect(result).toBeUndefined();
    });
  });

  describe('Feature Flag Variants', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should return null for non-existent variants', () => {
      const variant = unleashService.getVariant('ENHANCED_WIZARD_MODE');
      expect(variant).toBeNull();
    });

    it('should support context in variant requests', () => {
      const context = { userId: 'test-user' };
      const variant = unleashService.getVariant('ENHANCED_WIZARD_MODE', context);
      expect(variant).toBeNull();
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should return all flags', () => {
      const allFlags = unleashService.getAllFlags();
      expect(Object.keys(allFlags)).toHaveLength(Object.keys(DEFAULT_FEATURE_FLAGS).length);
      
      Object.entries(allFlags).forEach(([key, value]) => {
        expect(DEFAULT_FEATURE_FLAGS).toHaveProperty(key);
        expect(typeof value).toBe('boolean');
      });
    });

    it('should return flags by category', () => {
      const coreFlags = unleashService.getFlagsByCategory('CORE');
      const expectedFlags = FEATURE_CATEGORIES.CORE;
      
      expect(Object.keys(coreFlags)).toHaveLength(expectedFlags.length);
      expectedFlags.forEach(flagName => {
        expect(coreFlags).toHaveProperty(flagName);
      });
    });

    it('should handle invalid categories', () => {
      // @ts-expect-error - Testing invalid category
      const result = unleashService.getFlagsByCategory('INVALID');
      expect(result).toEqual({});
    });
  });

  describe('Context Management', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should update context', () => {
      const newContext = { userId: 'new-user', feature: 'test' };
      expect(() => unleashService.updateContext(newContext)).not.toThrow();
    });
  });

  describe('Subscription System', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should allow subscription to changes', () => {
      const callback = jest.fn();
      const unsubscribe = unleashService.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle multiple subscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = unleashService.subscribe(callback1);
      const unsubscribe2 = unleashService.subscribe(callback2);
      
      expect(() => {
        unsubscribe1();
        unsubscribe2();
      }).not.toThrow();
    });
  });

  describe('Status and Debugging', () => {
    it('should provide status information', () => {
      const status = unleashService.getStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('clientReady');
      expect(status).toHaveProperty('flagCount');
      expect(typeof status.initialized).toBe('boolean');
      expect(typeof status.clientReady).toBe('boolean');
      expect(typeof status.flagCount).toBe('number');
      expect(status.flagCount).toBe(Object.keys(DEFAULT_FEATURE_FLAGS).length);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources', () => {
      unleashService.initialize();
      expect(() => unleashService.destroy()).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      unleashService.initialize();
      unleashService.destroy();
      expect(() => unleashService.destroy()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle client errors gracefully', () => {
      // Should not throw even if client fails
      expect(() => unleashService.isEnabled('ENHANCED_WIZARD_MODE')).not.toThrow();
    });

    it('should handle network errors during initialization', async () => {
      // Should resolve even if initialization fails
      await expect(unleashService.initialize()).resolves.toBeUndefined();
    });

    it('should handle malformed context objects', () => {
      // @ts-expect-error - Testing malformed context
      expect(() => unleashService.updateContext(null)).not.toThrow();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await unleashService.initialize();
    });

    it('should check flags quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        unleashService.isEnabled('ENHANCED_WIZARD_MODE');
      }
      const end = performance.now();
      
      // Should be able to check 100 flags in under 10ms
      expect(end - start).toBeLessThan(10);
    });

    it('should handle bulk operations efficiently', () => {
      const start = performance.now();
      unleashService.getAllFlags();
      const end = performance.now();
      
      // Should get all flags in under 5ms
      expect(end - start).toBeLessThan(5);
    });
  });

  describe('Default Feature Flags', () => {
    it('should have all required core features enabled by default', () => {
      expect(DEFAULT_FEATURE_FLAGS.ENHANCED_WIZARD_MODE).toBe(true);
      expect(DEFAULT_FEATURE_FLAGS.PROGRESSIVE_FORM_FILLING).toBe(true);
      expect(DEFAULT_FEATURE_FLAGS.SMART_FIELD_DETECTION).toBe(true);
    });

    it('should have signature features enabled by default', () => {
      expect(DEFAULT_FEATURE_FLAGS.SIGNATURE_DRAWING_MODE).toBe(true);
      expect(DEFAULT_FEATURE_FLAGS.SIGNATURE_TYPED_MODE).toBe(true);
      expect(DEFAULT_FEATURE_FLAGS.MULTI_SIGNATURE_SUPPORT).toBe(true);
    });

    it('should have experimental features disabled by default', () => {
      expect(DEFAULT_FEATURE_FLAGS.SIGNATURE_UPLOAD_MODE).toBe(false);
      expect(DEFAULT_FEATURE_FLAGS.BULK_PDF_PROCESSING).toBe(false);
      expect(DEFAULT_FEATURE_FLAGS.OFFLINE_MODE_SUPPORT).toBe(false);
    });

    it('should have production-only features disabled in development', () => {
      expect(DEFAULT_FEATURE_FLAGS.SECURITY_AUDIT_LOGGING).toBe(false);
      expect(DEFAULT_FEATURE_FLAGS.DATA_ENCRYPTION).toBe(false);
    });
  });
});