import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { unleashService, FeatureFlags, DEFAULT_FEATURE_FLAGS, FEATURE_CATEGORIES } from '../services/unleashService';

// Enhanced context interface with full feature flag support
interface FeatureFlagsContextType {
  // Basic flag checking
  isFeatureEnabled: (flagName: keyof FeatureFlags, context?: Record<string, string>) => boolean;
  getFeatureVariant: (flagName: keyof FeatureFlags, context?: Record<string, string>) => any;
  
  // Bulk operations
  getAllFlags: (context?: Record<string, string>) => FeatureFlags;
  getFlagsByCategory: (category: keyof typeof FEATURE_CATEGORIES, context?: Record<string, string>) => Partial<FeatureFlags>;
  
  // Context management
  updateContext: (context: Record<string, string>) => void;
  
  // Status and debugging
  isReady: boolean;
  isInitialized: boolean;
  status: { initialized: boolean; clientReady: boolean; flagCount: number };
  
  // Refresh functionality
  refresh: () => void;
}

// Default context value
const defaultContext: FeatureFlagsContextType = {
  isFeatureEnabled: () => false,
  getFeatureVariant: () => null,
  getAllFlags: () => DEFAULT_FEATURE_FLAGS,
  getFlagsByCategory: () => ({}),
  updateContext: () => {},
  isReady: false,
  isInitialized: false,
  status: { initialized: false, clientReady: false, flagCount: 0 },
  refresh: () => {}
};

export const FeatureFlagsContext = createContext<FeatureFlagsContextType>(defaultContext);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
  config?: {
    url?: string;
    clientKey?: string;
    refreshInterval?: number;
    context?: Record<string, string>;
    userId?: string;
    environment?: string;
  };
  fallbackFlags?: Partial<FeatureFlags>;
  enableLogging?: boolean;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ 
  children, 
  config = {},
  fallbackFlags = {},
  enableLogging = process.env.NODE_ENV === 'development'
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FEATURE_FLAGS, ...fallbackFlags });
  const [status, setStatus] = useState({ initialized: false, clientReady: false, flagCount: 0 });
  const [currentContext, setCurrentContext] = useState<Record<string, string>>(config.context || {});
  const initializationRef = useRef(false);

  // Initialize Unleash service
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeUnleash = async () => {
      try {
        if (enableLogging) {
          console.log('Initializing Unleash service with config:', config);
        }

        // Initialize with configuration
        await unleashService.initialize({
          userId: config.userId,
          environment: config.environment,
          ...config.context
        });

        // Update initial state
        setIsInitialized(true);
        setIsReady(true);
        setFlags(unleashService.getAllFlags(currentContext));
        setStatus(unleashService.getStatus());

        if (enableLogging) {
          console.log('Unleash service initialized successfully');
          console.log('Initial flags:', unleashService.getAllFlags(currentContext));
        }

      } catch (error) {
        console.error('Failed to initialize Unleash service:', error);
        // Continue with fallback flags
        setIsInitialized(false);
        setIsReady(true); // Still ready, just using defaults
        setFlags({ ...DEFAULT_FEATURE_FLAGS, ...fallbackFlags });
      }
    };

    initializeUnleash();
  }, []); // Run once on mount

  // Subscribe to flag updates
  useEffect(() => {
    const unsubscribe = unleashService.subscribe(() => {
      if (enableLogging) {
        console.log('Feature flags updated');
      }
      
      setFlags(unleashService.getAllFlags(currentContext));
      setStatus(unleashService.getStatus());
    });

    return unsubscribe;
  }, [currentContext, enableLogging]);

  // Memoized flag checking function
  const isFeatureEnabled = useCallback((
    flagName: keyof FeatureFlags, 
    context?: Record<string, string>
  ): boolean => {
    const mergedContext = { ...currentContext, ...context };
    
    if (!isInitialized) {
      const fallbackValue = fallbackFlags[flagName] ?? DEFAULT_FEATURE_FLAGS[flagName];
      if (enableLogging) {
        console.log(`Feature flag ${flagName} checked (fallback): ${fallbackValue}`);
      }
      return fallbackValue;
    }

    const isEnabled = unleashService.isEnabled(flagName, mergedContext);
    
    if (enableLogging) {
      console.log(`Feature flag ${flagName} checked: ${isEnabled}`);
    }
    
    return isEnabled;
  }, [isInitialized, currentContext, fallbackFlags, enableLogging]);

  // Memoized variant getting function
  const getFeatureVariant = useCallback((
    flagName: keyof FeatureFlags, 
    context?: Record<string, string>
  ): any => {
    const mergedContext = { ...currentContext, ...context };
    
    if (!isInitialized) {
      if (enableLogging) {
        console.log(`Feature variant ${flagName} requested (fallback): null`);
      }
      return null;
    }

    const variant = unleashService.getVariant(flagName, mergedContext);
    
    if (enableLogging) {
      console.log(`Feature variant ${flagName} requested:`, variant);
    }
    
    return variant;
  }, [isInitialized, currentContext, enableLogging]);

  // Get all flags
  const getAllFlags = useCallback((context?: Record<string, string>): FeatureFlags => {
    const mergedContext = { ...currentContext, ...context };
    
    if (!isInitialized) {
      return { ...DEFAULT_FEATURE_FLAGS, ...fallbackFlags };
    }

    return unleashService.getAllFlags(mergedContext);
  }, [isInitialized, currentContext, fallbackFlags]);

  // Get flags by category
  const getFlagsByCategory = useCallback((
    category: keyof typeof FEATURE_CATEGORIES, 
    context?: Record<string, string>
  ): Partial<FeatureFlags> => {
    const mergedContext = { ...currentContext, ...context };
    
    if (!isInitialized) {
      const categoryFlags = FEATURE_CATEGORIES[category];
      const result = {} as Partial<FeatureFlags>;
      
      categoryFlags.forEach(flagName => {
        const key = flagName as keyof FeatureFlags;
        result[key] = fallbackFlags[key] ?? DEFAULT_FEATURE_FLAGS[key];
      });
      
      return result;
    }

    return unleashService.getFlagsByCategory(category, mergedContext);
  }, [isInitialized, currentContext, fallbackFlags]);

  // Update context
  const updateContext = useCallback((newContext: Record<string, string>) => {
    setCurrentContext(prev => ({ ...prev, ...newContext }));
    
    if (isInitialized) {
      unleashService.updateContext(newContext);
    }
    
    if (enableLogging) {
      console.log('Feature flags context updated:', newContext);
    }
  }, [isInitialized, enableLogging]);

  // Refresh flags manually
  const refresh = useCallback(() => {
    if (isInitialized) {
      setFlags(unleashService.getAllFlags(currentContext));
      setStatus(unleashService.getStatus());
    }
    
    if (enableLogging) {
      console.log('Feature flags refreshed manually');
    }
  }, [isInitialized, currentContext, enableLogging]);

  // Context value
  const contextValue: FeatureFlagsContextType = {
    isFeatureEnabled,
    getFeatureVariant,
    getAllFlags,
    getFlagsByCategory,
    updateContext,
    isReady,
    isInitialized,
    status,
    refresh
  };

  // Log provider status changes
  useEffect(() => {
    if (enableLogging) {
      console.log('FeatureFlagsProvider status:', {
        isReady,
        isInitialized,
        flagCount: Object.keys(flags).length,
        status
      });
    }
  }, [isReady, isInitialized, flags, status, enableLogging]);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// Enhanced hook with better error handling
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  
  return context;
};

// Convenience hooks for common patterns
export const useFeatureFlag = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  const { isFeatureEnabled, getFeatureVariant } = useFeatureFlags();
  
  return {
    isEnabled: isFeatureEnabled(flagName, context),
    variant: getFeatureVariant(flagName, context)
  };
};

export const useFeatureFlagWithFallback = (
  flagName: keyof FeatureFlags, 
  fallback: boolean = false,
  context?: Record<string, string>
) => {
  const { isFeatureEnabled, isReady } = useFeatureFlags();
  
  if (!isReady) {
    return fallback;
  }
  
  return isFeatureEnabled(flagName, context);
};

// Clean up on unmount
export const FeatureFlagsCleanup: React.FC = () => {
  useEffect(() => {
    return () => {
      unleashService.destroy();
    };
  }, []);
  
  return null;
};