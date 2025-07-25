const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser for PDF worker test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable request/response logging
  page.on('request', request => {
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    console.log(`RESPONSE: ${status} ${url}`);
    if (status >= 400) {
      console.log(`❌ FAILED RESPONSE: ${status} ${url}`);
    }
  });
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable error logging
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  // Enable requestfailed logging
  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('Navigating to mobile page...');
    await page.goto('http://172.17.0.1:7779/mobile', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Waiting 15 seconds to observe PDF loading...');
    await page.waitForTimeout(15000);
    
    // Check if PDF worker is accessible
    console.log('Testing PDF worker access...');
    try {
      const workerResponse = await page.goto('http://172.17.0.1:7779/pdf.worker.min.js');
      console.log(`PDF worker response: ${workerResponse.status()}`);
    } catch (e) {
      console.log(`PDF worker access error: ${e.message}`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: '/workspace/playwright-output/pdf-worker-debug.png' });
    console.log('Screenshot saved');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();