const { chromium } = require('playwright');

async function testMakana() {
  console.log('🔍 Testing /makana route...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
  });
  
  try {
    await page.goto('http://localhost:7779/makana', { waitUntil: 'networkidle' });
    
    // Take screenshot regardless of errors
    await page.screenshot({ path: 'makana-error.png', fullPage: true });
    console.log('📷 Screenshot saved as makana-error.png');
    
    // Check if page loaded properly
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for any visible errors
    const errorElements = await page.locator('[role="alert"], .error').count();
    console.log(`❌ Error elements found: ${errorElements}`);
    
    // Check if Fields button is visible (should be hidden)
    const fieldsButton = await page.locator('button:has-text("Fields")').count();
    console.log(`🎌 Fields button visible: ${fieldsButton > 0 ? 'Yes (ERROR!)' : 'No (Correct!)'}`);
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.log(`❌ Navigation failed: ${error.message}`);
  }
  
  await browser.close();
}

testMakana().catch(console.error);