const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set wide viewport to test fit-width properly
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('=== TESTING FORM INTERACTION AFTER FIT WIDTH ===');
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);  // Wait for PDF to load
  
  console.log('Testing form field interaction BEFORE fit-width...');
  
  // Try to click and type in a form field before fit-width
  const beforeFields = await page.locator('.annotationLayer input[type="text"]').count();
  console.log('Text input fields found:', beforeFields);
  
  if (beforeFields > 0) {
    try {
      // Find a visible text input field
      const firstInput = page.locator('.annotationLayer input[type="text"]').first();
      await firstInput.click();
      await firstInput.fill('Test Before');
      const valueBefore = await firstInput.inputValue();
      console.log('✅ Successfully typed in field before fit-width:', valueBefore);
    } catch (error) {
      console.log('❌ Failed to interact with field before fit-width:', error.message);
    }
  }
  
  // Click fit width button
  console.log('\nClicking Fit Width button...');
  await page.locator('button:has-text("Width")').click();
  await page.waitForTimeout(3000);  // Wait for resize and re-render
  
  console.log('Testing form field interaction AFTER fit-width...');
  
  // Try to click and type in a form field after fit-width
  const afterFields = await page.locator('.annotationLayer input[type="text"]').count();
  console.log('Text input fields found after fit-width:', afterFields);
  
  if (afterFields > 0) {
    try {
      // Find a different text input field to test
      const secondInput = page.locator('.annotationLayer input[type="text"]').nth(1);
      await secondInput.click();
      await secondInput.fill('Test After');
      const valueAfter = await secondInput.inputValue();
      console.log('✅ Successfully typed in field after fit-width:', valueAfter);
      
      // Test clicking on a few more fields to verify they're all properly aligned
      const testFields = Math.min(5, afterFields);
      let successfulClicks = 0;
      
      for (let i = 0; i < testFields; i++) {
        try {
          const testField = page.locator('.annotationLayer input[type="text"]').nth(i);
          const fieldBox = await testField.boundingBox();
          if (fieldBox && fieldBox.width > 0 && fieldBox.height > 0) {
            await testField.click();
            successfulClicks++;
          }
        } catch (e) {
          // Skip this field if it's not clickable
        }
      }
      
      console.log(`✅ Successfully clicked ${successfulClicks}/${testFields} form fields`);
      
      if (successfulClicks === testFields) {
        console.log('🎉 ALL FORM FIELDS ARE PROPERLY ALIGNED AND CLICKABLE!');
      } else {
        console.log('⚠️  Some form fields may have alignment issues');
      }
      
    } catch (error) {
      console.log('❌ Failed to interact with field after fit-width:', error.message);
      console.log('This indicates form fields are misaligned after scaling');
    }
  }
  
  await browser.close();
})().catch(console.error);