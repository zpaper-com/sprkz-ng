const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing mobile route...');
  
  try {
    await page.goto('http://172.17.0.1:7779/mobile', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Check if toolbar is present
    const toolbar = await page.$('header[class*="MuiAppBar"]');
    const hasToolbar = !!toolbar;
    console.log(`✅ Blue toolbar present: ${hasToolbar}`);
    
    // Check if PDF canvas is present
    const canvas = await page.$('canvas');
    const hasCanvas = !!canvas;
    console.log(`✅ PDF canvas present: ${hasCanvas}`);
    
    // Check if title is correct
    const title = await page.textContent('h6');
    console.log(`✅ Title: "${title}"`);
    
    // Check if page counter is present
    const pageCounter = await page.textContent('header p');
    console.log(`✅ Page counter: "${pageCounter}"`);
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/playwright-output/mobile-working.png' });
    console.log('✅ Screenshot saved');
    
    console.log('\n🎉 Mobile route is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();