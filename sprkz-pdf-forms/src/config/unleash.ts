import { Unleash } from 'unleash-client';

interface UnleashConfig {
  url: string;
  clientKey: string;
  appName: string;
  environment: string;
  refreshInterval: number;
}

const unleashConfig: UnleashConfig = {
  url: process.env.REACT_APP_UNLEASH_URL || 'https://flags.zpaper.com/',
  clientKey: process.env.REACT_APP_UNLEASH_CLIENT_KEY || '',
  appName: 'sprkz-pdf-forms',
  environment: process.env.NODE_ENV || 'development',
  refreshInterval: 30000 // 30 seconds
};

// Initialize Unleash client
export const unleash = new Unleash(unleashConfig);

// Feature flag constants
export const FEATURE_FLAGS = {
  // Signature Features
  TYPED_SIGNATURE_FONTS: 'typed-signature-fonts',
  SIGNATURE_COLOR_OPTIONS: 'signature-color-options',
  ADVANCED_SIGNATURE_TOOLS: 'advanced-signature-tools',
  
  // Wizard Features  
  SMART_FIELD_NAVIGATION: 'smart-field-navigation',
  AUTO_VALIDATION: 'auto-validation',
  PROGRESS_ANALYTICS: 'progress-analytics',
  
  // PDF Processing
  ENHANCED_FIELD_DETECTION: 'enhanced-field-detection',
  BATCH_PDF_PROCESSING: 'batch-pdf-processing',
  FIELD_PREFILLING: 'field-prefilling',
  
  // UI/UX Experiments
  DARK_THEME: 'dark-theme',
  COMPACT_LAYOUT: 'compact-layout',
  ANIMATED_TRANSITIONS: 'animated-transitions',
  
  // Performance
  LAZY_PAGE_LOADING: 'lazy-page-loading',
  AGGRESSIVE_CACHING: 'aggressive-caching',
  PRELOAD_ADJACENT_PAGES: 'preload-adjacent-pages'
} as const;

export default unleash;