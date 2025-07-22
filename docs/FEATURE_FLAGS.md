# Feature Flags Documentation

## Overview

Sprkz uses Unleash for feature flag management, enabling controlled feature rollouts, A/B testing, and experimental features.

## Configuration

- **Server URL**: https://flags.zpaper.com/
- **Client Package**: `unleash-client`
- **Environment Variable**: `REACT_APP_UNLEASH_URL`

## Implementation Strategy

### Core Feature Flags

#### Signature Features
- `typed-signature-fonts` - Enable advanced font selection for typed signatures
- `signature-color-options` - Allow color selection (black/blue) for signatures  
- `advanced-signature-tools` - Enhanced signature editing tools (undo/redo, stroke width)

#### Wizard & Navigation
- `smart-field-navigation` - Intelligent next-field detection based on form structure
- `auto-validation` - Real-time validation as user types
- `progress-analytics` - Enhanced progress tracking with time estimates

#### PDF Processing
- `enhanced-field-detection` - Advanced field type detection and categorization
- `batch-pdf-processing` - Support for processing multiple PDFs
- `field-prefilling` - Automatic field population from previous submissions

#### UI/UX Experiments
- `dark-theme` - Dark mode theme option
- `compact-layout` - Condensed UI layout for smaller screens
- `animated-transitions` - Smooth animations between wizard steps

#### Performance Features
- `lazy-page-loading` - Load PDF pages on-demand for large documents
- `aggressive-caching` - Enhanced caching strategies for faster performance
- `preload-adjacent-pages` - Preload nearby pages for smoother navigation

### Usage Pattern

```typescript
// In React components
const MyComponent = () => {
  const { isFeatureEnabled, getFeatureVariant } = useFeatureFlags();
  
  // Simple boolean flag
  const showAdvancedFeatures = isFeatureEnabled('advanced-signature-tools');
  
  // Variant flag for A/B testing
  const themeVariant = getFeatureVariant('ui-theme-experiment');
  
  return (
    <div>
      {showAdvancedFeatures && <AdvancedTools />}
      <ThemeProvider theme={themeVariant.payload || 'default'}>
        <MainContent />
      </ThemeProvider>
    </div>
  );
};
```

### Testing Strategy

#### Flag-Dependent Testing
- Mock feature flags in tests using custom test utilities
- Test both enabled and disabled states for each flag
- Include flag status in test descriptions

```typescript
// Test utilities for feature flags
const renderWithFlags = (component: ReactElement, flags: Record<string, boolean>) => {
  const mockFeatureFlags = {
    isFeatureEnabled: jest.fn((flagName: string) => flags[flagName] || false),
    getFeatureVariant: jest.fn(),
    isReady: true
  };
  
  return render(
    <FeatureFlagsContext.Provider value={mockFeatureFlags}>
      {component}
    </FeatureFlagsContext.Provider>
  );
};

// Usage in tests
describe('SignatureComponent', () => {
  it('should show color options when flag is enabled', () => {
    renderWithFlags(<SignatureComponent />, { 'signature-color-options': true });
    expect(screen.getByTestId('color-picker')).toBeInTheDocument();
  });
  
  it('should hide color options when flag is disabled', () => {
    renderWithFlags(<SignatureComponent />, { 'signature-color-options': false });
    expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
  });
});
```

### Rollout Strategy

#### Phase 1: Infrastructure Flags
- Setup basic feature flag infrastructure
- Implement core hooks and context
- Test with simple UI flags (theme, layout)

#### Phase 2: Feature Development Flags
- Use flags during development of major features
- Enable new features for internal testing
- Gradual rollout to beta users

#### Phase 3: Performance and Optimization Flags
- Implement performance-related flags
- A/B test different optimization strategies
- Monitor performance impact of features

#### Phase 4: Advanced Features
- Complex wizard enhancements
- AI-powered field detection improvements
- Advanced analytics and reporting features

### Flag Lifecycle Management

#### Development
- Create flag with 0% rollout
- Test locally with environment override
- Code review includes flag strategy

#### Testing
- Enable flag in staging environment
- Comprehensive testing of both states
- Performance testing with flag enabled/disabled

#### Rollout
- Start with 1% rollout to production
- Monitor metrics and error rates
- Gradually increase rollout percentage
- Full rollout after validation

#### Cleanup
- Remove flag when feature is stable
- Clean up flag-related code
- Document feature as permanently enabled

### Monitoring and Analytics

#### Flag Usage Metrics
- Track flag evaluation frequency
- Monitor feature adoption rates
- Measure performance impact of flags

#### Error Handling
- Graceful degradation when flag service is unavailable
- Default to safe fallback values
- Log flag service errors for debugging

### Best Practices

#### Flag Naming Convention
- Use kebab-case for flag names
- Include feature area prefix (e.g., `signature-`, `wizard-`, `pdf-`)
- Use descriptive names that explain the feature

#### Code Organization
- Group flag-related logic in dedicated hooks
- Avoid flag checks in deeply nested components
- Use higher-order components for flag-based rendering

#### Documentation
- Document each flag's purpose and expected behavior
- Include rollout plan and success metrics
- Update documentation when flags are removed

## Integration with Development Workflow

### Local Development
```bash
# Override flags locally
export REACT_APP_UNLEASH_CLIENT_KEY="development-key"
export REACT_APP_UNLEASH_ENVIRONMENT="development"
```

### Testing Environment
- Separate flag configuration for staging/testing
- Ability to enable all experimental features
- Test flag toggling scenarios

### Production Environment
- Secure client key management
- Monitoring and alerting for flag service health
- Graceful fallbacks when service is unavailable

This feature flag strategy enables safe, controlled rollouts while maintaining high code quality and user experience standards.