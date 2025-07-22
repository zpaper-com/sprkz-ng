import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { unleash } from '../config/unleash'; // Temporarily disabled for React compatibility

interface FeatureFlagsContextType {
  isFeatureEnabled: (flagName: string) => boolean;
  getFeatureVariant: (flagName: string) => any;
  isReady: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  isFeatureEnabled: () => false,
  getFeatureVariant: () => null,
  isReady: false
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(true); // Default to true for now
  
  useEffect(() => {
    // TODO: Implement Unleash client when React compatibility is resolved
    // For now, feature flags will return false by default
  }, []);
  
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    // TODO: Replace with actual Unleash integration
    console.log(`Feature flag checked: ${flagName} (defaulting to false)`);
    return false; // Default to false for all flags
  }, []);
  
  const getFeatureVariant = useCallback((flagName: string): any => {
    // TODO: Replace with actual Unleash integration
    console.log(`Feature variant requested: ${flagName} (defaulting to null)`);
    return null; // Default to null for all variants
  }, []);
  
  return (
    <FeatureFlagsContext.Provider value={{ isFeatureEnabled, getFeatureVariant, isReady }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};