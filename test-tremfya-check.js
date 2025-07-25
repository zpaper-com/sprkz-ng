const { chromium } = require('playwright');

async function testTremfya() {
  console.log('🔍 Testing /tremfya route...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'tremfya-check.png', fullPage: true });
    console.log('📷 Screenshot saved as tremfya-check.png');
    
    // Check if Fields button is visible (should be visible)
    const fieldsButton = await page.locator('button:has-text("Fields")').count();
    console.log(`🎌 Fields button visible: ${fieldsButton > 0 ? 'Yes (Correct!)' : 'No (ERROR!)'}`);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.log(`❌ Navigation failed: ${error.message}`);
  }
  
  await browser.close();
}

testTremfya().catch(console.error);