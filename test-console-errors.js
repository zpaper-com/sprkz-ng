const { chromium } = require('playwright');

async function testConsoleErrors() {
  console.log('🎭 Testing for Console Errors...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      console.log(`🔥 ${type.toUpperCase()}: ${text}`);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔧 Testing markup workflow...');
    
    // Click Text Area tool
    await page.click('button:has-text("Text Area")');
    console.log('✅ Text Area tool selected');
    
    await page.waitForTimeout(1000);
    
    // Click on PDF to place
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      await page.mouse.click(box.x + 200, box.y + 200);
      console.log('✅ Clicked to place element');
      
      await page.waitForTimeout(3000);
      
      // Check various states
      const dialog = await page.$('.MuiDialog-root');
      console.log('Dialog present:', !!dialog);
      
      // Check if there are any error messages on page
      const errorElements = await page.$$eval('[class*="error"], [class*="Error"]', 
        elements => elements.map(el => el.textContent).filter(text => text?.trim())
      );
      if (errorElements.length > 0) {
        console.log('Error elements on page:', errorElements);
      }
      
      // Check React dev tools errors
      const reactErrors = await page.evaluate(() => {
        // Look for React error boundaries or console messages
        return window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot ? 'React DevTools available' : 'No React DevTools';
      });
      console.log('React state:', reactErrors);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConsoleErrors().catch(console.error);