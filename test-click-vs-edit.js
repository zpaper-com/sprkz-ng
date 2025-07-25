const { chromium } = require('playwright');

async function testClickVsEdit() {
  console.log('🎭 Testing Click vs Edit Behavior...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔧 Creating a test element...');
    
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
      
      await page.waitForTimeout(1000);
      
      // Fill dialog and create element
      const textInput = await page.$('textarea');
      if (textInput) {
        await textInput.fill('Test Text');
        console.log('✅ Text filled');
        
        const addButton = await page.$('button:has-text("Add")');
        if (addButton) {
          await addButton.click();
          console.log('✅ Element created');
          
          await page.waitForTimeout(2000);
          
          console.log('\n🖱️ Testing element click behavior...');
          
          // Find the created element
          const markupElement = await page.$('div[style*="position: absolute"]:has-text("Test Text")');
          if (markupElement) {
            console.log('✅ Created element found');
            
            // Test 1: Click element directly (should only select, not open dialog)
            console.log('\n📋 Test 1: Click element directly...');
            await markupElement.click();
            console.log('✅ Element clicked');
            
            await page.waitForTimeout(1000);
            
            // Check if dialog opened (it shouldn't)
            const dialogAfterClick = await page.$('.MuiDialog-root');
            if (dialogAfterClick) {
              console.log('❌ FAIL: Dialog opened when it shouldn\'t have');
            } else {
              console.log('✅ SUCCESS: No dialog opened on element click');
            }
            
            // Test 2: Click edit button (should open dialog)
            console.log('\n🖊️ Test 2: Click edit button...');
            
            // Look for edit button within the selected element
            const editButton = await page.$('button[title="Edit"], svg[data-testid="EditIcon"]');
            if (editButton) {
              console.log('✅ Edit button found');
              
              await editButton.click();
              console.log('✅ Edit button clicked');
              
              await page.waitForTimeout(1000);
              
              // Check if dialog opened (it should)
              const dialogAfterEdit = await page.$('.MuiDialog-root');
              if (dialogAfterEdit) {
                console.log('✅ SUCCESS: Dialog opened after edit button click');
                
                // Verify text is pre-filled
                const editTextInput = await page.$('textarea');
                if (editTextInput) {
                  const currentValue = await editTextInput.inputValue();
                  if (currentValue === 'Test Text') {
                    console.log('✅ SUCCESS: Text is pre-filled correctly');
                  } else {
                    console.log('❌ FAIL: Text not pre-filled. Got:', currentValue);
                  }
                }
                
                // Close dialog
                const cancelButton = await page.$('button:has-text("Cancel")');
                if (cancelButton) {
                  await cancelButton.click();
                  console.log('✅ Dialog closed');
                }
              } else {
                console.log('❌ FAIL: Dialog did not open after edit button click');
              }
            } else {
              console.log('❌ Edit button not found');
              
              // Debug: show available buttons near the element
              const nearbyButtons = await page.$$eval('button, svg', elements => 
                elements.filter(el => {
                  const rect = el.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                }).map(el => ({
                  tag: el.tagName,
                  text: el.textContent || '',
                  title: el.title || '',
                  testId: el.getAttribute('data-testid') || '',
                  class: el.className || ''
                })).slice(0, 5)
              );
              console.log('Available interactive elements:', nearbyButtons);
            }
          } else {
            console.log('❌ Created element not found');
          }
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testClickVsEdit().catch(console.error);