/**
 * Mobile browser detection utility
 */
export const isMobileBrowser = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/;
  
  // Check user agent
  const isMobileUserAgent = mobileRegex.test(userAgent);
  
  // Check screen size as additional indicator
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  
  return isMobileUserAgent || (isSmallScreen && isTouchDevice);
};

/**
 * Check if current path is already the mobile route
 */
export const isOnMobileRoute = (): boolean => {
  return window.location.pathname === '/mobile';
};

/**
 * Redirect to mobile interface if on mobile device and not already on mobile route
 */
export const redirectToMobileIfNeeded = (): void => {
  if (isMobileBrowser() && !isOnMobileRoute()) {
    window.location.href = '/mobile';
  }
};