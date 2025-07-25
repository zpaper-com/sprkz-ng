const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`CONSOLE: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`ERROR: ${error.message}`);
  });
  
  try {
    console.log('Testing basic mobile page load...');
    await page.goto('http://172.17.0.1:7779/mobile', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();