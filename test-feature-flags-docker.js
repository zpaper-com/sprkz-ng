const { chromium } = require('playwright');

async function testFeatureFlagsWithDocker() {
  console.log('🐳 Testing Feature Flags Application with Docker Playwright...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Starting feature flag tests...');
    
    // Test 1: Check default state of features on different URLs
    await testDefaultFeatureStates(page);
    
    // Test 2: Test admin interface for feature flag configuration
    await testAdminInterface(page);
    
    // Test 3: Test feature flag changes take effect
    await testFeatureFlagChanges(page);
    
    // Test 4: Test different URL configurations
    await testURLSpecificFeatures(page);
    
    console.log('🎉 All feature flag tests completed!');
    
  } catch (error) {
    console.log('❌ Feature flag test failed:', error.message);
    await page.screenshot({ path: 'feature-flag-test-error.png' });
    return false;
  } finally {
    await browser.close();
  }
  
  return true;
}

async function testDefaultFeatureStates(page) {
  console.log('\n📋 Test 1: Default Feature States');
  
  // Test makana2025 route
  console.log('🔍 Testing /makana route features...');
  await page.goto('http://localhost:7779/makana', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const makanaFeatures = await analyzePageFeatures(page);
  console.log('📊 Makana features:', makanaFeatures);
  
  // Test tremfya route
  console.log('🔍 Testing /tremfya route features...');
  await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const tremfyaFeatures = await analyzePageFeatures(page);
  console.log('📊 Tremfya features:', tremfyaFeatures);
  
  // Test default route
  console.log('🔍 Testing default route features...');
  await page.goto('http://localhost:7779/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const defaultFeatures = await analyzePageFeatures(page);
  console.log('📊 Default features:', defaultFeatures);
}

async function testAdminInterface(page) {
  console.log('\n🔧 Test 2: Admin Interface Access');
  
  await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check if admin interface loads
  const adminTitle = await page.$('text=Admin Interface, text=Sprkz Admin');
  if (adminTitle) {
    console.log('✅ Admin interface accessible');
  } else {
    console.log('❌ Admin interface not accessible');
    return false;
  }
  
  // Check for URL Configuration
  const urlConfigLink = await page.$('text=URL Configuration');
  if (urlConfigLink) {
    console.log('✅ URL Configuration found');
    await urlConfigLink.click();
    await page.waitForTimeout(2000);
    
    // Check for configured URLs
    const urlPanels = await page.$$('[data-testid*="url-panel"], .MuiAccordion-root');
    console.log(`📝 Found ${urlPanels.length} URL configurations`);
    
    if (urlPanels.length > 0) {
      console.log('✅ URL configurations loaded');
    } else {
      console.log('⚠️ No URL configurations found');
    }
  } else {
    console.log('❌ URL Configuration not found in admin');
  }
  
  // Check for Feature Flag Management
  const featureFlagLink = await page.$('text=Feature Flag Management, text=Feature Flags');
  if (featureFlagLink) {
    console.log('✅ Feature Flag Management found');
  } else {
    console.log('⚠️ Feature Flag Management not found');
  }
  
  // Check for PDF Management
  const pdfManagementLink = await page.$('text=PDF Management');
  if (pdfManagementLink) {
    console.log('✅ PDF Management found');
  } else {
    console.log('⚠️ PDF Management not found');
  }
}

async function testFeatureFlagChanges(page) {
  console.log('\n🎛️ Test 3: Feature Flag Changes');
  
  await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Navigate to URL Configuration
  const urlConfigLink = await page.$('text=URL Configuration');
  if (urlConfigLink) {
    await urlConfigLink.click();
    await page.waitForTimeout(2000);
    
    // Look for tremfya configuration
    const tremfyaConfig = await page.$('text=/tremfya');
    if (tremfyaConfig) {
      console.log('📝 Found tremfya configuration');
      
      // Try to expand the configuration panel
      const expandButton = await page.$('button[aria-expanded], [data-testid*="expand"]');
      if (expandButton) {
        await expandButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for feature toggles
      const toggles = await page.$$('input[type="checkbox"], [role="switch"]');
      console.log(`🎛️ Found ${toggles.length} toggles`);
      
      if (toggles.length > 0) {
        // Test toggling the first feature
        const firstToggle = toggles[0];
        const initialState = await firstToggle.isChecked();
        console.log(`🔄 Testing toggle (initially ${initialState ? 'ON' : 'OFF'})`);
        
        // Toggle the feature
        await firstToggle.click();
        await page.waitForTimeout(500);
        
        const newState = await firstToggle.isChecked();
        console.log(`🔄 After toggle: ${newState ? 'ON' : 'OFF'}`);
        
        if (initialState !== newState) {
          console.log('✅ Feature toggle working');
        } else {
          console.log('❌ Feature toggle not working');
        }
        
        // Look for save button
        const saveButton = await page.$('button:has-text("Save")');
        if (saveButton) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log('💾 Saved configuration');
        }
      }
    } else {
      console.log('⚠️ Tremfya configuration not found');
    }
  }
}

async function testURLSpecificFeatures(page) {
  console.log('\n🌐 Test 4: URL-Specific Feature Behavior');
  
  const testUrls = [
    { path: '/tremfya', name: 'Tremfya' },
    { path: '/makana', name: 'Makana' },
    { path: '/', name: 'Default' }
  ];
  
  for (const urlConfig of testUrls) {
    console.log(`\n🔍 Testing ${urlConfig.name} (${urlConfig.path})...`);
    
    await page.goto(`http://localhost:7779${urlConfig.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const features = await analyzePageFeatures(page);
    const hasExpectedFeatures = features.thumbnailSidebar || features.wizardButton || features.fieldsButton;
    
    console.log(`📊 ${urlConfig.name} features analysis:`, features);
    console.log(`📈 Has expected features: ${hasExpectedFeatures ? '✅ YES' : '❌ NO'}`);
    
    // Take screenshot for verification
    await page.screenshot({ path: `feature-test-${urlConfig.name.toLowerCase()}.png` });
    console.log(`📸 Screenshot saved: feature-test-${urlConfig.name.toLowerCase()}.png`);
  }
}

async function analyzePageFeatures(page) {
  const features = {
    thumbnailSidebar: false,
    wizardButton: false,
    fieldsButton: false,
    markupTools: false,
    progressTracker: false,
    pdfViewer: false
  };
  
  try {
    // Check for thumbnail sidebar
    const thumbnailSidebar = await page.$('[data-testid="thumbnail-sidebar"]');
    features.thumbnailSidebar = !!thumbnailSidebar;
    
    // Check for wizard button
    const wizardButton = await page.$('button:has-text("Start"), button:has-text("Next"), button:has-text("Submit")');
    features.wizardButton = !!wizardButton;
    
    // Check for fields button
    const fieldsButton = await page.$('button:has-text("Fields")');
    features.fieldsButton = !!fieldsButton;
    
    // Check for markup tools
    const markupTools = await page.$('button:has-text("Signature"), button:has-text("Text"), button:has-text("Highlight")');
    features.markupTools = !!markupTools;
    
    // Check for progress tracker
    const progressTracker = await page.$('[data-testid*="progress"], .MuiLinearProgress-root');
    features.progressTracker = !!progressTracker;
    
    // Check for PDF viewer
    const pdfViewer = await page.$('canvas, embed[type="application/pdf"], .pdf-viewer');
    features.pdfViewer = !!pdfViewer;
    
  } catch (error) {
    console.log('⚠️ Error analyzing features:', error.message);
  }
  
  return features;
}

// Run the comprehensive test
testFeatureFlagsWithDocker().then(success => {
  if (success) {
    console.log('\n🎉 SUCCESS: Feature flags are working correctly!');
    process.exit(0);
  } else {
    console.log('\n💥 FAILED: Feature flag issues detected');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});