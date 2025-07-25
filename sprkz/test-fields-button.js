const { chromium } = require('playwright');

async function testFieldsButton() {
  console.log('🎭 Testing Fields button visibility on /tremfya...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Tooltip feature check') || msg.text().includes('🔍')) {
      console.log('📋 Console:', msg.text());
    }
  });

  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
    
    // Wait for the page to fully load
    await page.waitForTimeout(5000);
    
    // Check for Fields button
    const fieldsButton = page.locator('button:has-text("Fields")');
    const count = await fieldsButton.count();
    
    console.log(`🔍 Fields buttons found: ${count}`);
    
    if (count > 0) {
      const isVisible = await fieldsButton.first().isVisible();
      console.log(`👁️  Fields button visible: ${isVisible}`);
      
      // Check the button's HTML
      const buttonHTML = await fieldsButton.first().innerHTML();
      console.log('🔧 Button HTML:', buttonHTML);
    } else {
      console.log('✅ Fields button correctly hidden!');
    }
    
    // Take screenshot
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/tremfya-test.png' });
    console.log('📸 Screenshot saved: tremfya-test.png');
    
    // Check dynamic config in local storage or page data
    const configData = await page.evaluate(() => {
      return {
        url: window.location.href,
        pathname: window.location.pathname,
        // Try to access any global config data
        dynamicConfig: window.dynamicConfig || 'not found'
      };
    });
    
    console.log('🔧 Page data:', configData);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testFieldsButton().catch(console.error);