const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging to see form interactions
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Field') || text.includes('Rendered') || text.includes('annotation')) {
      console.log(`CONSOLE: ${text}`);
    }
  });
  
  try {
    console.log('Loading mobile route...');
    await page.goto('http://172.17.0.1:7779/mobile', { timeout: 15000 });
    
    // Wait for PDF to load and render
    await page.waitForTimeout(5000);
    
    // Check for interactive elements
    const inputs = await page.$$('input');
    const selects = await page.$$('select');
    const buttons = await page.$$('button');
    
    console.log(`Found ${inputs.length} input fields`);
    console.log(`Found ${selects.length} select fields`);
    console.log(`Found ${buttons.length} buttons`);
    
    // Test text input interaction
    if (inputs.length > 0) {
      console.log('Testing first text input...');
      await inputs[0].fill('Test Value');
      await inputs[0].blur();
      const value = await inputs[0].inputValue();
      console.log(`Input value after typing: "${value}"`);
    }
    
    // Test checkbox interaction
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      console.log('Testing first checkbox...');
      await checkboxes[0].check();
      const isChecked = await checkboxes[0].isChecked();
      console.log(`Checkbox checked: ${isChecked}`);
    }
    
    // Take screenshot to see interactive elements
    await page.screenshot({ path: '/workspace/playwright-output/interactive-form.png' });
    console.log('Screenshot saved');
    
    console.log('✅ Form interactivity test completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();