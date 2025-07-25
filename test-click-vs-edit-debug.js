const { chromium } = require('playwright');

async function testClickVsEditDebug() {
  console.log('🎭 Testing Click vs Edit Behavior (Debug)...');
  
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
    
    // Check for placement instruction
    const placementInstruction = await page.$('text=Click to place');
    console.log('Placement instruction found:', !!placementInstruction);
    
    if (placementInstruction) {
      // Click on PDF to place
      const canvas = await page.$('canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        await page.mouse.click(box.x + 200, box.y + 200);
        console.log('✅ Clicked to place element at', box.x + 200, box.y + 200);
        
        await page.waitForTimeout(2000);
        
        // Check if dialog opened
        const dialog = await page.$('.MuiDialog-root');
        console.log('Dialog opened after placement:', !!dialog);
        
        if (dialog) {
          // Fill dialog and create element
          const textInput = await page.$('textarea');
          if (textInput) {
            await textInput.fill('Test Text for Click vs Edit');
            console.log('✅ Text filled');
            
            await page.waitForTimeout(500);
            
            const addButton = await page.$('button:has-text("Add")');
            if (addButton) {
              await addButton.click();
              console.log('✅ Add button clicked');
              
              await page.waitForTimeout(3000);
              
              // Check if element was created
              const allAbsoluteElements = await page.$$eval('div[style*="position: absolute"]', divs => 
                divs.map(div => ({
                  text: div.textContent?.trim() || '',
                  style: div.style.cssText,
                  hasText: div.textContent?.includes('Test Text') || false
                })).filter(el => el.text || el.hasText)
              );
              console.log('Absolute elements found:', allAbsoluteElements.length);
              allAbsoluteElements.forEach((el, i) => console.log(`  ${i+1}:`, el));
              
              // Look specifically for our element
              const markupElement = await page.$('div:has-text("Test Text for Click vs Edit")');
              console.log('Markup element found:', !!markupElement);
              
              if (markupElement) {
                console.log('\n🖱️ Testing element click behavior...');
                
                // Test 1: Click element directly
                console.log('\n📋 Test 1: Click element directly...');
                await markupElement.click();
                console.log('✅ Element clicked');
                
                await page.waitForTimeout(1000);
                
                // Check if dialog opened (it shouldn't)
                const dialogAfterClick = await page.$('.MuiDialog-root');
                if (dialogAfterClick) {
                  console.log('❌ FAIL: Dialog opened when clicking element');
                } else {
                  console.log('✅ SUCCESS: No dialog opened on element click');
                }
                
                // Test 2: Look for edit button
                console.log('\n🖊️ Test 2: Looking for edit button...');
                
                // Check if element is selected (should show controls)
                const editButtons = await page.$$eval('button, svg', elements => 
                  elements.filter(el => {
                    const title = el.title || '';
                    const testId = el.getAttribute('data-testid') || '';
                    const text = el.textContent || '';
                    return title.includes('Edit') || 
                           testId.includes('Edit') || 
                           text.includes('Edit') ||
                           testId === 'EditIcon';
                  }).map(el => ({
                    tag: el.tagName,
                    title: el.title,
                    testId: el.getAttribute('data-testid'),
                    text: el.textContent,
                    visible: !el.hidden && el.offsetWidth > 0
                  }))
                );
                console.log('Edit-related elements:', editButtons);
                
                if (editButtons.length > 0) {
                  // Try to click the first visible edit element
                  const editButton = await page.$('svg[data-testid="EditIcon"], button[title="Edit"]');
                  if (editButton) {
                    console.log('✅ Edit button found, clicking...');
                    await editButton.click();
                    await page.waitForTimeout(1000);
                    
                    // Check if dialog opened
                    const editDialog = await page.$('.MuiDialog-root');
                    if (editDialog) {
                      console.log('✅ SUCCESS: Dialog opened after edit button click');
                    } else {
                      console.log('❌ FAIL: Dialog did not open after edit button click');
                    }
                  }
                }
              } else {
                console.log('❌ Created element not found');
              }
            } else {
              console.log('❌ Add button not found');
            }
          } else {
            console.log('❌ Text input not found in dialog');
          }
        } else {
          console.log('❌ Dialog did not open after placement');
        }
      } else {
        console.log('❌ Canvas not found');
      }
    } else {
      console.log('❌ No placement instruction - markup may not be working');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

testClickVsEditDebug().catch(console.error);