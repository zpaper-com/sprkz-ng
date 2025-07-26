/**
 * Layout selection utility for mobile/desktop layouts
 */

import { isMobileBrowser } from './mobileDetection';

export interface URLConfigWithLayouts {
  path: string;
  pdfPath?: string;
  desktopLayoutId?: number;
  mobileLayoutId?: number;
  desktopFeatures?: { [featureId: number]: boolean };
  mobileFeatures?: { [featureId: number]: boolean };
  pdfFields?: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
}

export interface SelectedLayoutConfig {
  layoutId?: number;
  features: { [featureId: number]: boolean };
  deviceType: 'mobile' | 'desktop';
}

/**
 * Select the appropriate layout configuration based on the current device
 */
export const selectLayoutForDevice = (urlConfig: URLConfigWithLayouts): SelectedLayoutConfig => {
  const isMobile = isMobileBrowser();
  
  if (isMobile) {
    return {
      layoutId: urlConfig.mobileLayoutId,
      features: urlConfig.mobileFeatures || {},
      deviceType: 'mobile'
    };
  } else {
    return {
      layoutId: urlConfig.desktopLayoutId,
      features: urlConfig.desktopFeatures || {},
      deviceType: 'desktop'
    };
  }
};

/**
 * Get the current URL configuration with selected layout
 */
export const getCurrentURLConfigWithLayout = async (currentPath: string): Promise<SelectedLayoutConfig | null> => {
  try {
    const response = await fetch('/api/url-configs');
    const urlConfigs: URLConfigWithLayouts[] = await response.json();
    
    // Find matching URL configuration
    const urlConfig = urlConfigs.find(config => config.path === currentPath);
    
    if (!urlConfig) {
      return null;
    }
    
    return selectLayoutForDevice(urlConfig);
  } catch (error) {
    console.error('Error fetching URL configuration:', error);
    return null;
  }
};

/**
 * Apply layout-specific features based on device type
 */
export const applyLayoutFeatures = (features: { [featureId: number]: boolean }): void => {
  // This function can be extended to apply specific layout features
  // For now, it stores the features for use by other components
  if (typeof window !== 'undefined') {
    (window as any).__sprkzLayoutFeatures = features;
  }
};

/**
 * Get current layout features
 */
export const getCurrentLayoutFeatures = (): { [featureId: number]: boolean } => {
  if (typeof window !== 'undefined') {
    return (window as any).__sprkzLayoutFeatures || {};
  }
  return {};
};