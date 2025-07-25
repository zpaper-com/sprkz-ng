const { chromium } = require('playwright');

async function testDragFunctionality() {
  console.log('🎭 Testing Drag Functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    // First, let's try to create a text area element to test drag with
    console.log('\n🔧 Setting up test element...');
    
    // Click Text Area tool
    await page.click('button:has-text("Text Area")');
    console.log('✅ Text Area tool selected');
    
    await page.waitForTimeout(1000);
    
    // Check if placement instruction appears
    const placementVisible = await page.$('text=Click to place');
    if (placementVisible) {
      console.log('✅ Placement instruction appeared');
      
      // Click on PDF to place element
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
          
          // Fill text
          const textInput = await page.$('textarea');
          if (textInput) {
            await textInput.fill('Test Drag Element');
            await page.waitForTimeout(500);
            
            // Click Add
            const addButton = await page.$('button:has-text("Add")');
            if (addButton) {
              await addButton.click();
              console.log('✅ Element created');
              
              await page.waitForTimeout(2000);
              
              // Now test drag functionality
              console.log('\n🖱️  Testing drag functionality...');
              
              // Look for the created element
              const markupElement = await page.$('div[style*="position: absolute"]:has-text("Test Drag Element")');
              if (markupElement) {
                console.log('✅ Markup element found');
                
                // Click to select it first
                await markupElement.click();
                console.log('✅ Element selected');
                
                await page.waitForTimeout(500);
                
                // Look for the drag handle (DragIcon)
                const dragHandle = await page.$('svg[data-testid="DragIndicatorIcon"], .MuiSvgIcon-root:has-text("drag_indicator")');
                if (dragHandle) {
                  console.log('✅ Drag handle found');
                  
                  // Get initial position
                  const initialBox = await markupElement.boundingBox();
                  console.log('Initial position:', { x: initialBox.x, y: initialBox.y });
                  
                  // Drag the handle
                  const handleBox = await dragHandle.boundingBox();
                  await page.mouse.move(handleBox.x + handleBox.width/2, handleBox.y + handleBox.height/2);
                  await page.mouse.down();
                  await page.mouse.move(handleBox.x + 100, handleBox.y + 50);
                  await page.mouse.up();
                  
                  console.log('✅ Drag operation completed');
                  
                  await page.waitForTimeout(1000);
                  
                  // Check new position
                  const finalBox = await markupElement.boundingBox();
                  console.log('Final position:', { x: finalBox.x, y: finalBox.y });
                  
                  const moved = Math.abs(finalBox.x - initialBox.x) > 50 || Math.abs(finalBox.y - initialBox.y) > 25;
                  
                  if (moved) {
                    console.log('🎉 SUCCESS: Element repositioned successfully!');
                    console.log(`Moved by: x=${finalBox.x - initialBox.x}, y=${finalBox.y - initialBox.y}`);
                  } else {
                    console.log('❌ FAIL: Element did not move');
                  }
                } else {
                  console.log('❌ Drag handle not found');
                  
                  // List all svg elements for debugging
                  const svgElements = await page.$$eval('svg', svgs => 
                    svgs.map(svg => ({
                      className: svg.className.baseVal || svg.className,
                      testId: svg.getAttribute('data-testid'),
                      innerHTML: svg.innerHTML.substring(0, 100)
                    }))
                  );
                  console.log('SVG elements found:', svgElements.slice(0, 5));
                }
              } else {
                console.log('❌ Markup element not found after creation');
              }
            }
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

testDragFunctionality().catch(console.error);