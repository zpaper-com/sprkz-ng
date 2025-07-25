/**
 * React Hooks for Feature Flag Management
 * 
 * This module provides React hooks for easy access to feature flags
 * in components throughout the application.
 */

import { useMemo } from 'react';
import { useAdmin } from '../admin/contexts/AdminContext';
import {
  isCurrentFeatureEnabled,
  isFeatureEnabled,
  getCurrentURLConfig,
  getURLConfig,
  getEnabledFeatures,
  getFeatureConfigSummary,
  FEATURE_FLAGS,
  type FeatureFlagId,
  type FeatureFlagKey,
} from '../admin/utils/featureFlags';

/**
 * Hook to check if a specific feature is enabled for the current route
 */
export function useFeatureFlag(featureId: FeatureFlagId): boolean {
  const { state } = useAdmin();
  
  return useMemo(() => {
    return isCurrentFeatureEnabled(state.urls, featureId);
  }, [state.urls, featureId]);
}

/**
 * Hook to check if a feature is enabled by feature key name
 */
export function useFeatureFlagByKey(featureKey: FeatureFlagKey): boolean {
  const featureId = FEATURE_FLAGS[featureKey];
  return useFeatureFlag(featureId);
}

/**
 * Hook to check if a specific feature is enabled for a given path
 */
export function useFeatureFlagForPath(
  path: string,
  featureId: FeatureFlagId
): boolean {
  const { state } = useAdmin();
  
  return useMemo(() => {
    return isFeatureEnabled(state.urls, path, featureId);
  }, [state.urls, path, featureId]);
}

/**
 * Hook to get all enabled features for the current route
 */
export function useEnabledFeatures(): FeatureFlagId[] {
  const { state } = useAdmin();
  
  return useMemo(() => {
    const currentPath = window.location.pathname;
    return getEnabledFeatures(state.urls, currentPath);
  }, [state.urls]);
}

/**
 * Hook to get the current URL configuration
 */
export function useCurrentURLConfig() {
  const { state } = useAdmin();
  
  return useMemo(() => {
    return getCurrentURLConfig(state.urls);
  }, [state.urls]);
}

/**
 * Hook to get URL configuration for a specific path
 */
export function useURLConfig(path: string) {
  const { state } = useAdmin();
  
  return useMemo(() => {
    return getURLConfig(state.urls, path);
  }, [state.urls, path]);
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(
  featureIds: FeatureFlagId[]
): Record<FeatureFlagId, boolean> {
  const { state } = useAdmin();
  
  return useMemo(() => {
    const currentPath = window.location.pathname;
    const result: Record<FeatureFlagId, boolean> = {};
    
    featureIds.forEach(id => {
      result[id] = isFeatureEnabled(state.urls, currentPath, id);
    });
    
    return result;
  }, [state.urls, featureIds]);
}

/**
 * Hook to get feature configuration summary for debugging
 */
export function useFeatureConfigSummary(path?: string) {
  const { state } = useAdmin();
  
  return useMemo(() => {
    const targetPath = path || window.location.pathname;
    return getFeatureConfigSummary(state.urls, state.features, targetPath);
  }, [state.urls, state.features, path]);
}

/**
 * Hook for component-specific feature flag patterns
 */
export function useComponentFeatures() {
  const { state } = useAdmin();
  
  return useMemo(() => {
    const currentPath = window.location.pathname;
    const urlConfig = getURLConfig(state.urls, currentPath);
    
    if (!urlConfig) {
      return {
        hasFieldsToggle: false,
        hasPDFFitControls: false,
        hasWizardButton: false,
        hasThumbnailNavigation: false,
        hasProgressIndicators: false,
        hasTooltipSystem: false,
        hasValidationDisplay: false,
        hasSignatureModal: false,
      };
    }
    
    return {
      hasFieldsToggle: urlConfig.features[FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON] === true,
      hasPDFFitControls: 
        urlConfig.features[FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON] === true ||
        urlConfig.features[FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON] === true,
      hasWizardButton: urlConfig.features[FEATURE_FLAGS.WIZARD_BUTTON] === true,
      hasThumbnailNavigation: urlConfig.features[FEATURE_FLAGS.THUMBNAIL_NAVIGATION] === true,
      hasProgressIndicators:
        urlConfig.features[FEATURE_FLAGS.MINI_PROGRESS_INDICATOR] === true ||
        urlConfig.features[FEATURE_FLAGS.PROGRESS_TRACKER] === true ||
        urlConfig.features[FEATURE_FLAGS.WIZARD_STATUS_INDICATOR] === true,
      hasTooltipSystem: urlConfig.features[FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM] === true,
      hasValidationDisplay: urlConfig.features[FEATURE_FLAGS.FORM_VALIDATION_DISPLAY] === true,
      hasSignatureModal: urlConfig.features[FEATURE_FLAGS.SIGNATURE_MODAL] === true,
    };
  }, [state.urls]);
}

/**
 * Hook specifically for PDF viewer controls
 */
export function usePDFViewerFeatures() {
  const fieldsToggle = useFeatureFlag(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON);
  const fitWidth = useFeatureFlag(FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON);
  const fitHeight = useFeatureFlag(FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON);
  const titleDisplay = useFeatureFlag(FEATURE_FLAGS.PDF_TITLE_DISPLAY);
  const filenameDisplay = useFeatureFlag(FEATURE_FLAGS.PDF_FILENAME_DISPLAY);
  const thumbnailNavigation = useFeatureFlag(FEATURE_FLAGS.THUMBNAIL_NAVIGATION);
  
  return {
    showFieldsToggle: fieldsToggle,
    showFitWidthButton: fitWidth,
    showFitHeightButton: fitHeight,
    showTitleDisplay: titleDisplay,
    showFilenameDisplay: filenameDisplay,
    showThumbnailNavigation: thumbnailNavigation,
    hasAnyControls: fieldsToggle || fitWidth || fitHeight,
  };
}

/**
 * Hook specifically for wizard-related features
 */
export function useWizardFeatures() {
  const wizardButton = useFeatureFlag(FEATURE_FLAGS.WIZARD_BUTTON);
  const statusIndicator = useFeatureFlag(FEATURE_FLAGS.WIZARD_STATUS_INDICATOR);
  const progressTracker = useFeatureFlag(FEATURE_FLAGS.PROGRESS_TRACKER);
  const miniProgress = useFeatureFlag(FEATURE_FLAGS.MINI_PROGRESS_INDICATOR);
  
  return {
    showWizardButton: wizardButton,
    showStatusIndicator: statusIndicator,
    showProgressTracker: progressTracker,
    showMiniProgress: miniProgress,
    hasAnyWizardFeatures: wizardButton || statusIndicator || progressTracker || miniProgress,
  };
}

/**
 * Hook specifically for form interaction features
 */
export function useFormFeatures() {
  const tooltipSystem = useFeatureFlag(FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM);
  const validationDisplay = useFeatureFlag(FEATURE_FLAGS.FORM_VALIDATION_DISPLAY);
  const signatureModal = useFeatureFlag(FEATURE_FLAGS.SIGNATURE_MODAL);
  
  return {
    showTooltips: tooltipSystem,
    showValidation: validationDisplay,
    showSignatureModal: signatureModal,
    hasAnyFormFeatures: tooltipSystem || validationDisplay || signatureModal,
  };
}

/**
 * Hook specifically for markup tools features
 */
export function useMarkupFeatures() {
  const toolbar = useFeatureFlag(FEATURE_FLAGS.MARKUP_TOOLBAR);
  const imageStamp = useFeatureFlag(FEATURE_FLAGS.MARKUP_IMAGE_STAMP);
  const highlightArea = useFeatureFlag(FEATURE_FLAGS.MARKUP_HIGHLIGHT_AREA);
  const signature = useFeatureFlag(FEATURE_FLAGS.MARKUP_SIGNATURE);
  const dateTimeStamp = useFeatureFlag(FEATURE_FLAGS.MARKUP_DATE_TIME_STAMP);
  const textArea = useFeatureFlag(FEATURE_FLAGS.MARKUP_TEXT_AREA);
  const imageAttachment = useFeatureFlag(FEATURE_FLAGS.MARKUP_IMAGE_ATTACHMENT);
  
  return {
    showMarkupToolbar: toolbar,
    showImageStamp: imageStamp,
    showHighlightArea: highlightArea,
    showMarkupSignature: signature,
    showDateTimeStamp: dateTimeStamp,
    showTextArea: textArea,
    showImageAttachment: imageAttachment,
    hasAnyMarkupFeatures: toolbar || imageStamp || highlightArea || signature || dateTimeStamp || textArea || imageAttachment,
  };
}

/**
 * Debug hook to log current feature state
 */
export function useFeatureFlagDebug(componentName: string) {
  const { state } = useAdmin();
  const currentPath = window.location.pathname;
  
  return useMemo(() => {
    const summary = getFeatureConfigSummary(state.urls, state.features, currentPath);
    
    const debugInfo = {
      component: componentName,
      path: currentPath,
      configFound: summary.configFound,
      enabledCount: summary.enabledFeatures.length,
      disabledCount: summary.disabledFeatures.length,
      enabled: summary.enabledFeatures.map(f => `${f.id}: ${f.name}`),
      disabled: summary.disabledFeatures.map(f => `${f.id}: ${f.name}`),
    };
    
    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎌 Feature Flags Debug - ${componentName}`);
      console.table(debugInfo);
      console.groupEnd();
    }
    
    return debugInfo;
  }, [state.urls, state.features, currentPath, componentName]);
}