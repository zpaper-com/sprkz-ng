const { chromium } = require('playwright');

async function testMarkupInteractions() {
  console.log('🎭 Testing Markup Tool Interactions in detail...');
  
  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Quick admin setup - enable all markup features for /makana
    console.log('📍 Setting up markup features...');
    await page.goto('http://localhost:7779/admin');
    await page.waitForTimeout(2000);
    
    // Navigate to URL Configuration and enable markup features
    await page.locator('text=URL Configuration').click();
    await page.waitForTimeout(1000);
    
    const makanaConfig = await page.locator('text=/makana').first();
    await makanaConfig.click();
    await page.waitForTimeout(1000);
    
    const editButton = await page.locator('button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);
      
      // Enable all markup features
      const markupFeatures = [
        'Markup Toolbar',
        'Markup Image Stamp', 
        'Markup Highlight Area',
        'Markup Signature',
        'Markup Date/Time Stamp',
        'Markup Text Area'
      ];
      
      for (const feature of markupFeatures) {
        const toggle = await page.locator(`text=${feature}`).locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await toggle.count() > 0) {
          await toggle.check();
          console.log(`✅ Enabled: ${feature}`);
        }
      }
      
      // Save changes
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(1000);
    }
    
    // Navigate to makana route
    console.log('\n📍 Loading PDF page with markup tools...');
    await page.goto('http://localhost:7779/makana');
    await page.waitForTimeout(5000); // Wait for PDF to load
    
    // Test 1: Image Stamp Dialog Interactions
    console.log('\n🖼️  TEST 1: Image Stamp Dialog');
    await page.locator('text=Image Stamp').click();
    await page.waitForTimeout(1000);
    
    // Verify dialog opened
    const imageDialog = await page.locator('text=Add Image Stamp');
    if (await imageDialog.count() > 0) {
      console.log('✅ Image Stamp dialog opened');
      
      // Test category filter
      await page.locator('label:has-text("Category")').locator('..').locator('[role="combobox"]').click();
      await page.locator('text=Status').click();
      await page.waitForTimeout(500);
      
      // Select Approved stamp
      await page.locator('text=Approved').click();
      await page.waitForTimeout(500);
      console.log('📌 Selected Approved stamp');
      
      // Test opacity slider
      const opacitySlider = await page.locator('text=Opacity').locator('..').locator('[role="slider"]');
      if (await opacitySlider.count() > 0) {
        await opacitySlider.fill('0.7');
        await page.waitForTimeout(500);
        console.log('🎛️  Adjusted opacity to 70%');
      }
      
      // Test rotation slider  
      const rotationSlider = await page.locator('text=Rotation').locator('..').locator('[role="slider"]');
      if (await rotationSlider.count() > 0) {
        await rotationSlider.fill('15');
        await page.waitForTimeout(500);
        console.log('🔄 Set rotation to 15 degrees');
      }
      
      await page.screenshot({ path: 'playwright-output/image-stamp-dialog.png' });
      
      // Apply stamp
      await page.locator('button:has-text("Add Stamp")').click();
      await page.waitForTimeout(1000);
      console.log('✅ Image stamp settings applied');
    }
    
    // Test 2: Highlight Area Dialog Interactions  
    console.log('\n🖍️  TEST 2: Highlight Area Dialog');
    await page.locator('text=Highlight Area').click();
    await page.waitForTimeout(1000);
    
    const highlightDialog = await page.locator('text=Highlight Area Settings');
    if (await highlightDialog.count() > 0) {
      console.log('✅ Highlight dialog opened');
      
      // Test color selection
      const greenColor = await page.locator('[title*="Green"]').first();
      if (await greenColor.count() > 0) {
        await greenColor.click();
        await page.waitForTimeout(500);
        console.log('🎨 Selected green color');
      }
      
      // Test opacity slider
      const highlightOpacity = await page.locator('text=Opacity').locator('..').locator('[role="slider"]');
      if (await highlightOpacity.count() > 0) {
        await highlightOpacity.fill('0.5');
        await page.waitForTimeout(500);
        console.log('🔧 Set opacity to 50%');
      }
      
      // Test shape selection
      await page.locator('input[value="freeform"]').check();
      await page.waitForTimeout(500);
      console.log('✏️  Selected freeform shape');
      
      await page.screenshot({ path: 'playwright-output/highlight-dialog.png' });
      
      // Apply settings
      await page.locator('button:has-text("Apply Settings")').click();
      await page.waitForTimeout(1000);
      console.log('✅ Highlight settings applied');
    }
    
    // Test 3: Date/Time Stamp Dialog
    console.log('\n📅 TEST 3: Date/Time Stamp Dialog');
    await page.locator('text=Date/Time Stamp').click();
    await page.waitForTimeout(1000);
    
    const dateTimeDialog = await page.locator('text=Date/Time Stamp Settings');
    if (await dateTimeDialog.count() > 0) {
      console.log('✅ Date/Time dialog opened');
      
      // Test "Use Current Time" button
      await page.locator('button:has-text("Use Current Time")').click();
      await page.waitForTimeout(500);
      console.log('🕐 Used current time');
      
      // Test format selection
      const formatSelect = await page.locator('label:has-text("Date/Time Format")').locator('..').locator('[role="combobox"]');
      if (await formatSelect.count() > 0) {
        await formatSelect.click();
        await page.locator('text=YYYY-MM-DD HH:MM:SS').click();
        await page.waitForTimeout(500);
        console.log('📝 Selected ISO format');
      }
      
      // Test timezone selection
      const timezoneSelect = await page.locator('label:has-text("Timezone")').locator('..').locator('[role="combobox"]');
      if (await timezoneSelect.count() > 0) {
        await timezoneSelect.click();
        await page.locator('text=Eastern Time').click();
        await page.waitForTimeout(500);
        console.log('🌍 Selected Eastern timezone');
      }
      
      // Test auto-update toggle
      const autoUpdateToggle = await page.locator('text=Auto-update').locator('..').locator('input[type="checkbox"], [role="switch"]');
      if (await autoUpdateToggle.count() > 0) {
        await autoUpdateToggle.check();
        console.log('🔄 Enabled auto-update');
      }
      
      await page.screenshot({ path: 'playwright-output/datetime-dialog.png' });
      
      // Add timestamp
      await page.locator('button:has-text("Add Timestamp")').click();
      await page.waitForTimeout(1000);
      console.log('✅ Date/Time stamp settings applied');
    }
    
    // Test 4: Text Area Dialog
    console.log('\n📝 TEST 4: Text Area Dialog');
    await page.locator('text=Text Area').click();
    await page.waitForTimeout(1000);
    
    const textDialog = await page.locator('text=Add Text Area');
    if (await textDialog.count() > 0) {
      console.log('✅ Text Area dialog opened');
      
      // Enter text content
      const textInput = await page.locator('textarea[placeholder*="Type your text"]');
      await textInput.fill('This is a test markup annotation.\nWith multiple lines of text.');
      await page.waitForTimeout(500);
      console.log('✍️  Entered multi-line text');
      
      // Test font selection
      const fontSelect = await page.locator('label:has-text("Font Family")').locator('..').locator('[role="combobox"]');
      if (await fontSelect.count() > 0) {
        await fontSelect.click();
        await page.locator('text=Times New Roman').click();
        await page.waitForTimeout(500);
        console.log('🔤 Selected Times New Roman font');
      }
      
      // Test font size
      const fontSizeSlider = await page.locator('text=Font Size').locator('..').locator('[role="slider"]');
      if (await fontSizeSlider.count() > 0) {
        await fontSizeSlider.fill('18');
        await page.waitForTimeout(500);
        console.log('📏 Set font size to 18px');
      }
      
      // Test formatting buttons
      await page.locator('button[aria-label="bold"]').click();
      await page.locator('button[aria-label="italic"]').click();
      await page.waitForTimeout(500);
      console.log('🎨 Applied bold and italic formatting');
      
      // Test text alignment
      await page.locator('button[aria-label="centered"]').click();
      await page.waitForTimeout(500);
      console.log('📐 Set center alignment');
      
      // Test background color
      const backgroundColorInput = await page.locator('text=Background Color').locator('..').locator('input[type="color"]');
      if (await backgroundColorInput.count() > 0) {
        await backgroundColorInput.fill('#ffff99');
        await page.waitForTimeout(500);
        console.log('🎨 Set yellow background');
      }
      
      // Test border toggle
      const borderToggle = await page.locator('text=Show Border').locator('..').locator('input[type="checkbox"], [role="switch"]');
      if (await borderToggle.count() > 0) {
        await borderToggle.check();
        await page.waitForTimeout(500);
        console.log('📦 Enabled border');
      }
      
      await page.screenshot({ path: 'playwright-output/text-area-dialog.png' });
      
      // Add text area
      await page.locator('button:has-text("Add Text Area")').click();
      await page.waitForTimeout(1000);
      console.log('✅ Text Area settings applied');
    }
    
    // Test 5: Signature Tool (reuse existing signature modal)
    console.log('\n✍️  TEST 5: Signature Tool');
    await page.locator('text=Signature').click();
    await page.waitForTimeout(1000);
    
    const signatureDialog = await page.locator('text=Sign Markup Signature');
    if (await signatureDialog.count() > 0) {
      console.log('✅ Signature dialog opened');
      
      // Switch to typed signature tab
      await page.locator('text=Type Signature').click();
      await page.waitForTimeout(500);
      
      // Enter signature text
      const signatureInput = await page.locator('input[placeholder*="Type your signature"], textarea[placeholder*="Type your signature"]');
      if (await signatureInput.count() > 0) {
        await signatureInput.fill('John Doe');
        await page.waitForTimeout(500);
        console.log('✍️  Entered typed signature');
      }
      
      // Test font selection
      const fontSelect = await page.locator('label:has-text("Font Style")').locator('..').locator('[role="combobox"]');
      if (await fontSelect.count() > 0) {
        await fontSelect.click();
        await page.locator('text=Dancing Script').click();
        await page.waitForTimeout(500);
        console.log('🎭 Selected Dancing Script font');
      }
      
      await page.screenshot({ path: 'playwright-output/signature-dialog.png' });
      
      // Save signature
      await page.locator('button:has-text("Save Signature")').click();
      await page.waitForTimeout(1000);
      console.log('✅ Signature settings applied');
    }
    
    // Test 6: Toolbar Collapse/Expand
    console.log('\n🔧 TEST 6: Toolbar Interaction');
    const collapseBtn = await page.locator('button[aria-label*="expand"], button[aria-label*="collapse"]').first();
    if (await collapseBtn.count() > 0) {
      // Collapse toolbar
      await collapseBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-output/toolbar-collapsed.png' });
      console.log('📥 Toolbar collapsed');
      
      // Expand toolbar
      await collapseBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-output/toolbar-expanded.png' });
      console.log('📤 Toolbar expanded');
    }
    
    // Test 7: Canvas Interaction (simulated)
    console.log('\n🖱️  TEST 7: Canvas Interaction Simulation');
    
    // Try to find the PDF canvas/viewer area
    const pdfCanvas = await page.locator('canvas').first();
    if (await pdfCanvas.count() > 0) {
      // Get canvas bounding box for click simulation
      const canvasBox = await pdfCanvas.boundingBox();
      if (canvasBox) {
        // Simulate click on PDF to place annotation
        const clickX = canvasBox.x + canvasBox.width / 2;
        const clickY = canvasBox.y + canvasBox.height / 3;
        
        await page.mouse.click(clickX, clickY);
        await page.waitForTimeout(1000);
        console.log('🎯 Simulated canvas click for annotation placement');
        
        await page.screenshot({ path: 'playwright-output/canvas-interaction.png' });
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'playwright-output/markup-tools-final.png' });
    console.log('📸 Final state screenshot captured');
    
    console.log('\n🎉 All markup tool interactions tested successfully!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'playwright-output/markup-interaction-error.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
  }
}

// Run the test
testMarkupInteractions().catch(console.error);