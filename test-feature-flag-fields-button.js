const { chromium } = require('playwright');

async function testFieldsButtonFeatureFlag() {
  console.log('🎭 Testing Fields button feature flag behavior...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to tremfya route (should have feature flag off by default)
    console.log('📍 Navigating to /tremfya route...');
    await page.goto('http://localhost:7779/tremfya');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if Fields button exists
    const fieldsButton = await page.locator('button:has-text("Fields")');
    const fieldsButtonCount = await fieldsButton.count();
    
    console.log(`🔍 Fields buttons found: ${fieldsButtonCount}`);
    
    if (fieldsButtonCount > 0) {
      console.log('❌ ISSUE: Fields button is visible when it should be hidden!');
      
      // Check if button is actually visible
      const isVisible = await fieldsButton.first().isVisible();
      console.log(`👁️  Button visibility: ${isVisible}`);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'fields-button-visible.png' });
      console.log('📸 Screenshot saved: fields-button-visible.png');
      
      // Check console logs for feature flag messages
      console.log('📋 Checking console logs...');
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.text().includes('Tooltip feature check')) {
          consoleLogs.push(msg.text());
        }
      });
      
      // Reload to capture console logs
      await page.reload();
      await page.waitForTimeout(2000);
      
      console.log('🔍 Feature flag console logs:');
      consoleLogs.forEach(log => console.log(`   ${log}`));
      
    } else {
      console.log('✅ SUCCESS: Fields button is correctly hidden!');
    }
    
    // Now test with feature flag enabled
    console.log('\n🔧 Testing with feature flag enabled...');
    
    // Navigate to admin to enable feature flag
    console.log('📍 Going to admin interface...');
    await page.goto('http://localhost:7779/admin');
    await page.waitForTimeout(2000);
    
    // Look for URL configuration
    const urlConfigLink = await page.locator('text=URL Configuration');
    if (await urlConfigLink.count() > 0) {
      await urlConfigLink.click();
      await page.waitForTimeout(1000);
      
      // Look for tremfya URL configuration
      const tremfyaConfig = await page.locator('text=/tremfya');
      if (await tremfyaConfig.count() > 0) {
        console.log('📝 Found tremfya configuration, attempting to edit...');
        
        // Try to find edit button or expand panel
        const editButton = await page.locator('button[aria-label*="edit"], button:has-text("Edit")').first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Look for Field Tooltip System toggle
        const tooltipToggle = await page.locator('text=Field Tooltip System').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await tooltipToggle.count() > 0) {
          console.log('🎛️  Found tooltip feature toggle, enabling...');
          await tooltipToggle.check();
          
          // Save changes
          const saveButton = await page.locator('button:has-text("Save")');
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
          
          // Navigate back to tremfya route
          console.log('📍 Navigating back to /tremfya with feature enabled...');
          await page.goto('http://localhost:7779/tremfya');
          await page.waitForTimeout(3000);
          
          // Check if Fields button is now visible
          const fieldsButtonEnabled = await page.locator('button:has-text("Fields")');
          const fieldsButtonEnabledCount = await fieldsButtonEnabled.count();
          
          console.log(`🔍 Fields buttons found (with feature enabled): ${fieldsButtonEnabledCount}`);
          
          if (fieldsButtonEnabledCount > 0) {
            console.log('✅ SUCCESS: Fields button is visible when feature is enabled!');
          } else {
            console.log('❌ ISSUE: Fields button is still hidden when feature should be enabled!');
          }
          
          await page.screenshot({ path: 'fields-button-feature-enabled.png' });
          console.log('📸 Screenshot saved: fields-button-feature-enabled.png');
        } else {
          console.log('⚠️  Could not find Field Tooltip System toggle in admin');
        }
      } else {
        console.log('⚠️  Could not find tremfya configuration in admin');
      }
    } else {
      console.log('⚠️  Could not find URL Configuration in admin');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testFieldsButtonFeatureFlag().catch(console.error);