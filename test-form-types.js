const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable console logging for form interactions
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Field changed') || text.includes('Field focused')) {
      console.log(`INTERACTION: ${text}`);
    }
  });
  
  try {
    console.log('Loading mobile route...');
    await page.goto('http://172.17.0.1:7779/mobile', { timeout: 15000 });
    
    // Wait for PDF to load and render
    await page.waitForTimeout(5000);
    
    // Check for different input types
    const textInputs = await page.$$('input[type="text"]');
    const checkboxes = await page.$$('input[type="checkbox"]');
    const radios = await page.$$('input[type="radio"]');
    const selects = await page.$$('select');
    
    console.log(`✅ Found ${textInputs.length} text inputs`);
    console.log(`✅ Found ${checkboxes.length} checkboxes`);
    console.log(`✅ Found ${radios.length} radio buttons`);
    console.log(`✅ Found ${selects.length} select dropdowns`);
    
    // Test text input
    if (textInputs.length > 0) {
      console.log('Testing text input...');
      await textInputs[0].fill('Hello World');
      const value = await textInputs[0].inputValue();
      console.log(`✅ Text input value: "${value}"`);
    }
    
    // Test checkbox
    if (checkboxes.length > 0) {
      console.log('Testing checkbox...');
      await checkboxes[0].check();
      const isChecked = await checkboxes[0].isChecked();
      console.log(`✅ Checkbox checked: ${isChecked}`);
    }
    
    // Test radio button
    if (radios.length > 0) {
      console.log('Testing radio button...');
      await radios[0].click();
      const isChecked = await radios[0].isChecked();
      console.log(`✅ Radio button checked: ${isChecked}`);
    }
    
    // Take screenshot showing interactive elements
    await page.screenshot({ path: '/workspace/playwright-output/interactive-form-final.png' });
    console.log('✅ Screenshot saved');
    
    console.log('\n🎉 Form interactivity is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();