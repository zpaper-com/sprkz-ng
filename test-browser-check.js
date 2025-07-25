// Simple test to check if Fields button is visible on /tremfya
console.log('Please manually check the following:');
console.log('1. Open http://localhost:7779/tremfya in your browser');
console.log('2. Open browser DevTools (F12)');
console.log('3. Look at the Console tab for logs starting with "🔍 FEATURE FLAG CHECK TRIGGERED"');
console.log('4. Look for the Fields button in the PDF viewer header');
console.log('5. If the feature flag is working correctly:');
console.log('   - Console should show: enabled: false');
console.log('   - Fields button should NOT be visible');
console.log('');
console.log('Expected console output for /tremfya:');
console.log('🔍 FEATURE FLAG CHECK TRIGGERED { hasDynamicConfig: true, hasFeatures: true, ... }');
console.log('🔍 Tooltip feature check for route: { featureId: 12, featureValue: undefined, enabled: false, ... }');
console.log('🔍 Fields button render check: { isTooltipFeatureEnabled: false, shouldRender: false, ... }');
console.log('');
console.log('If the Fields button is still showing, there might be multiple PDFFormContainer instances or a timing issue.');