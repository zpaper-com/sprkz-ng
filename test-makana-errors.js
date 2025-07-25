const { chromium } = require('playwright');

async function testMakanaErrors() {
  console.log('🔍 Testing /makana route for errors...');
  
  let browser;
  let context;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    page = await context.newPage();
    
    // Listen for console messages and errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      
      // Log important messages
      if (msg.type() === 'error' || text.includes('Error') || text.includes('Failed')) {
        console.log(`❌ Console ${msg.type()}: ${text}`);
      } else if (text.includes('🎌') || text.includes('🔍')) {
        console.log(`🔍 Feature Flag: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`💥 Page Error: ${error.message}`);
    });
    
    // Listen for network failures
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('📍 Navigating to http://localhost:7779/makana...');
    
    // Navigate to /makana route
    const response = await page.goto('http://localhost:7779/makana', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`📡 Response Status: ${response.status()}`);
    
    // Wait for React app to load
    console.log('⏳ Waiting for React app to initialize...');
    await page.waitForSelector('[data-testid="pdf-form-container"], .error, .loading', {
      timeout: 10000
    });
    
    // Check if PDF is loading
    const isLoading = await page.locator('.loading, [data-testid="loading"]').count() > 0;
    if (isLoading) {
      console.log('⏳ PDF is still loading, waiting longer...');
      await page.waitForTimeout(5000);
    }
    
    // Take screenshot for debugging
    await page.screenshot({ 
      path: 'makana-debug.png',
      fullPage: true 
    });
    console.log('📷 Screenshot saved as makana-debug.png');
    
    // Check for specific elements and errors
    console.log('\n🔍 Analyzing page content...');
    
    // Check if PDF container exists
    const pdfContainer = await page.locator('[data-testid="pdf-form-container"]').count();
    console.log(`📦 PDF Container found: ${pdfContainer > 0 ? 'Yes' : 'No'}`);
    
    // Check for error messages
    const errorAlerts = await page.locator('.MuiAlert-standardError, [role="alert"]').count();
    if (errorAlerts > 0) {
      const errorTexts = await page.locator('.MuiAlert-standardError, [role="alert"]').allTextContents();
      console.log(`❌ Error alerts found (${errorAlerts}):`);
      errorTexts.forEach((text, i) => console.log(`   ${i + 1}: ${text}`));
    }
    
    // Check if Fields button is present (should be hidden due to feature flag)
    const fieldsButton = await page.locator('button:has-text("Fields")').count();
    console.log(`🎌 Fields button visible: ${fieldsButton > 0 ? 'Yes (ERROR!)' : 'No (Correct!)'}`);
    
    // Check for PDF viewer elements
    const pdfViewer = await page.locator('canvas').count();
    console.log(`🖼️  PDF Canvas elements: ${pdfViewer}`);
    
    // Check for wizard button
    const wizardButton = await page.locator('button:has-text("Start"), button:has-text("Wizard")').count();
    console.log(`🧙 Wizard button found: ${wizardButton > 0 ? 'Yes' : 'No'}`);
    
    // Check page title and content
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for specific error patterns in page content
    const pageContent = await page.content();
    const hasReactError = pageContent.includes('React error') || pageContent.includes('Component stack');
    const hasJSError = pageContent.includes('TypeError') || pageContent.includes('ReferenceError');
    const hasNetworkError = pageContent.includes('Failed to fetch') || pageContent.includes('Network Error');
    
    console.log('\n🕵️ Error Analysis:');
    console.log(`   React Errors: ${hasReactError ? 'Found' : 'None'}`);
    console.log(`   JavaScript Errors: ${hasJSError ? 'Found' : 'None'}`);
    console.log(`   Network Errors: ${hasNetworkError ? 'Found' : 'None'}`);
    
    // Check feature flag loading
    await page.waitForTimeout(2000); // Give time for feature flags to load
    
    console.log('\n📊 Summary:');
    console.log(`   Console Messages: ${consoleMessages.length}`);
    console.log(`   Page Errors: ${errors.length}`);
    console.log(`   HTTP Status: ${response.status()}`);
    
    // Print recent console messages
    if (consoleMessages.length > 0) {
      console.log('\n📝 Recent Console Messages:');
      consoleMessages.slice(-10).forEach((msg, i) => {
        console.log(`   ${msg.type.toUpperCase()}: ${msg.text}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n💥 JavaScript Errors:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}: ${error.message}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    // Cleanup
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

// Run the test
testMakanaErrors().catch(console.error);