const { chromium } = require('playwright');

async function testDisableFeatureFlag() {
  console.log('🎭 Testing: Disable Field Tooltip System for /tremfya...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Go to admin interface
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Click on URL Configuration
    console.log('🔧 Accessing URL Configuration...');
    const urlConfigLink = page.locator('text=URL Configuration');
    if (await urlConfigLink.count() > 0) {
      await urlConfigLink.click();
      await page.waitForTimeout(2000);
      
      // Step 3: Find tremfya configuration
      console.log('🔍 Looking for tremfya configuration...');
      await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/admin-page.png' });
      
      // Look for tremfya text and find parent container
      const tremfyaPanel = page.locator('text=/tremfya').locator('..');
      if (await tremfyaPanel.count() > 0) {
        console.log('📝 Found tremfya panel');
        
        // Try to find the Field Tooltip System toggle within the tremfya panel
        // Look for switch controls
        const tooltipToggle = page.locator('[data-testid="feature-12"], input[type="checkbox"]:near(text="Field Tooltip System"), [role="switch"]:near(text="Field Tooltip System")').first();
        
        if (await tooltipToggle.count() > 0) {
          console.log('🎛️  Found Field Tooltip System toggle');
          
          // Check if it's currently checked
          const isChecked = await tooltipToggle.isChecked();
          console.log(`Toggle current state: ${isChecked ? 'ON' : 'OFF'}`);
          
          if (isChecked) {
            console.log('⚙️  Disabling Field Tooltip System...');
            await tooltipToggle.uncheck();
            await page.waitForTimeout(1000);
            
            // Look for save button
            const saveButton = page.locator('button:has-text("Save")');
            if (await saveButton.count() > 0) {
              await saveButton.click();
              await page.waitForTimeout(2000);
              console.log('💾 Saved configuration');
            }
          } else {
            console.log('ℹ️  Feature is already disabled');
          }
        } else {
          console.log('⚠️  Could not find Field Tooltip System toggle');
          
          // Try alternative approach - look for all toggles
          const allToggles = await page.locator('[role="switch"], input[type="checkbox"]').all();
          console.log(`Found ${allToggles.length} toggles total`);
          
          // Take screenshot for debugging
          await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/toggles-debug.png' });
        }
      } else {
        console.log('⚠️  Could not find tremfya configuration panel');
      }
    } else {
      console.log('⚠️  Could not find URL Configuration link');
    }
    
    // Step 4: Test the result
    console.log('🧪 Testing result on /tremfya...');
    await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const fieldsButton = page.locator('button:has-text("Fields")');
    const fieldsButtonCount = await fieldsButton.count();
    
    console.log(`📊 Fields buttons found after disable: ${fieldsButtonCount}`);
    console.log(`Expected: 0 (hidden)`);
    console.log(`Result: ${fieldsButtonCount === 0 ? '✅ SUCCESS - Feature flag working!' : '❌ Still visible'}`);
    
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/after-disable-test.png' });
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/disable-error.png' });
  } finally {
    await browser.close();
  }
}

testDisableFeatureFlag().catch(console.error);