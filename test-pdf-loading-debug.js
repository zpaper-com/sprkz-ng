const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track all requests
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: Date.now()
    });
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Enable console logging with more detail
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`CONSOLE ${type}: ${text}`);
    
    // Look for PDF loading related logs
    if (text.includes('PDF') || text.includes('pdf') || text.includes('loading') || text.includes('Loading') || text.includes('Error') || text.includes('error')) {
      console.log(`🔍 PDF-RELATED LOG: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('Navigating to mobile page...');
    await page.goto('http://172.17.0.1:7779/mobile');
    
    console.log('Waiting for initial page load...');
    await page.waitForTimeout(3000);
    
    // Check how many times PDF URL was requested
    const pdfRequests = requests.filter(r => r.url.includes('.pdf'));
    console.log(`\nPDF REQUESTS SUMMARY:`);
    console.log(`Total PDF requests: ${pdfRequests.length}`);
    pdfRequests.forEach((req, i) => {
      console.log(`  ${i+1}: ${req.method} ${req.url}`);
    });
    
    // Check for PDF worker requests
    const workerRequests = requests.filter(r => r.url.includes('worker'));
    console.log(`\nWORKER REQUESTS: ${workerRequests.length}`);
    workerRequests.forEach((req, i) => {
      console.log(`  ${i+1}: ${req.method} ${req.url}`);
    });
    
    console.log('\nWaiting 15 more seconds to see if PDF loads...');
    await page.waitForTimeout(15000);
    
    // Check again for PDF requests after longer wait
    const pdfRequestsAfter = requests.filter(r => r.url.includes('.pdf'));
    console.log(`\nFINAL PDF REQUESTS: ${pdfRequestsAfter.length}`);
    
    // Check the DOM state
    const loadingText = await page.textContent('body');
    const hasLoadingForm = loadingText.includes('Loading form');
    const hasLoadingPDF = loadingText.includes('Loading PDF');
    
    console.log(`\nDOM STATE:`);
    console.log(`Has "Loading form" text: ${hasLoadingForm}`);
    console.log(`Has "Loading PDF" text: ${hasLoadingPDF}`);
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/playwright-output/pdf-loading-final-debug.png' });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await browser.close();
})();