/**
 * Feature Flag Utilities for Admin Context
 * 
 * This module provides utility functions for managing feature flags
 * within the admin context system.
 */

import type { Feature, URLConfig } from '../contexts/AdminContext';

// Feature Flag Constants
export const FEATURE_FLAGS = {
  FIELDS_TOGGLE_BUTTON: 1,
  PDF_FIT_WIDTH_BUTTON: 2,
  PDF_FIT_HEIGHT_BUTTON: 3,
  WIZARD_BUTTON: 4,
  PDF_TITLE_DISPLAY: 5,
  PDF_FILENAME_DISPLAY: 6,
  THUMBNAIL_NAVIGATION: 7,
  WIZARD_STATUS_INDICATOR: 8,
  MINI_PROGRESS_INDICATOR: 9,
  PROGRESS_TRACKER: 10,
  FIELD_TOOLTIP_SYSTEM: 11,
  SIGNATURE_MODAL: 12,
  FORM_VALIDATION_DISPLAY: 13,
  EXPORT_BUTTON: 14,
  // Markup Tools
  MARKUP_TOOLBAR: 30,
  MARKUP_IMAGE_STAMP: 31,
  MARKUP_HIGHLIGHT_AREA: 32,
  MARKUP_SIGNATURE: 33,
  MARKUP_DATE_TIME_STAMP: 34,
  MARKUP_TEXT_AREA: 35,
  MARKUP_IMAGE_ATTACHMENT: 36,
} as const;

// Type for feature flag keys
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type FeatureFlagId = typeof FEATURE_FLAGS[FeatureFlagKey];

/**
 * Get URL configuration for a specific path
 */
export function getURLConfig(urls: URLConfig[], path: string): URLConfig | null {
  return urls.find(config => config.path === path) || null;
}

/**
 * Get current URL configuration based on window location
 */
export function getCurrentURLConfig(urls: URLConfig[]): URLConfig | null {
  const currentPath = window.location.pathname;
  return getURLConfig(urls, currentPath);
}

/**
 * Check if a feature flag is enabled for a specific URL
 */
export function isFeatureEnabled(
  urls: URLConfig[],
  path: string,
  featureId: FeatureFlagId
): boolean {
  const urlConfig = getURLConfig(urls, path);
  return urlConfig?.features[featureId] === true;
}

/**
 * Check if a feature flag is enabled for the current URL
 */
export function isCurrentFeatureEnabled(
  urls: URLConfig[],
  featureId: FeatureFlagId
): boolean {
  const currentPath = window.location.pathname;
  return isFeatureEnabled(urls, currentPath, featureId);
}

/**
 * Get all enabled features for a specific URL
 */
export function getEnabledFeatures(urls: URLConfig[], path: string): FeatureFlagId[] {
  const urlConfig = getURLConfig(urls, path);
  if (!urlConfig) return [];

  return Object.entries(urlConfig.features)
    .filter(([_, enabled]) => enabled === true)
    .map(([id, _]) => parseInt(id) as FeatureFlagId);
}

/**
 * Get feature name by ID
 */
export function getFeatureName(features: Feature[], featureId: FeatureFlagId): string {
  const feature = features.find(f => f.id === featureId);
  return feature?.name || `Feature ${featureId}`;
}

/**
 * Get feature description by ID
 */
export function getFeatureDescription(features: Feature[], featureId: FeatureFlagId): string {
  const feature = features.find(f => f.id === featureId);
  return feature?.description || '';
}

/**
 * Check if multiple features are all enabled
 */
export function areAllFeaturesEnabled(
  urls: URLConfig[],
  path: string,
  featureIds: FeatureFlagId[]
): boolean {
  return featureIds.every(id => isFeatureEnabled(urls, path, id));
}

/**
 * Check if any of the specified features are enabled
 */
export function isAnyFeatureEnabled(
  urls: URLConfig[],
  path: string,
  featureIds: FeatureFlagId[]
): boolean {
  return featureIds.some(id => isFeatureEnabled(urls, path, id));
}

/**
 * Get feature configuration summary for debugging
 */
export function getFeatureConfigSummary(
  urls: URLConfig[],
  features: Feature[],
  path: string
): {
  path: string;
  configFound: boolean;
  enabledFeatures: Array<{ id: FeatureFlagId; name: string }>;
  disabledFeatures: Array<{ id: FeatureFlagId; name: string }>;
} {
  const urlConfig = getURLConfig(urls, path);
  
  if (!urlConfig) {
    return {
      path,
      configFound: false,
      enabledFeatures: [],
      disabledFeatures: [],
    };
  }

  const allFeatureIds = features.map(f => f.id as FeatureFlagId);
  
  const enabledFeatures = allFeatureIds
    .filter(id => urlConfig.features[id] === true)
    .map(id => ({ id, name: getFeatureName(features, id) }));
  
  const disabledFeatures = allFeatureIds
    .filter(id => urlConfig.features[id] === false)
    .map(id => ({ id, name: getFeatureName(features, id) }));

  return {
    path,
    configFound: true,
    enabledFeatures,
    disabledFeatures,
  };
}

/**
 * Toggle feature flag for a specific URL configuration
 */
export function toggleFeatureFlag(
  urlConfig: URLConfig,
  featureId: FeatureFlagId
): URLConfig {
  const currentState = urlConfig.features[featureId];
  const newState = !currentState;
  
  return {
    ...urlConfig,
    features: {
      ...urlConfig.features,
      [featureId]: newState,
    },
  };
}

/**
 * Set multiple feature flags at once
 */
export function setFeatureFlags(
  urlConfig: URLConfig,
  featureUpdates: Partial<Record<FeatureFlagId, boolean>>
): URLConfig {
  return {
    ...urlConfig,
    features: {
      ...urlConfig.features,
      ...featureUpdates,
    },
  };
}

/**
 * Get default feature configuration for new URL configs
 */
export function getDefaultFeatureConfig(): Record<FeatureFlagId, boolean> {
  return {
    [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: true,
    [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: true,
    [FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON]: true,
    [FEATURE_FLAGS.WIZARD_BUTTON]: true,
    [FEATURE_FLAGS.PDF_TITLE_DISPLAY]: true,
    [FEATURE_FLAGS.PDF_FILENAME_DISPLAY]: true,
    [FEATURE_FLAGS.THUMBNAIL_NAVIGATION]: true,
    [FEATURE_FLAGS.WIZARD_STATUS_INDICATOR]: true,
    [FEATURE_FLAGS.MINI_PROGRESS_INDICATOR]: true,
    [FEATURE_FLAGS.PROGRESS_TRACKER]: true,
    [FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM]: true,
    [FEATURE_FLAGS.SIGNATURE_MODAL]: true,
    [FEATURE_FLAGS.FORM_VALIDATION_DISPLAY]: true,
    [FEATURE_FLAGS.EXPORT_BUTTON]: false, // New features default to disabled
    // Markup Tools - default to disabled for controlled rollout
    [FEATURE_FLAGS.MARKUP_TOOLBAR]: false,
    [FEATURE_FLAGS.MARKUP_IMAGE_STAMP]: false,
    [FEATURE_FLAGS.MARKUP_HIGHLIGHT_AREA]: false,
    [FEATURE_FLAGS.MARKUP_SIGNATURE]: false,
    [FEATURE_FLAGS.MARKUP_DATE_TIME_STAMP]: false,
    [FEATURE_FLAGS.MARKUP_TEXT_AREA]: false,
    [FEATURE_FLAGS.MARKUP_IMAGE_ATTACHMENT]: false,
  };
}

/**
 * Validate feature configuration object
 */
export function validateFeatureConfig(
  features: Record<string, boolean>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for valid feature IDs
  for (const [key, value] of Object.entries(features)) {
    const id = parseInt(key);
    if (isNaN(id) || id < 1) {
      errors.push(`Invalid feature ID: ${key}`);
    }
    
    if (typeof value !== 'boolean') {
      errors.push(`Feature ${key} must have a boolean value, got ${typeof value}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}