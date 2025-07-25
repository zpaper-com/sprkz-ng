const { chromium } = require('playwright');

async function testMarkupTools() {
  console.log('🎭 Testing Markup Tools implementation...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Enable markup features in admin
    console.log('📍 Step 1: Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin');
    await page.waitForTimeout(2000);
    
    // Navigate to URL Configuration
    const urlConfigLink = await page.locator('text=URL Configuration');
    if (await urlConfigLink.count() > 0) {
      await urlConfigLink.click();
      await page.waitForTimeout(1000);
      
      // Look for makana URL configuration
      const makanaConfig = await page.locator('text=/makana').first();
      if (await makanaConfig.count() > 0) {
        console.log('📝 Found makana configuration, enabling markup features...');
        
        // Click on the makana config row to expand/edit
        await makanaConfig.click();
        await page.waitForTimeout(1000);
        
        // Look for edit button
        const editButton = await page.locator('button[aria-label*="edit"], button:has-text("Edit")').first();
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Enable markup toolbar feature (ID 15)
        const markupToolbarToggle = await page.locator('text=Markup Toolbar').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await markupToolbarToggle.count() > 0) {
          console.log('🎛️  Enabling Markup Toolbar feature...');
          await markupToolbarToggle.check();
        }
        
        // Enable image stamp feature (ID 16)
        const imageStampToggle = await page.locator('text=Markup Image Stamp').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await imageStampToggle.count() > 0) {
          console.log('🎛️  Enabling Markup Image Stamp feature...');
          await imageStampToggle.check();
        }
        
        // Enable highlight area feature (ID 17)
        const highlightToggle = await page.locator('text=Markup Highlight Area').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await highlightToggle.count() > 0) {
          console.log('🎛️  Enabling Markup Highlight Area feature...');
          await highlightToggle.check();
        }
        
        // Enable date/time stamp feature (ID 19)
        const dateTimeToggle = await page.locator('text=Markup Date/Time Stamp').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await dateTimeToggle.count() > 0) {
          console.log('🎛️  Enabling Markup Date/Time Stamp feature...');
          await dateTimeToggle.check();
        }
        
        // Enable text area feature (ID 20)
        const textAreaToggle = await page.locator('text=Markup Text Area').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await textAreaToggle.count() > 0) {
          console.log('🎛️  Enabling Markup Text Area feature...');
          await textAreaToggle.check();
        }
        
        // Save changes
        const saveButton = await page.locator('button:has-text("Save")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log('💾 Saved feature flag changes');
        }
      } else {
        console.log('⚠️  Could not find makana configuration in admin');
      }
    } else {
      console.log('⚠️  Could not find URL Configuration in admin');
    }
    
    // Step 2: Navigate to makana route and test markup toolbar
    console.log('\n📍 Step 2: Navigating to /makana to test markup features...');
    await page.goto('http://localhost:7779/makana');
    await page.waitForTimeout(5000); // Wait for PDF to load
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'playwright-output/markup-initial-state.png' });
    console.log('📸 Screenshot saved: markup-initial-state.png');
    
    // Check if markup toolbar is visible
    const markupToolbar = await page.locator('text=Markup Tools');
    const toolbarCount = await markupToolbar.count();
    
    console.log(`🔍 Markup toolbar found: ${toolbarCount}`);
    
    if (toolbarCount > 0) {
      console.log('✅ SUCCESS: Markup toolbar is visible!');
      
      // Test toolbar collapse/expand
      const collapseButton = await page.locator('button[aria-label*="expand"], button[aria-label*="collapse"]').first();
      if (await collapseButton.count() > 0) {
        console.log('🔄 Testing toolbar collapse...');
        await collapseButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'playwright-output/markup-toolbar-collapsed.png' });
        
        // Expand again
        await collapseButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Step 3: Test Image Stamp tool
      console.log('\n📍 Step 3: Testing Image Stamp tool...');
      const imageStampButton = await page.locator('text=Image Stamp');
      if (await imageStampButton.count() > 0) {
        await imageStampButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dialog opened
        const imageStampDialog = await page.locator('text=Add Image Stamp');
        if (await imageStampDialog.count() > 0) {
          console.log('✅ Image Stamp dialog opened successfully');
          
          // Select a predefined stamp
          const approvedStamp = await page.locator('text=Approved');
          if (await approvedStamp.count() > 0) {
            await approvedStamp.click();
            await page.waitForTimeout(1000);
            console.log('📌 Selected "Approved" stamp');
          }
          
          // Click Add Stamp button
          const addStampButton = await page.locator('button:has-text("Add Stamp")');
          if (await addStampButton.count() > 0) {
            await addStampButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Image Stamp tool configured');
          }
        } else {
          console.log('❌ Image Stamp dialog did not open');
        }
      } else {
        console.log('❌ Image Stamp button not found');
      }
      
      // Step 4: Test Highlight Area tool
      console.log('\n📍 Step 4: Testing Highlight Area tool...');
      const highlightButton = await page.locator('text=Highlight Area');
      if (await highlightButton.count() > 0) {
        await highlightButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dialog opened
        const highlightDialog = await page.locator('text=Highlight Area Settings');
        if (await highlightDialog.count() > 0) {
          console.log('✅ Highlight Area dialog opened successfully');
          
          // Select different color
          const blueColor = await page.locator('[style*="background-color: rgb(0, 191, 255)"]').first();
          if (await blueColor.count() > 0) {
            await blueColor.click();
            await page.waitForTimeout(500);
            console.log('🎨 Selected blue highlight color');
          }
          
          // Apply settings
          const applyButton = await page.locator('button:has-text("Apply Settings")');
          if (await applyButton.count() > 0) {
            await applyButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Highlight Area tool configured');
          }
        } else {
          console.log('❌ Highlight Area dialog did not open');
        }
      } else {
        console.log('❌ Highlight Area button not found');
      }
      
      // Step 5: Test Date/Time Stamp tool
      console.log('\n📍 Step 5: Testing Date/Time Stamp tool...');
      const dateTimeButton = await page.locator('text=Date/Time Stamp');
      if (await dateTimeButton.count() > 0) {
        await dateTimeButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dialog opened
        const dateTimeDialog = await page.locator('text=Date/Time Stamp Settings');
        if (await dateTimeDialog.count() > 0) {
          console.log('✅ Date/Time Stamp dialog opened successfully');
          
          // Select different format
          const formatSelect = await page.locator('label:has-text("Date/Time Format")').locator('..').locator('select, [role="combobox"]');
          if (await formatSelect.count() > 0) {
            await formatSelect.click();
            await page.waitForTimeout(500);
            
            // Select a different format
            const formatOption = await page.locator('text=YYYY-MM-DD HH:MM:SS');
            if (await formatOption.count() > 0) {
              await formatOption.click();
              await page.waitForTimeout(500);
              console.log('📅 Selected date format');
            }
          }
          
          // Add timestamp
          const addTimestampButton = await page.locator('button:has-text("Add Timestamp")');
          if (await addTimestampButton.count() > 0) {
            await addTimestampButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Date/Time Stamp tool configured');
          }
        } else {
          console.log('❌ Date/Time Stamp dialog did not open');
        }
      } else {
        console.log('❌ Date/Time Stamp button not found');
      }
      
      // Step 6: Test Text Area tool
      console.log('\n📍 Step 6: Testing Text Area tool...');
      const textAreaButton = await page.locator('text=Text Area');
      if (await textAreaButton.count() > 0) {
        await textAreaButton.click();
        await page.waitForTimeout(1000);
        
        // Check if dialog opened
        const textAreaDialog = await page.locator('text=Add Text Area');
        if (await textAreaDialog.count() > 0) {
          console.log('✅ Text Area dialog opened successfully');
          
          // Enter some text
          const textInput = await page.locator('textarea[placeholder*="Type your text"]');
          if (await textInput.count() > 0) {
            await textInput.fill('This is a test markup text annotation');
            await page.waitForTimeout(500);
            console.log('📝 Entered text content');
          }
          
          // Select bold formatting
          const boldButton = await page.locator('button[aria-label="bold"]');
          if (await boldButton.count() > 0) {
            await boldButton.click();
            await page.waitForTimeout(500);
            console.log('🔤 Applied bold formatting');
          }
          
          // Add text area
          const addTextButton = await page.locator('button:has-text("Add Text Area")');
          if (await addTextButton.count() > 0) {
            await addTextButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Text Area tool configured');
          }
        } else {
          console.log('❌ Text Area dialog did not open');
        }
      } else {
        console.log('❌ Text Area button not found');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'playwright-output/markup-final-state.png' });
      console.log('📸 Final screenshot saved: markup-final-state.png');
      
    } else {
      console.log('❌ ISSUE: Markup toolbar is not visible!');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'playwright-output/markup-toolbar-missing.png' });
      
      // Check console logs for errors
      console.log('📋 Checking console logs for errors...');
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`🔍 Console error: ${msg.text()}`);
        }
      });
      
      // Check for feature flag logs
      page.on('console', msg => {
        if (msg.text().includes('Feature Flags') || msg.text().includes('markup')) {
          console.log(`🎌 Feature flag log: ${msg.text()}`);
        }
      });
      
      // Reload to capture logs
      await page.reload();
      await page.waitForTimeout(3000);
    }
    
    // Step 7: Test feature flag interaction
    console.log('\n📍 Step 7: Testing feature flag behavior...');
    
    // Navigate back to admin and disable toolbar
    await page.goto('http://localhost:7779/admin');
    await page.waitForTimeout(2000);
    
    const urlConfigLinkAgain = await page.locator('text=URL Configuration');
    if (await urlConfigLinkAgain.count() > 0) {
      await urlConfigLinkAgain.click();
      await page.waitForTimeout(1000);
      
      const makanaConfigAgain = await page.locator('text=/makana').first();
      if (await makanaConfigAgain.count() > 0) {
        await makanaConfigAgain.click();
        await page.waitForTimeout(1000);
        
        const editButtonAgain = await page.locator('button[aria-label*="edit"], button:has-text("Edit")').first();
        if (await editButtonAgain.count() > 0) {
          await editButtonAgain.click();
          await page.waitForTimeout(1000);
        }
        
        // Disable markup toolbar
        const markupToolbarToggleOff = await page.locator('text=Markup Toolbar').locator('..').locator('input[type="checkbox"], [role="switch"]');
        if (await markupToolbarToggleOff.count() > 0) {
          console.log('🎛️  Disabling Markup Toolbar feature...');
          await markupToolbarToggleOff.uncheck();
        }
        
        // Save changes
        const saveButtonAgain = await page.locator('button:has-text("Save")');
        if (await saveButtonAgain.count() > 0) {
          await saveButtonAgain.click();
          await page.waitForTimeout(1000);
        }
        
        // Navigate back to makana and verify toolbar is hidden
        await page.goto('http://localhost:7779/makana');
        await page.waitForTimeout(3000);
        
        const markupToolbarDisabled = await page.locator('text=Markup Tools');
        const toolbarDisabledCount = await markupToolbarDisabled.count();
        
        console.log(`🔍 Markup toolbar found (after disable): ${toolbarDisabledCount}`);
        
        if (toolbarDisabledCount === 0) {
          console.log('✅ SUCCESS: Markup toolbar correctly hidden when feature disabled!');
        } else {
          console.log('❌ ISSUE: Markup toolbar still visible when feature should be disabled!');
        }
        
        await page.screenshot({ path: 'playwright-output/markup-toolbar-disabled.png' });
        console.log('📸 Screenshot saved: markup-toolbar-disabled.png');
      }
    }
    
    console.log('\n🎉 Markup tools testing completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'playwright-output/markup-error.png' });
    console.log('📸 Error screenshot saved: markup-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testMarkupTools().catch(console.error);