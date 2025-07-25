const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('Error') || text.includes('PDF') || text.includes('Rendered')) {
      console.log(`CONSOLE ${type}: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('Loading mobile route...');
    await page.goto('http://172.17.0.1:7779/mobile', { timeout: 15000 });
    
    // Wait for any rendering
    await page.waitForTimeout(5000);
    
    // Check what's actually in the DOM
    const bodyText = await page.textContent('body');
    console.log('Page contains:', bodyText.slice(0, 200) + '...');
    
    // Check specific elements
    const hasCanvas = await page.$('canvas') !== null;
    const hasError = bodyText.includes('Failed to load');
    const hasLoading = bodyText.includes('Loading PDF');
    
    console.log(`Canvas present: ${hasCanvas}`);
    console.log(`Error message: ${hasError}`);
    console.log(`Loading message: ${hasLoading}`);
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/playwright-output/mobile-debug.png' });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();