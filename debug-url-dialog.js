const { chromium } = require('playwright');

async function debugURLDialog() {
  console.log('🔍 Debugging URL dialog form fields...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    console.log('📱 Navigated to admin area');
    
    // Click on URL Configuration tab
    await page.click('text=URL Configuration');
    await page.waitForTimeout(1000);
    console.log('🔧 Opened URL Configuration');
    
    // Click Add URL button
    await page.click('button:has-text("Add URL")');
    await page.waitForTimeout(1000);
    console.log('➕ Opened URL creation dialog');
    
    // Take screenshot of dialog
    await page.screenshot({ path: 'url-dialog-debug.png', fullPage: true });
    console.log('📷 Dialog screenshot saved');
    
    // List all input fields
    const inputs = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({
        id: input.id,
        name: input.name,
        placeholder: input.placeholder,
        label: input.getAttribute('aria-label'),
        type: input.type
      }))
    );
    console.log('📝 Available input fields:', inputs);
    
    // List labels
    const labels = await page.locator('label').allTextContents();
    console.log('🏷️ Available labels:', labels);
    
  } catch (error) {
    console.log(`❌ Debug failed: ${error.message}`);
    await page.screenshot({ path: 'url-dialog-debug-error.png', fullPage: true });
  }
  
  await browser.close();
}

debugURLDialog().catch(console.error);