/**
 * Comprehensive Tests for Feature Flag Hooks
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import {
  useFeatureFlag,
  useFeatureFlagByKey,
  useFeatureFlagForPath,
  useEnabledFeatures,
  useCurrentURLConfig,
  useURLConfig,
  useFeatureFlags,
  useFeatureConfigSummary,
  useComponentFeatures,
  usePDFViewerFeatures,
  useWizardFeatures,
  useFormFeatures,
  useFeatureFlagDebug,
} from '../useFeatureFlags';
import { FEATURE_FLAGS } from '../../admin/utils/featureFlags';
import type { AdminState, URLConfig, Feature } from '../../admin/contexts/AdminContext';

// Mock window.location with dynamic pathname
const mockPathname = jest.fn(() => '/test');
Object.defineProperty(window, 'location', {
  value: {
    get pathname() { return mockPathname(); }
  },
  writable: true
});

// Mock console methods for debug tests
const mockConsoleGroup = jest.spyOn(console, 'group').mockImplementation();
const mockConsoleTable = jest.spyOn(console, 'table').mockImplementation();
const mockConsoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation();

// Create mock admin state with configurable data
let mockAdminState: AdminState = {
  urls: [
    {
      id: 1,
      path: '/test',
      pdfPath: 'test.pdf',
      createdAt: '2024-01-01T00:00:00Z',
      features: {
        [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: true,
        [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: false,
        [FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON]: true,
        [FEATURE_FLAGS.WIZARD_BUTTON]: true,
        [FEATURE_FLAGS.PDF_TITLE_DISPLAY]: true,
        [FEATURE_FLAGS.PDF_FILENAME_DISPLAY]: true,
        [FEATURE_FLAGS.THUMBNAIL_NAVIGATION]: false,
        [FEATURE_FLAGS.WIZARD_STATUS_INDICATOR]: true,
        [FEATURE_FLAGS.MINI_PROGRESS_INDICATOR]: false,
        [FEATURE_FLAGS.PROGRESS_TRACKER]: true,
        [FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM]: true,
        [FEATURE_FLAGS.SIGNATURE_MODAL]: false,
        [FEATURE_FLAGS.FORM_VALIDATION_DISPLAY]: true,
        [FEATURE_FLAGS.EXPORT_BUTTON]: false
      },
      pdfFields: {}
    },
    {
      id: 2,
      path: '/another-path',
      pdfPath: 'another.pdf',
      createdAt: '2024-01-01T00:00:00Z',
      features: {
        [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: false,
        [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: true,
        [FEATURE_FLAGS.WIZARD_BUTTON]: false,
        [FEATURE_FLAGS.SIGNATURE_MODAL]: true,
        [FEATURE_FLAGS.FORM_VALIDATION_DISPLAY]: false,
      },
      pdfFields: {}
    }
  ],
  features: [
    {
      id: FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON,
      name: 'Fields Toggle Button',
      description: 'Show/hide field names overlay',
      category: 'pdf-viewer',
      enabled: true,
    },
    {
      id: FEATURE_FLAGS.WIZARD_BUTTON,
      name: 'Wizard Button',
      description: 'Guided form completion',
      category: 'wizard',
      enabled: true,
    }
  ],
  pdfs: [],
  loading: false,
  error: null,
};

// Mock the useAdmin hook with dynamic state
jest.mock('../../admin/contexts/AdminContext', () => ({
  useAdmin: () => ({
    state: mockAdminState,
    actions: {
      loadURLs: jest.fn(),
      createURL: jest.fn(),
      updateURL: jest.fn(),
      deleteURL: jest.fn(),
      loadFeatures: jest.fn(),
      updateFeature: jest.fn(),
      loadPDFs: jest.fn(),
      uploadPDF: jest.fn(),
      deletePDF: jest.fn(),
    }
  })
}));

describe('Feature Flag Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/test');
    
    // Reset mock state
    mockAdminState = {
      urls: [
        {
          id: 1,
          path: '/test',
          pdfPath: 'test.pdf',
          createdAt: '2024-01-01T00:00:00Z',
          features: {
            [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: true,
            [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: false,
            [FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON]: true,
            [FEATURE_FLAGS.WIZARD_BUTTON]: true,
            [FEATURE_FLAGS.PDF_TITLE_DISPLAY]: true,
            [FEATURE_FLAGS.PDF_FILENAME_DISPLAY]: true,
            [FEATURE_FLAGS.THUMBNAIL_NAVIGATION]: false,
            [FEATURE_FLAGS.WIZARD_STATUS_INDICATOR]: true,
            [FEATURE_FLAGS.MINI_PROGRESS_INDICATOR]: false,
            [FEATURE_FLAGS.PROGRESS_TRACKER]: true,
            [FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM]: true,
            [FEATURE_FLAGS.SIGNATURE_MODAL]: false,
            [FEATURE_FLAGS.FORM_VALIDATION_DISPLAY]: true,
            [FEATURE_FLAGS.EXPORT_BUTTON]: false
          },
          pdfFields: {}
        },
        {
          id: 2,
          path: '/another-path',
          pdfPath: 'another.pdf',
          createdAt: '2024-01-01T00:00:00Z',
          features: {
            [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: false,
            [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: true,
            [FEATURE_FLAGS.WIZARD_BUTTON]: false,
            [FEATURE_FLAGS.SIGNATURE_MODAL]: true,
            [FEATURE_FLAGS.FORM_VALIDATION_DISPLAY]: false,
          },
          pdfFields: {}
        }
      ],
      features: [
        {
          id: FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON,
          name: 'Fields Toggle Button',
          description: 'Show/hide field names overlay',
          category: 'pdf-viewer',
          enabled: true,
        },
        {
          id: FEATURE_FLAGS.WIZARD_BUTTON,
          name: 'Wizard Button',
          description: 'Guided form completion',
          category: 'wizard',
          enabled: true,
        }
      ],
      pdfs: [],
      loading: false,
      error: null,
    };
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

    it('should have proper type definitions', () => {
      expect(typeof FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBe('number');
      expect(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBeGreaterThan(0);
    });
  });

  describe('useFeatureFlag', () => {
    it('should return true when feature is enabled for current path', () => {
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(true);
    });

    it('should return false when feature is disabled for current path', () => {
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON));
      expect(result.current).toBe(false);
    });

    it('should return false when no URL config exists for current path', () => {
      mockPathname.mockReturnValue('/nonexistent-path');
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(false);
    });

    it('should update when path changes', () => {
      const { result, rerender } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(true);

      mockPathname.mockReturnValue('/another-path');
      rerender();
      expect(result.current).toBe(false);
    });
  });

  describe('useFeatureFlagByKey', () => {
    it('should return correct value using feature key', () => {
      const { result } = renderHook(() => useFeatureFlagByKey('FIELDS_TOGGLE_BUTTON'));
      expect(result.current).toBe(true);
    });

    it('should work with different feature keys', () => {
      const { result: fieldsResult } = renderHook(() => useFeatureFlagByKey('FIELDS_TOGGLE_BUTTON'));
      const { result: wizardResult } = renderHook(() => useFeatureFlagByKey('WIZARD_BUTTON'));

      expect(fieldsResult.current).toBe(true);
      expect(wizardResult.current).toBe(true);
    });
  });

  describe('useFeatureFlagForPath', () => {
    it('should return correct value for specified path', () => {
      const { result } = renderHook(() => 
        useFeatureFlagForPath('/another-path', FEATURE_FLAGS.SIGNATURE_MODAL)
      );
      expect(result.current).toBe(true);
    });

    it('should return false for nonexistent path', () => {
      const { result } = renderHook(() => 
        useFeatureFlagForPath('/nonexistent', FEATURE_FLAGS.WIZARD_BUTTON)
      );
      expect(result.current).toBe(false);
    });

    it('should handle different paths correctly', () => {
      const { result: testPathResult } = renderHook(() => 
        useFeatureFlagForPath('/test', FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON)
      );
      const { result: anotherPathResult } = renderHook(() => 
        useFeatureFlagForPath('/another-path', FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON)
      );

      expect(testPathResult.current).toBe(true);
      expect(anotherPathResult.current).toBe(false);
    });
  });

  describe('useEnabledFeatures', () => {
    it('should return list of enabled feature IDs for current path', () => {
      const { result } = renderHook(() => useEnabledFeatures());
      
      const enabledFeatures = result.current;
      expect(enabledFeatures).toContain(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON);
      expect(enabledFeatures).toContain(FEATURE_FLAGS.WIZARD_BUTTON);
      expect(enabledFeatures).not.toContain(FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON);
    });

    it('should return empty array when no URL config exists', () => {
      mockPathname.mockReturnValue('/nonexistent-path');
      const { result } = renderHook(() => useEnabledFeatures());
      expect(result.current).toEqual([]);
    });

    it('should update when pathname changes', () => {
      const { result, rerender } = renderHook(() => useEnabledFeatures());
      
      expect(result.current).toContain(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON);
      
      mockPathname.mockReturnValue('/another-path');
      rerender();
      
      expect(result.current).not.toContain(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON);
      expect(result.current).toContain(FEATURE_FLAGS.SIGNATURE_MODAL);
    });
  });

  describe('useCurrentURLConfig', () => {
    it('should return current URL config', () => {
      const { result } = renderHook(() => useCurrentURLConfig());
      expect(result.current).toEqual(mockAdminState.urls[0]);
    });

    it('should return null when no config exists for current path', () => {
      mockPathname.mockReturnValue('/nonexistent-path');
      const { result } = renderHook(() => useCurrentURLConfig());
      expect(result.current).toBeNull();
    });

    it('should update when path changes', () => {
      const { result, rerender } = renderHook(() => useCurrentURLConfig());
      expect(result.current?.path).toBe('/test');

      mockPathname.mockReturnValue('/another-path');
      rerender();
      expect(result.current?.path).toBe('/another-path');
    });
  });

  describe('useURLConfig', () => {
    it('should return URL config for specified path', () => {
      const { result } = renderHook(() => useURLConfig('/another-path'));
      expect(result.current).toEqual(mockAdminState.urls[1]);
    });

    it('should return null for nonexistent path', () => {
      const { result } = renderHook(() => useURLConfig('/nonexistent'));
      expect(result.current).toBeNull();
    });

    it('should be independent of current pathname', () => {
      mockPathname.mockReturnValue('/some-other-path');
      const { result } = renderHook(() => useURLConfig('/test'));
      expect(result.current?.path).toBe('/test');
    });
  });

  describe('useFeatureFlags', () => {
    it('should return object with multiple feature flag states', () => {
      const featureIds = [
        FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON,
        FEATURE_FLAGS.WIZARD_BUTTON,
        FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON,
      ];
      
      const { result } = renderHook(() => useFeatureFlags(featureIds));

      expect(result.current).toEqual({
        [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]: true,
        [FEATURE_FLAGS.WIZARD_BUTTON]: true,
        [FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON]: false,
      });
    });

    it('should handle empty feature IDs array', () => {
      const { result } = renderHook(() => useFeatureFlags([]));
      expect(result.current).toEqual({});
    });

    it('should update when path changes', () => {
      const featureIds = [FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON, FEATURE_FLAGS.SIGNATURE_MODAL];
      const { result, rerender } = renderHook(() => useFeatureFlags(featureIds));
      
      expect(result.current[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]).toBe(true);
      expect(result.current[FEATURE_FLAGS.SIGNATURE_MODAL]).toBe(false);

      mockPathname.mockReturnValue('/another-path');
      rerender();
      
      expect(result.current[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]).toBe(false);
      expect(result.current[FEATURE_FLAGS.SIGNATURE_MODAL]).toBe(true);
    });
  });

  describe('useFeatureConfigSummary', () => {
    it('should return feature config summary for current path', () => {
      const { result } = renderHook(() => useFeatureConfigSummary());

      expect(result.current.configFound).toBe(true);
      expect(result.current.path).toBe('/test');
      expect(result.current.enabledFeatures.length).toBeGreaterThan(0);
      expect(result.current.disabledFeatures.length).toBeGreaterThan(0);
    });

    it('should return summary for specified path', () => {
      const { result } = renderHook(() => useFeatureConfigSummary('/another-path'));

      expect(result.current.configFound).toBe(true);
      expect(result.current.path).toBe('/another-path');
    });

    it('should handle nonexistent path', () => {
      const { result } = renderHook(() => useFeatureConfigSummary('/nonexistent'));

      expect(result.current.configFound).toBe(false);
      expect(result.current.enabledFeatures).toEqual([]);
    });
  });

  describe('useComponentFeatures', () => {
    it('should return component feature flags when config exists', () => {
      const { result } = renderHook(() => useComponentFeatures());

      expect(result.current).toEqual({
        hasFieldsToggle: true,
        hasPDFFitControls: true, // PDF_FIT_HEIGHT_BUTTON is true
        hasWizardButton: true,
        hasThumbnailNavigation: false,
        hasProgressIndicators: true, // PROGRESS_TRACKER and WIZARD_STATUS_INDICATOR are true
        hasTooltipSystem: true,
        hasValidationDisplay: true,
        hasSignatureModal: false,
      });
    });

    it('should return all false when no config exists', () => {
      mockPathname.mockReturnValue('/nonexistent-path');
      const { result } = renderHook(() => useComponentFeatures());

      expect(result.current).toEqual({
        hasFieldsToggle: false,
        hasPDFFitControls: false,
        hasWizardButton: false,
        hasThumbnailNavigation: false,
        hasProgressIndicators: false,
        hasTooltipSystem: false,
        hasValidationDisplay: false,
        hasSignatureModal: false,
      });
    });

    it('should detect PDF fit controls correctly', () => {
      // Test when only width button is enabled
      mockAdminState.urls[0].features[FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON] = true;
      
      const { result } = renderHook(() => useComponentFeatures());
      expect(result.current.hasPDFFitControls).toBe(true);
    });
  });

  describe('usePDFViewerFeatures', () => {
    it('should return PDF viewer specific features', () => {
      const { result } = renderHook(() => usePDFViewerFeatures());

      expect(result.current).toEqual({
        showFieldsToggle: true,
        showFitWidthButton: false,
        showFitHeightButton: true,
        showTitleDisplay: true,
        showFilenameDisplay: true,
        showThumbnailNavigation: false,
        hasAnyControls: true, // Fields toggle is true
      });
    });

    it('should set hasAnyControls to false when no controls are enabled', () => {
      mockAdminState.urls[0].features[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON] = false;
      
      const { result } = renderHook(() => usePDFViewerFeatures());
      expect(result.current.hasAnyControls).toBe(false);
    });

    it('should update when individual features change', () => {
      const { result, rerender } = renderHook(() => usePDFViewerFeatures());
      expect(result.current.showFieldsToggle).toBe(true);

      mockPathname.mockReturnValue('/another-path');
      rerender();
      expect(result.current.showFieldsToggle).toBe(false);
      expect(result.current.showFitWidthButton).toBe(true);
    });
  });

  describe('useWizardFeatures', () => {
    it('should return wizard specific features', () => {
      const { result } = renderHook(() => useWizardFeatures());

      expect(result.current).toEqual({
        showWizardButton: true,
        showStatusIndicator: true,
        showProgressTracker: true,
        showMiniProgress: false,
        hasAnyWizardFeatures: true,
      });
    });

    it('should set hasAnyWizardFeatures to false when no features are enabled', () => {
      mockAdminState.urls[0].features[FEATURE_FLAGS.WIZARD_BUTTON] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.WIZARD_STATUS_INDICATOR] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.PROGRESS_TRACKER] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.MINI_PROGRESS_INDICATOR] = false;
      
      const { result } = renderHook(() => useWizardFeatures());
      expect(result.current.hasAnyWizardFeatures).toBe(false);
    });

    it('should handle different path configurations', () => {
      mockPathname.mockReturnValue('/another-path');
      const { result } = renderHook(() => useWizardFeatures());

      expect(result.current.showWizardButton).toBe(false);
      expect(result.current.hasAnyWizardFeatures).toBe(false);
    });
  });

  describe('useFormFeatures', () => {
    it('should return form specific features', () => {
      const { result } = renderHook(() => useFormFeatures());

      expect(result.current).toEqual({
        showTooltips: true,
        showValidation: true,
        showSignatureModal: false,
        hasAnyFormFeatures: true,
      });
    });

    it('should set hasAnyFormFeatures to true when signature modal is enabled', () => {
      mockPathname.mockReturnValue('/another-path');
      const { result } = renderHook(() => useFormFeatures());

      expect(result.current.showSignatureModal).toBe(true);
      expect(result.current.showValidation).toBe(false);
      expect(result.current.hasAnyFormFeatures).toBe(true);
    });

    it('should set hasAnyFormFeatures to false when no features are enabled', () => {
      mockAdminState.urls[0].features[FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.FORM_VALIDATION_DISPLAY] = false;
      mockAdminState.urls[0].features[FEATURE_FLAGS.SIGNATURE_MODAL] = false;
      
      const { result } = renderHook(() => useFormFeatures());
      expect(result.current.hasAnyFormFeatures).toBe(false);
    });
  });

  describe('useFeatureFlagDebug', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return debug information', () => {
      const { result } = renderHook(() => useFeatureFlagDebug('TestComponent'));

      expect(result.current).toEqual({
        component: 'TestComponent',
        path: '/test',
        configFound: true,
        enabledCount: expect.any(Number),
        disabledCount: expect.any(Number),
        enabled: expect.any(Array),
        disabled: expect.any(Array),
      });

      expect(result.current.enabledCount).toBeGreaterThan(0);
      expect(result.current.enabled.length).toBe(result.current.enabledCount);
    });

    it('should log debug info in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      renderHook(() => useFeatureFlagDebug('TestComponent'));

      expect(mockConsoleGroup).toHaveBeenCalledWith('🎌 Feature Flags Debug - TestComponent');
      expect(mockConsoleTable).toHaveBeenCalled();
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      renderHook(() => useFeatureFlagDebug('TestComponent'));

      expect(mockConsoleGroup).not.toHaveBeenCalled();
      expect(mockConsoleTable).not.toHaveBeenCalled();
      expect(mockConsoleGroupEnd).not.toHaveBeenCalled();
    });

    it('should handle different component names', () => {
      process.env.NODE_ENV = 'development';
      
      renderHook(() => useFeatureFlagDebug('PDFViewer'));

      expect(mockConsoleGroup).toHaveBeenCalledWith('🎌 Feature Flags Debug - PDFViewer');
    });
  });

  describe('Hook integration', () => {
    it('should work together in component usage patterns', () => {
      const { result: pdfFeatures } = renderHook(() => usePDFViewerFeatures());
      const { result: wizardFeatures } = renderHook(() => useWizardFeatures());
      const { result: componentFeatures } = renderHook(() => useComponentFeatures());
      
      // These should be consistent
      expect(pdfFeatures.current.showFieldsToggle).toBe(componentFeatures.current.hasFieldsToggle);
      expect(wizardFeatures.current.showWizardButton).toBe(componentFeatures.current.hasWizardButton);
    });

    it('should handle complex feature combinations', () => {
      const { result: componentFeatures } = renderHook(() => useComponentFeatures());
      const { result: pdfFeatures } = renderHook(() => usePDFViewerFeatures());
      
      // PDF fit controls should be true if either width OR height button is enabled
      const expectedPDFFitControls = pdfFeatures.current.showFitWidthButton || pdfFeatures.current.showFitHeightButton;
      expect(componentFeatures.current.hasPDFFitControls).toBe(expectedPDFFitControls);
    });

    it('should maintain consistency across different hook calls', () => {
      const { result: flagResult } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      const { result: flagByKeyResult } = renderHook(() => useFeatureFlagByKey('FIELDS_TOGGLE_BUTTON'));
      const { result: flagsResult } = renderHook(() => useFeatureFlags([FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]));
      
      expect(flagResult.current).toBe(flagByKeyResult.current);
      expect(flagResult.current).toBe(flagsResult.current[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON]);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty state gracefully', () => {
      mockAdminState.urls = [];
      mockAdminState.features = [];
      
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(false);
    });

    it('should handle malformed URL configs gracefully', () => {
      mockAdminState.urls = [{
        id: 1,
        path: '/test',
        pdfPath: 'test.pdf',
        createdAt: '2024-01-01T00:00:00Z',
        features: null as any, // Malformed features
        pdfFields: {}
      }];
      
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(false);
    });

    it('should handle undefined feature flags gracefully', () => {
      const { result } = renderHook(() => useFeatureFlag(999 as any)); // Non-existent feature ID
      expect(result.current).toBe(false);
    });

    it('should handle missing feature configuration', () => {
      mockAdminState.urls[0].features = {};
      
      const { result } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      expect(result.current).toBe(false);
    });
  });

  describe('Performance and memoization', () => {
    it('should memoize results properly', () => {
      const { result, rerender } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      
      const firstResult = result.current;
      rerender();
      const secondResult = result.current;
      
      expect(firstResult).toBe(secondResult);
    });

    it('should only recalculate when dependencies change', () => {
      const { result, rerender } = renderHook(() => useEnabledFeatures());
      
      const firstResult = result.current;
      rerender(); // Rerender without changing dependencies
      const secondResult = result.current;
      
      expect(firstResult).toBe(secondResult); // Should be same reference due to memoization
    });

    it('should recalculate when path changes', () => {
      const { result, rerender } = renderHook(() => useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON));
      
      expect(result.current).toBe(true);
      
      mockPathname.mockReturnValue('/another-path');
      rerender();
      
      expect(result.current).toBe(false);
    });
  });
});