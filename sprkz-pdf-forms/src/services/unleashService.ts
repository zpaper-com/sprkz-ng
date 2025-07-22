import { UnleashClient } from '@unleash/proxy-client-react';

// Unleash configuration
export interface UnleashConfig {
  url: string;
  clientKey: string;
  refreshInterval?: number;
  appName?: string;
  environment?: string;
  userId?: string;
  sessionId?: string;
}

// Default configuration
const DEFAULT_CONFIG: UnleashConfig = {
  url: process.env.REACT_APP_UNLEASH_PROXY_URL || 'http://localhost:3002/proxy',
  clientKey: process.env.REACT_APP_UNLEASH_CLIENT_KEY || 'default:development.unleash-insecure-frontend-api-token',
  refreshInterval: 15, // seconds
  appName: 'sprkz-pdf-forms',
  environment: process.env.NODE_ENV || 'development'
};

// Feature flag definitions with types
export interface FeatureFlags {
  // Core application features
  ENHANCED_WIZARD_MODE: boolean;
  PROGRESSIVE_FORM_FILLING: boolean;
  SMART_FIELD_DETECTION: boolean;
  
  // Signature features
  SIGNATURE_DRAWING_MODE: boolean;
  SIGNATURE_TYPED_MODE: boolean;
  SIGNATURE_UPLOAD_MODE: boolean;
  MULTI_SIGNATURE_SUPPORT: boolean;
  
  // PDF processing features
  ADVANCED_PDF_VALIDATION: boolean;
  PDF_FIELD_AUTOCOMPLETE: boolean;
  PDF_PREVIEW_MODE: boolean;
  BULK_PDF_PROCESSING: boolean;
  
  // UI/UX features
  DARK_MODE_SUPPORT: boolean;
  ACCESSIBILITY_ENHANCEMENTS: boolean;
  MOBILE_OPTIMIZATIONS: boolean;
  ANIMATION_EFFECTS: boolean;
  
  // Performance features
  PDF_LAZY_LOADING: boolean;
  FORM_STATE_PERSISTENCE: boolean;
  OFFLINE_MODE_SUPPORT: boolean;
  
  // Validation and security
  ENHANCED_FIELD_VALIDATION: boolean;
  SECURITY_AUDIT_LOGGING: boolean;
  DATA_ENCRYPTION: boolean;
  
  // Analytics and monitoring
  USAGE_ANALYTICS: boolean;
  ERROR_REPORTING: boolean;
  PERFORMANCE_MONITORING: boolean;
}

// Default feature flag values (fallbacks when Unleash is unavailable)
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core features - enabled by default for MVP
  ENHANCED_WIZARD_MODE: true,
  PROGRESSIVE_FORM_FILLING: true,
  SMART_FIELD_DETECTION: true,
  
  // Signature features - all enabled
  SIGNATURE_DRAWING_MODE: true,
  SIGNATURE_TYPED_MODE: true,
  SIGNATURE_UPLOAD_MODE: false, // Not yet implemented
  MULTI_SIGNATURE_SUPPORT: true,
  
  // PDF processing - basic features enabled
  ADVANCED_PDF_VALIDATION: true,
  PDF_FIELD_AUTOCOMPLETE: false, // Future feature
  PDF_PREVIEW_MODE: true,
  BULK_PDF_PROCESSING: false, // Future feature
  
  // UI/UX features
  DARK_MODE_SUPPORT: false, // Future feature
  ACCESSIBILITY_ENHANCEMENTS: true,
  MOBILE_OPTIMIZATIONS: true,
  ANIMATION_EFFECTS: true,
  
  // Performance features
  PDF_LAZY_LOADING: true,
  FORM_STATE_PERSISTENCE: true,
  OFFLINE_MODE_SUPPORT: false, // Future feature
  
  // Validation and security
  ENHANCED_FIELD_VALIDATION: true,
  SECURITY_AUDIT_LOGGING: false, // Production only
  DATA_ENCRYPTION: false, // Future feature
  
  // Analytics and monitoring
  USAGE_ANALYTICS: process.env.NODE_ENV === 'production',
  ERROR_REPORTING: true, // Sentry integration
  PERFORMANCE_MONITORING: true
};

// Feature flag categories for organization
export const FEATURE_CATEGORIES = {
  CORE: ['ENHANCED_WIZARD_MODE', 'PROGRESSIVE_FORM_FILLING', 'SMART_FIELD_DETECTION'],
  SIGNATURE: ['SIGNATURE_DRAWING_MODE', 'SIGNATURE_TYPED_MODE', 'SIGNATURE_UPLOAD_MODE', 'MULTI_SIGNATURE_SUPPORT'],
  PDF: ['ADVANCED_PDF_VALIDATION', 'PDF_FIELD_AUTOCOMPLETE', 'PDF_PREVIEW_MODE', 'BULK_PDF_PROCESSING'],
  UI_UX: ['DARK_MODE_SUPPORT', 'ACCESSIBILITY_ENHANCEMENTS', 'MOBILE_OPTIMIZATIONS', 'ANIMATION_EFFECTS'],
  PERFORMANCE: ['PDF_LAZY_LOADING', 'FORM_STATE_PERSISTENCE', 'OFFLINE_MODE_SUPPORT'],
  SECURITY: ['ENHANCED_FIELD_VALIDATION', 'SECURITY_AUDIT_LOGGING', 'DATA_ENCRYPTION'],
  MONITORING: ['USAGE_ANALYTICS', 'ERROR_REPORTING', 'PERFORMANCE_MONITORING']
};

// Unleash service class
export class UnleashService {
  private static instance: UnleashService;
  private client: UnleashClient | null = null;
  private config: UnleashConfig;
  private isInitialized = false;
  private listeners: Set<() => void> = new Set();

  private constructor(config?: Partial<UnleashConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<UnleashConfig>): UnleashService {
    if (!UnleashService.instance) {
      UnleashService.instance = new UnleashService(config);
    }
    return UnleashService.instance;
  }

  // Initialize the Unleash client
  async initialize(context?: Record<string, string>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create Unleash client
      this.client = new UnleashClient({
        url: this.config.url,
        clientKey: this.config.clientKey,
        refreshInterval: this.config.refreshInterval,
        appName: this.config.appName,
        environment: this.config.environment,
        context: {
          userId: this.config.userId || this.generateUserId(),
          sessionId: this.config.sessionId || this.generateSessionId(),
          ...context
        }
      });

      // Start the client
      this.client.start();

      // Wait for initial fetch
      await this.client.on('ready', () => {
        console.log('Unleash client initialized successfully');
        this.isInitialized = true;
        this.notifyListeners();
      });

      // Handle errors
      this.client.on('error', (error) => {
        console.error('Unleash client error:', error);
        // Continue with default flags on error
        this.isInitialized = true;
      });

      // Handle updates
      this.client.on('update', () => {
        console.log('Feature flags updated');
        this.notifyListeners();
      });

    } catch (error) {
      console.error('Failed to initialize Unleash:', error);
      // Continue with default flags
      this.isInitialized = true;
    }
  }

  // Check if a feature flag is enabled
  isEnabled(flagName: keyof FeatureFlags, context?: Record<string, string>): boolean {
    if (!this.client || !this.isInitialized) {
      return DEFAULT_FEATURE_FLAGS[flagName];
    }

    try {
      return this.client.isEnabled(flagName, context);
    } catch (error) {
      console.warn(`Failed to check feature flag ${flagName}:`, error);
      return DEFAULT_FEATURE_FLAGS[flagName];
    }
  }

  // Get variant for a feature flag
  getVariant(flagName: keyof FeatureFlags, context?: Record<string, string>): any {
    if (!this.client || !this.isInitialized) {
      return null;
    }

    try {
      return this.client.getVariant(flagName, context);
    } catch (error) {
      console.warn(`Failed to get variant for ${flagName}:`, error);
      return null;
    }
  }

  // Get all feature flags as an object
  getAllFlags(context?: Record<string, string>): FeatureFlags {
    const flags = {} as FeatureFlags;
    
    for (const flagName of Object.keys(DEFAULT_FEATURE_FLAGS) as Array<keyof FeatureFlags>) {
      flags[flagName] = this.isEnabled(flagName, context);
    }

    return flags;
  }

  // Subscribe to flag changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Update context (useful for user-specific flags)
  updateContext(context: Record<string, string>): void {
    if (this.client) {
      this.client.updateContext(context);
    }
  }

  // Get feature flags by category
  getFlagsByCategory(category: keyof typeof FEATURE_CATEGORIES, context?: Record<string, string>): Partial<FeatureFlags> {
    const categoryFlags = FEATURE_CATEGORIES[category];
    const flags = {} as Partial<FeatureFlags>;

    for (const flagName of categoryFlags as Array<keyof FeatureFlags>) {
      flags[flagName] = this.isEnabled(flagName, context);
    }

    return flags;
  }

  // Utility methods for debugging
  getStatus(): { initialized: boolean; clientReady: boolean; flagCount: number } {
    return {
      initialized: this.isInitialized,
      clientReady: !!this.client,
      flagCount: Object.keys(DEFAULT_FEATURE_FLAGS).length
    };
  }

  // Generate unique user ID for session
  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in feature flag listener:', error);
      }
    });
  }

  // Clean up resources
  destroy(): void {
    if (this.client) {
      this.client.stop();
      this.client = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const unleashService = UnleashService.getInstance();

// Utility function to check individual flags (for convenience)
export const isFeatureEnabled = (flagName: keyof FeatureFlags, context?: Record<string, string>): boolean => {
  return unleashService.isEnabled(flagName, context);
};

// Utility function to get feature variant
export const getFeatureVariant = (flagName: keyof FeatureFlags, context?: Record<string, string>): any => {
  return unleashService.getVariant(flagName, context);
};

export default UnleashService;