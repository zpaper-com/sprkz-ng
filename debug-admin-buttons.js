const { chromium } = require('playwright');

async function debugAdminButtons() {
  console.log('🔍 Debugging admin interface buttons...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    console.log('📱 Navigated to admin area');
    
    // Take screenshot
    await page.screenshot({ path: 'admin-interface-debug.png', fullPage: true });
    console.log('📷 Screenshot saved');
    
    // Click on URL Configuration tab
    await page.click('text=URL Configuration');
    await page.waitForTimeout(1000);
    console.log('🔧 Opened URL Configuration');
    
    // List all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('🎯 Available buttons:', buttons);
    
    // Take another screenshot
    await page.screenshot({ path: 'admin-url-config-debug.png', fullPage: true });
    console.log('📷 URL Config tab screenshot saved');
    
  } catch (error) {
    console.log(`❌ Debug failed: ${error.message}`);
    await page.screenshot({ path: 'admin-debug-error.png', fullPage: true });
  }
  
  await browser.close();
}

debugAdminButtons().catch(console.error);