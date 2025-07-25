const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable request/response logging
  page.on('request', request => {
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  console.log('Navigating to mobile page...');
  
  try {
    // Set a reasonable timeout
    await page.goto('http://172.17.0.1:7779/mobile', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page loaded successfully');
    
    // Wait a bit and check for loading states
    await page.waitForTimeout(5000);
    
    // Check if PDF loading is stuck
    const loadingElements = await page.$$('text=Loading');
    console.log(`Found ${loadingElements.length} loading elements`);
    
    // Check for error messages
    const errorElements = await page.$$('[role="alert"]');
    for (const errorEl of errorElements) {
      const text = await errorEl.textContent();
      console.log(`ERROR FOUND: ${text}`);
    }
    
    // Check specific PDF loading elements
    const pdfLoadingText = await page.$$('text=Loading PDF...');
    console.log(`Found ${pdfLoadingText.length} PDF loading elements`);
    
    // Check if we can access the PDF directly
    console.log('Testing direct PDF access...');
    const pdfResponse = await page.goto('http://172.17.0.1:7779/pdfs/makana2025.pdf');
    console.log(`PDF direct access response: ${pdfResponse.status()}`);
    
    // Go back to mobile page
    await page.goto('http://172.17.0.1:7779/mobile');
    
    // Wait longer to see if PDF eventually loads
    await page.waitForTimeout(10000);
    
    // Check loading state again
    const loadingElements2 = await page.$$('text=Loading');
    console.log(`After 10 more seconds, found ${loadingElements2.length} loading elements`);
    
    // Take a screenshot
    await page.screenshot({ path: '/workspace/playwright-output/mobile-loading-debug.png' });
    console.log('Screenshot saved to playwright-output/mobile-loading-debug.png');
    
  } catch (error) {
    console.error('Error during page load:', error);
  }
  
  await browser.close();
})();