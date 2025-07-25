const { chromium } = require('playwright');

async function testEditFunctionality() {
  console.log('🎭 Testing Edit Button Functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔧 Creating a test element to edit...');
    
    // Click Text Area tool
    await page.click('button:has-text("Text Area")');
    console.log('✅ Text Area tool selected');
    
    await page.waitForTimeout(1000);
    
    // Check for placement instruction
    const placementInstruction = await page.$('text=Click to place');
    if (placementInstruction) {
      console.log('✅ Placement instruction appeared');
      
      // Click on PDF to place
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        await page.mouse.click(box.x + 200, box.y + 200);
        console.log('✅ Clicked to place element');
        
        await page.waitForTimeout(1000);
        
        // Check if dialog opened
        const dialog = await page.$('.MuiDialog-root');
        if (dialog) {
          console.log('✅ Dialog opened');
          
          // Fill initial text
          const textInput = await page.$('textarea');
          if (textInput) {
            await textInput.fill('Original Text');
            console.log('✅ Original text filled');
            
            await page.waitForTimeout(500);
            
            // Click Add button
            const addButton = await page.$('button:has-text("Add")');
            if (addButton) {
              await addButton.click();
              console.log('✅ Element created');
              
              await page.waitForTimeout(2000);
              
              // Now test edit functionality
              console.log('\n🖊️  Testing edit functionality...');
              
              // Look for the created element
              const markupElement = await page.$('div[style*="position: absolute"]:has-text("Original Text")');
              if (markupElement) {
                console.log('✅ Created element found');
                
                // Click to select it
                await markupElement.click();
                console.log('✅ Element selected');
                
                await page.waitForTimeout(500);
                
                // Look for edit button
                const editButton = await page.$('button[title="Edit"], button:has-text("Edit"), svg[data-testid="EditIcon"]');
                if (editButton) {
                  console.log('✅ Edit button found');
                  
                  // Click edit button
                  await editButton.click();
                  console.log('✅ Edit button clicked');
                  
                  await page.waitForTimeout(1000);
                  
                  // Check if dialog reopened
                  const editDialog = await page.$('.MuiDialog-root');
                  if (editDialog) {
                    console.log('✅ Edit dialog opened');
                    
                    // Check if text is pre-filled
                    const editTextInput = await page.$('textarea');
                    if (editTextInput) {
                      const currentValue = await editTextInput.inputValue();
                      console.log('Current text value:', currentValue);
                      
                      if (currentValue === 'Original Text') {
                        console.log('✅ SUCCESS: Text is pre-filled correctly');
                        
                        // Test editing the text
                        await editTextInput.fill('Edited Text');
                        console.log('✅ Text changed to "Edited Text"');
                        
                        await page.waitForTimeout(500);
                        
                        // Click Add/Update button
                        const updateButton = await page.$('button:has-text("Add")');
                        if (updateButton) {
                          await updateButton.click();
                          console.log('✅ Update button clicked');
                          
                          await page.waitForTimeout(2000);
                          
                          // Check if element was updated
                          const updatedElement = await page.$('div[style*="position: absolute"]:has-text("Edited Text")');
                          if (updatedElement) {
                            console.log('🎉 SUCCESS: Element text was updated successfully!');
                          } else {
                            console.log('❌ FAIL: Element text was not updated');
                            
                            // Check if original element still exists
                            const originalStillExists = await page.$('div[style*="position: absolute"]:has-text("Original Text")');
                            console.log('Original element still exists:', !!originalStillExists);
                          }
                        } else {
                          console.log('❌ Update button not found');
                        }
                      } else {
                        console.log('❌ FAIL: Text is not pre-filled. Expected "Original Text", got:', currentValue);
                      }
                    } else {
                      console.log('❌ Text input not found in edit dialog');
                    }
                  } else {
                    console.log('❌ Edit dialog did not open');
                  }
                } else {
                  console.log('❌ Edit button not found');
                  
                  // Debug: list all buttons
                  const buttons = await page.$$eval('button', btns => 
                    btns.map(btn => ({
                      text: btn.textContent,
                      title: btn.title,
                      visible: !btn.hidden
                    })).filter(btn => btn.visible)
                  );
                  console.log('Available buttons:', buttons.slice(0, 10));
                }
              } else {
                console.log('❌ Created element not found');
              }
            } else {
              console.log('❌ Add button not found');
            }
          } else {
            console.log('❌ Text input not found');
          }
        } else {
          console.log('❌ Dialog did not open');
        }
      } else {
        console.log('❌ Canvas not found');
      }
    } else {
      console.log('❌ No placement instruction found');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEditFunctionality().catch(console.error);