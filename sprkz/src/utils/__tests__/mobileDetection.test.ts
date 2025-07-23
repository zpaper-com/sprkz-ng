import { isMobileBrowser, isOnMobileRoute, redirectToMobileIfNeeded } from '../mobileDetection';

// Mock window and navigator
const mockWindow = {
  innerWidth: 1024,
  location: { pathname: '/', href: '' },
  ontouchstart: undefined,
} as any;

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0,
} as any;

// Store original values
const originalWindow = global.window;
const originalNavigator = global.navigator;

describe('mobileDetection', () => {
  beforeEach(() => {
    // Reset mocks
    mockWindow.innerWidth = 1024;
    mockWindow.location.pathname = '/';
    mockWindow.location.href = '';
    mockWindow.ontouchstart = undefined;
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockNavigator.maxTouchPoints = 0;
    
    // Ensure globals are properly set
    Object.defineProperty(global, 'window', { value: mockWindow, writable: true });
    Object.defineProperty(global, 'navigator', { value: mockNavigator, writable: true });
  });

  afterAll(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('isMobileBrowser', () => {
    it('should return false for desktop user agent', () => {
      expect(isMobileBrowser()).toBe(false);
    });

    it('should return true for mobile user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      expect(isMobileBrowser()).toBe(true);
    });

    it('should return true for Android user agent', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)';
      expect(isMobileBrowser()).toBe(true);
    });

    it('should return true for small screen with touch capability', () => {
      mockWindow.innerWidth = 600;
      mockWindow.ontouchstart = null; // This indicates touch support
      expect(isMobileBrowser()).toBe(true);
    });

    it('should return false for small screen without touch capability', () => {
      mockWindow.innerWidth = 600;
      delete mockWindow.ontouchstart; // Remove the property entirely
      mockNavigator.maxTouchPoints = undefined;
      expect(isMobileBrowser()).toBe(false);
    });

    it('should return false when navigator is undefined', () => {
      global.navigator = undefined as any;
      expect(isMobileBrowser()).toBe(false);
    });

    it('should return false when window is undefined', () => {
      global.window = undefined as any;
      expect(isMobileBrowser()).toBe(false);
    });
  });

  describe('isOnMobileRoute', () => {
    it('should return false when not on mobile route', () => {
      mockWindow.location.pathname = '/';
      expect(isOnMobileRoute()).toBe(false);
    });

    it('should return true when on mobile route', () => {
      mockWindow.location.pathname = '/mobile';
      expect(isOnMobileRoute()).toBe(true);
    });
  });

  describe('redirectToMobileIfNeeded', () => {
    it('should redirect to mobile when on mobile browser and not on mobile route', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      mockWindow.location.pathname = '/';
      
      redirectToMobileIfNeeded();
      
      expect(mockWindow.location.href).toBe('/mobile');
    });

    it('should not redirect when on desktop browser', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      mockWindow.location.pathname = '/';
      
      redirectToMobileIfNeeded();
      
      expect(mockWindow.location.href).toBe('');
    });

    it('should not redirect when already on mobile route', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      mockWindow.location.pathname = '/mobile';
      
      redirectToMobileIfNeeded();
      
      expect(mockWindow.location.href).toBe('');
    });
  });
});