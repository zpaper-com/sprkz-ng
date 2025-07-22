import { useState, useEffect, useCallback, useContext } from 'react';
import { unleashService, FeatureFlags, isFeatureEnabled, getFeatureVariant } from '../services/unleashService';
import { FeatureFlagsContext } from '../contexts/FeatureFlagsContext';

// Hook for accessing feature flags
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  
  return context;
};

// Hook for checking a single feature flag
export const useFeatureFlag = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => 
    unleashService.isEnabled(flagName, context)
  );
  const [variant, setVariant] = useState<any>(() => 
    unleashService.getVariant(flagName, context)
  );

  useEffect(() => {
    // Update when flags change
    const updateFlag = () => {
      setIsEnabled(unleashService.isEnabled(flagName, context));
      setVariant(unleashService.getVariant(flagName, context));
    };

    // Subscribe to changes
    const unsubscribe = unleashService.subscribe(updateFlag);

    // Initial update
    updateFlag();

    return unsubscribe;
  }, [flagName, context]);

  return { isEnabled, variant };
};

// Hook for checking multiple feature flags
export const useFeatureFlags_Multiple = (flagNames: Array<keyof FeatureFlags>, context?: Record<string, string>) => {
  const [flags, setFlags] = useState<Partial<FeatureFlags>>(() => {
    const initialFlags = {} as Partial<FeatureFlags>;
    flagNames.forEach(flagName => {
      initialFlags[flagName] = unleashService.isEnabled(flagName, context);
    });
    return initialFlags;
  });

  useEffect(() => {
    const updateFlags = () => {
      const updatedFlags = {} as Partial<FeatureFlags>;
      flagNames.forEach(flagName => {
        updatedFlags[flagName] = unleashService.isEnabled(flagName, context);
      });
      setFlags(updatedFlags);
    };

    // Subscribe to changes
    const unsubscribe = unleashService.subscribe(updateFlags);

    // Initial update
    updateFlags();

    return unsubscribe;
  }, [flagNames, context]);

  return flags;
};

// Hook for conditional feature rendering
export const useConditionalFeature = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  const { isEnabled } = useFeatureFlag(flagName, context);

  const ConditionalComponent = useCallback(({ children, fallback = null }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => {
    if (isEnabled) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement(React.Fragment, null, fallback);
  }, [isEnabled]);

  return { isEnabled, ConditionalComponent };
};

// Hook for feature flag variants with type safety
export const useFeatureVariant = <T = any>(
  flagName: keyof FeatureFlags, 
  defaultValue: T, 
  context?: Record<string, string>
) => {
  const [variant, setVariant] = useState<T>(() => {
    const flagVariant = unleashService.getVariant(flagName, context);
    return flagVariant?.payload?.value ?? defaultValue;
  });

  useEffect(() => {
    const updateVariant = () => {
      const flagVariant = unleashService.getVariant(flagName, context);
      setVariant(flagVariant?.payload?.value ?? defaultValue);
    };

    const unsubscribe = unleashService.subscribe(updateVariant);
    updateVariant();

    return unsubscribe;
  }, [flagName, defaultValue, context]);

  return variant;
};

// Hook for feature flag experimentation
export const useExperiment = (
  experimentName: keyof FeatureFlags,
  variants: Record<string, any>,
  context?: Record<string, string>
) => {
  const [activeVariant, setActiveVariant] = useState<any>(() => {
    const variant = unleashService.getVariant(experimentName, context);
    return variants[variant?.name] || variants.default || null;
  });

  useEffect(() => {
    const updateExperiment = () => {
      const variant = unleashService.getVariant(experimentName, context);
      setActiveVariant(variants[variant?.name] || variants.default || null);
    };

    const unsubscribe = unleashService.subscribe(updateExperiment);
    updateExperiment();

    return unsubscribe;
  }, [experimentName, variants, context]);

  return activeVariant;
};

// Hook for gradual rollouts
export const useGradualRollout = (
  flagName: keyof FeatureFlags,
  userId?: string,
  context?: Record<string, string>
) => {
  const rolloutContext = userId ? { ...context, userId } : context;
  const { isEnabled } = useFeatureFlag(flagName, rolloutContext);
  
  return isEnabled;
};

// Hook for A/B testing
export const useABTest = (
  experimentFlag: keyof FeatureFlags,
  variants: { A: any; B: any },
  context?: Record<string, string>
) => {
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');
  const [variantData, setVariantData] = useState<any>(variants.A);

  useEffect(() => {
    const updateTest = () => {
      const variant = unleashService.getVariant(experimentFlag, context);
      const variantName = variant?.name as 'A' | 'B';
      
      if (variantName && variants[variantName]) {
        setActiveVariant(variantName);
        setVariantData(variants[variantName]);
      } else {
        // Default to A if variant not found
        setActiveVariant('A');
        setVariantData(variants.A);
      }
    };

    const unsubscribe = unleashService.subscribe(updateTest);
    updateTest();

    return unsubscribe;
  }, [experimentFlag, variants, context]);

  return { variant: activeVariant, data: variantData };
};

// Hook for debugging feature flags
export const useFeatureFlagsDebug = () => {
  const [debugInfo, setDebugInfo] = useState(() => unleashService.getStatus());
  const [allFlags, setAllFlags] = useState<FeatureFlags>(() => unleashService.getAllFlags());

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo(unleashService.getStatus());
      setAllFlags(unleashService.getAllFlags());
    };

    const unsubscribe = unleashService.subscribe(updateDebugInfo);
    updateDebugInfo();

    return unsubscribe;
  }, []);

  const refreshFlags = useCallback(() => {
    setDebugInfo(unleashService.getStatus());
    setAllFlags(unleashService.getAllFlags());
  }, []);

  return {
    status: debugInfo,
    flags: allFlags,
    refresh: refreshFlags
  };
};

// Utility hook for performance-sensitive feature checks
export const useOptimizedFeatureFlag = (flagName: keyof FeatureFlags, context?: Record<string, string>) => {
  // Use a ref to avoid unnecessary re-renders
  const [isEnabled, setIsEnabled] = useState<boolean>(() => 
    unleashService.isEnabled(flagName, context)
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateFlag = () => {
      // Debounce updates to avoid excessive re-renders
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newValue = unleashService.isEnabled(flagName, context);
        setIsEnabled(current => current !== newValue ? newValue : current);
      }, 100);
    };

    const unsubscribe = unleashService.subscribe(updateFlag);
    updateFlag();

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [flagName, context]);

  return isEnabled;
};

export default useFeatureFlags;