/**
 * Tests for Feature Flag Utilities
 */

import {
  isFeatureEnabled,
  isCurrentFeatureEnabled,
  getCurrentURLConfig,
  getURLConfig,
  getEnabledFeatures,
  getFeatureName,
  getFeatureDescription,
  areAllFeaturesEnabled,
  isAnyFeatureEnabled,
  getFeatureConfigSummary,
  toggleFeatureFlag,
  setFeatureFlags,
  getDefaultFeatureConfig,
  validateFeatureConfig,
  FEATURE_FLAGS,
} from '../featureFlags';
import type { URLConfig, Feature } from '../../contexts/AdminContext';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test-path'
  },
  writable: true
});

// Test data
const mockFeatures: Feature[] = [
  {
    id: 1,
    name: 'Fields Toggle Button',
    description: 'Show/hide field names overlay',
    notes: 'Test feature',
    creationDate: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'PDF Fit Width Button',
    description: 'Fit PDF to container width',
    notes: 'Another test feature',
    creationDate: '2024-01-01T00:00:00Z'
  }
];

const mockURLConfigs: URLConfig[] = [
  {
    id: 1,
    path: '/test-path',
    pdfPath: 'test.pdf',
    createdAt: '2024-01-01T00:00:00Z',
    features: {
      1: true,
      2: false,
      3: true
    },
    pdfFields: {}
  },
  {
    id: 2,
    path: '/other-path',
    pdfPath: 'other.pdf',
    createdAt: '2024-01-01T00:00:00Z',
    features: {
      1: false,
      2: true,
      3: false
    },
    pdfFields: {}
  }
];

describe('Feature Flag Utilities', () => {
  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled(mockURLConfigs, '/test-path', 1)).toBe(true);
      expect(isFeatureEnabled(mockURLConfigs, '/test-path', 3)).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(isFeatureEnabled(mockURLConfigs, '/test-path', 2)).toBe(false);
    });

    it('should return false for non-existent paths', () => {
      expect(isFeatureEnabled(mockURLConfigs, '/non-existent', 1)).toBe(false);
    });

    it('should return false for non-existent features', () => {
      expect(isFeatureEnabled(mockURLConfigs, '/test-path', 999)).toBe(false);
    });
  });

  describe('isCurrentFeatureEnabled', () => {
    it('should check feature for current path', () => {
      expect(isCurrentFeatureEnabled(mockURLConfigs, 1)).toBe(true);
      expect(isCurrentFeatureEnabled(mockURLConfigs, 2)).toBe(false);
    });
  });

  describe('getURLConfig', () => {
    it('should return config for existing path', () => {
      const config = getURLConfig(mockURLConfigs, '/test-path');
      expect(config).toBeDefined();
      expect(config?.path).toBe('/test-path');
    });

    it('should return null for non-existent path', () => {
      const config = getURLConfig(mockURLConfigs, '/non-existent');
      expect(config).toBeNull();
    });
  });

  describe('getCurrentURLConfig', () => {
    it('should return config for current path', () => {
      const config = getCurrentURLConfig(mockURLConfigs);
      expect(config).toBeDefined();
      expect(config?.path).toBe('/test-path');
    });
  });

  describe('getEnabledFeatures', () => {
    it('should return array of enabled feature IDs', () => {
      const enabled = getEnabledFeatures(mockURLConfigs, '/test-path');
      expect(enabled).toEqual([1, 3]);
    });

    it('should return empty array for non-existent path', () => {
      const enabled = getEnabledFeatures(mockURLConfigs, '/non-existent');
      expect(enabled).toEqual([]);
    });
  });

  describe('getFeatureName', () => {
    it('should return feature name for existing ID', () => {
      const name = getFeatureName(mockFeatures, 1);
      expect(name).toBe('Fields Toggle Button');
    });

    it('should return fallback name for non-existent ID', () => {
      const name = getFeatureName(mockFeatures, 999);
      expect(name).toBe('Feature 999');
    });
  });

  describe('getFeatureDescription', () => {
    it('should return feature description for existing ID', () => {
      const description = getFeatureDescription(mockFeatures, 1);
      expect(description).toBe('Show/hide field names overlay');
    });

    it('should return empty string for non-existent ID', () => {
      const description = getFeatureDescription(mockFeatures, 999);
      expect(description).toBe('');
    });
  });

  describe('areAllFeaturesEnabled', () => {
    it('should return true when all features are enabled', () => {
      expect(areAllFeaturesEnabled(mockURLConfigs, '/test-path', [1, 3])).toBe(true);
    });

    it('should return false when some features are disabled', () => {
      expect(areAllFeaturesEnabled(mockURLConfigs, '/test-path', [1, 2])).toBe(false);
    });
  });

  describe('isAnyFeatureEnabled', () => {
    it('should return true when at least one feature is enabled', () => {
      expect(isAnyFeatureEnabled(mockURLConfigs, '/test-path', [1, 2])).toBe(true);
    });

    it('should return false when no features are enabled', () => {
      expect(isAnyFeatureEnabled(mockURLConfigs, '/other-path', [1, 3])).toBe(false);
    });
  });

  describe('getFeatureConfigSummary', () => {
    it('should return summary for existing config', () => {
      const summary = getFeatureConfigSummary(mockURLConfigs, mockFeatures, '/test-path');
      expect(summary.configFound).toBe(true);
      expect(summary.enabledFeatures.length).toBeGreaterThan(0);
      expect(summary.enabledFeatures[0].name).toBe('Fields Toggle Button');
    });

    it('should return empty summary for non-existent config', () => {
      const summary = getFeatureConfigSummary(mockURLConfigs, mockFeatures, '/non-existent');
      expect(summary.configFound).toBe(false);
      expect(summary.enabledFeatures).toHaveLength(0);
      expect(summary.disabledFeatures).toHaveLength(0);
    });
  });

  describe('toggleFeatureFlag', () => {
    it('should toggle feature from true to false', () => {
      const originalConfig = mockURLConfigs[0];
      const toggledConfig = toggleFeatureFlag(originalConfig, 1);
      expect(toggledConfig.features[1]).toBe(false);
    });

    it('should toggle feature from false to true', () => {
      const originalConfig = mockURLConfigs[0];
      const toggledConfig = toggleFeatureFlag(originalConfig, 2);
      expect(toggledConfig.features[2]).toBe(true);
    });

    it('should not mutate original config', () => {
      const originalConfig = mockURLConfigs[0];
      const originalValue = originalConfig.features[1];
      toggleFeatureFlag(originalConfig, 1);
      expect(originalConfig.features[1]).toBe(originalValue);
    });
  });

  describe('setFeatureFlags', () => {
    it('should update multiple features', () => {
      const originalConfig = mockURLConfigs[0];
      const updatedConfig = setFeatureFlags(originalConfig, {
        1: false,
        2: true,
        4: true
      });
      
      expect(updatedConfig.features[1]).toBe(false);
      expect(updatedConfig.features[2]).toBe(true);
      expect(updatedConfig.features[4]).toBe(true);
      expect(updatedConfig.features[3]).toBe(true); // unchanged
    });
  });

  describe('getDefaultFeatureConfig', () => {
    it('should return default configuration', () => {
      const defaultConfig = getDefaultFeatureConfig();
      expect(defaultConfig[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]).toBe(true);
      expect(defaultConfig[FEATURE_FLAGS.EXPORT_BUTTON]).toBe(false);
    });
  });

  describe('validateFeatureConfig', () => {
    it('should validate correct configuration', () => {
      const config = { '1': true, '2': false };
      const result = validateFeatureConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid feature IDs', () => {
      const config = { 'invalid': true };
      const result = validateFeatureConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid feature ID: invalid');
    });

    it('should detect non-boolean values', () => {
      const config = { '1': 'not-boolean' };
      const result = validateFeatureConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Feature 1 must have a boolean value, got string');
    });
  });

  describe('FEATURE_FLAGS constants', () => {
    it('should have all expected feature flag constants', () => {
      expect(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBe(1);
      expect(FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON).toBe(2);
      expect(FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON).toBe(3);
      expect(FEATURE_FLAGS.WIZARD_BUTTON).toBe(4);
      expect(FEATURE_FLAGS.PDF_TITLE_DISPLAY).toBe(5);
      expect(FEATURE_FLAGS.PDF_FILENAME_DISPLAY).toBe(6);
      expect(FEATURE_FLAGS.THUMBNAIL_NAVIGATION).toBe(7);
      expect(FEATURE_FLAGS.WIZARD_STATUS_INDICATOR).toBe(8);
      expect(FEATURE_FLAGS.MINI_PROGRESS_INDICATOR).toBe(9);
      expect(FEATURE_FLAGS.PROGRESS_TRACKER).toBe(10);
      expect(FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM).toBe(11);
      expect(FEATURE_FLAGS.SIGNATURE_MODAL).toBe(12);
      expect(FEATURE_FLAGS.FORM_VALIDATION_DISPLAY).toBe(13);
      expect(FEATURE_FLAGS.EXPORT_BUTTON).toBe(14);
    });
  });
});