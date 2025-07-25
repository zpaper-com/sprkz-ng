const { chromium } = require('playwright');

async function testEditDialogPrefill() {
  console.log('🎭 Testing Edit Dialog Pre-fill for All Markup Types...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    // Test Text Area (most comprehensive test)
    console.log('\n📝 Testing Text Area edit pre-fill...');
    await testTextAreaEdit(page);
    
    // Test Signature
    console.log('\n✍️ Testing Signature edit pre-fill...');
    await testSignatureEdit(page);
    
    // Test Date/Time Stamp  
    console.log('\n📅 Testing Date/Time Stamp edit pre-fill...');
    await testDateTimeEdit(page);
    
    console.log('\n🎉 All edit dialog pre-fill tests completed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

async function testTextAreaEdit(page) {
  // Create a text area element
  await page.click('button:has-text("Text Area")');
  await page.waitForTimeout(1000);
  
  await page.mouse.click(600, 300);
  await page.waitForTimeout(1000);
  
  // Fill with specific values
  const textarea = await page.$('textarea');
  await textarea.fill('Original Text Content');
  
  // Change font size
  const fontSizeSlider = await page.$('input[type="range"]');
  if (fontSizeSlider) {
    await fontSizeSlider.fill('18');
  }
  
  // Change color to red
  const colorInput = await page.$('input[type="color"]');
  if (colorInput) {
    await colorInput.fill('#ff0000');
  }
  
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(2000);
  
  // Find and click the created element to select it
  const textElement = await page.$('div[data-annotation-element="true"]:has-text("Original Text Content")');
  if (textElement) {
    await textElement.click();
    await page.waitForTimeout(500);
    
    // Click edit button
    const editButton = await page.$('svg[data-testid="EditIcon"]');
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check if dialog opened with pre-filled values
      const editDialog = await page.$('.MuiDialog-root');
      if (editDialog) {
        // Check text is pre-filled
        const editTextarea = await page.$('textarea');
        const textValue = await editTextarea.inputValue();
        
        // Check font size (look for "18" in the slider area)
        const fontSizeDisplay = await page.$('text=18');
        
        console.log('✅ Text Area edit dialog opened');
        console.log('📝 Pre-filled text:', textValue);
        console.log('🎨 Font size preserved:', !!fontSizeDisplay);
        
        if (textValue === 'Original Text Content') {
          console.log('✅ SUCCESS: Text area pre-fill working correctly');
        } else {
          console.log('❌ FAIL: Text not pre-filled correctly');
        }
        
        // Close dialog
        await page.click('button:has-text("Cancel")');
      }
    }
  }
}

async function testSignatureEdit(page) {
  // Create a signature element  
  await page.click('button:has-text("Signature")');
  await page.waitForTimeout(1000);
  
  await page.mouse.click(700, 350);
  await page.waitForTimeout(1000);
  
  // Draw a simple signature on canvas
  const canvas = await page.$('canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    
    // Draw a simple line signature
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 80);
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.up();
    
    await page.waitForTimeout(500);
    
    // Save signature
    await page.click('button:has-text("Save Signature")');
    await page.waitForTimeout(2000);
    
    // Find and test edit
    const signatureElements = await page.$$('div[data-annotation-element="true"]');
    if (signatureElements.length > 1) { // Should have text area + signature
      const signatureElement = signatureElements[signatureElements.length - 1]; // Get the last one (signature)
      await signatureElement.click();
      await page.waitForTimeout(500);
      
      const editButton = await page.$('svg[data-testid="EditIcon"]');
      if (editButton) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Check if signature dialog opened and canvas has the signature
        const editDialog = await page.$('.MuiDialog-root');
        if (editDialog) {
          console.log('✅ Signature edit dialog opened');
          
          // Check if canvas is not empty (has signature data)
          const editCanvas = await page.$('canvas');
          if (editCanvas) {
            const canvasData = await page.evaluate((canvas) => {
              const ctx = canvas.getContext('2d');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              return imageData.data.some(pixel => pixel !== 0);
            }, editCanvas);
            
            console.log('✅ Canvas has signature data:', canvasData);
            if (canvasData) {
              console.log('✅ SUCCESS: Signature pre-fill working correctly');
            } else {
              console.log('❌ FAIL: Signature not pre-filled');
            }
          }
          
          // Close dialog
          await page.click('button:has-text("Cancel")');
        }
      }
    }
  }
}

async function testDateTimeEdit(page) {
  // Create a date/time stamp
  await page.click('button:has-text("Date/Time")');
  await page.waitForTimeout(1000);
  
  await page.mouse.click(800, 400);
  await page.waitForTimeout(1000);
  
  // Select a specific format
  const formatSelect = await page.$('div:has-text("Format") + div select');
  if (formatSelect) {
    await formatSelect.selectOption('yyyy-MM-dd HH:mm');
  }
  
  await page.click('button:has-text("Add")');
  await page.waitForTimeout(2000);
  
  // Find and test edit
  const dateElements = await page.$$('div[data-annotation-element="true"]');
  if (dateElements.length > 2) { // Should have text area + signature + date/time
    const dateElement = dateElements[dateElements.length - 1]; // Get the last one
    await dateElement.click();
    await page.waitForTimeout(500);
    
    const editButton = await page.$('svg[data-testid="EditIcon"]');
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Check if date/time dialog opened with correct format
      const editDialog = await page.$('.MuiDialog-root');
      if (editDialog) {
        console.log('✅ Date/Time edit dialog opened');
        
        // Check if format is pre-selected (look for the value in dropdown)
        const selectedFormat = await page.$eval('select', el => el.value).catch(() => null);
        console.log('📅 Pre-selected format:', selectedFormat);
        
        if (selectedFormat === 'yyyy-MM-dd HH:mm') {
          console.log('✅ SUCCESS: Date/Time format pre-fill working correctly');
        } else {
          console.log('❌ FAIL: Date/Time format not pre-filled correctly');
        }
        
        // Close dialog
        await page.click('button:has-text("Cancel")');
      }
    }
  }
}

testEditDialogPrefill().catch(console.error);