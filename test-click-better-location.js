const { chromium } = require('playwright');

async function testClickBetterLocation() {
  console.log('🎭 Testing Click at Better Location...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for markup debug messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MarkupOverlay') || 
        text.includes('MarkupManager') || 
        text.includes('background click') ||
        text.includes('canvas click')) {
      console.log(`🔍 MARKUP: ${text}`);
    }
  });
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔧 Testing markup workflow...');
    
    // Click Text Area tool
    await page.click('button:has-text("Text Area")');
    console.log('✅ Text Area tool selected');
    
    await page.waitForTimeout(1000);
    
    // Check for placement instruction
    const placementInstruction = await page.$('text=Click to place');
    console.log('Placement instruction found:', !!placementInstruction);
    
    if (placementInstruction) {
      // Click in the main PDF area (around the center where it should be safe)
      console.log('🖱️ Clicking at safe location 600, 400...');
      await page.mouse.click(600, 400);
      
      await page.waitForTimeout(2000);
      
      // Check if dialog opened
      const dialog = await page.$('.MuiDialog-root');
      console.log('✅ Dialog opened after placement:', !!dialog);
      
      if (dialog) {
        console.log('🎉 SUCCESS: Text area dialog opened!');
        
        // Fill in some text and create the element
        const textInput = await page.$('textarea');
        if (textInput) {
          await textInput.fill('Test Element');
          console.log('✅ Text filled');
          
          const addButton = await page.$('button:has-text("Add")');
          if (addButton) {
            await addButton.click();
            console.log('✅ Element created');
            
            await page.waitForTimeout(2000);
            
            // Now test the click vs edit behavior
            console.log('\n🖱️ Testing click vs edit...');
            
            // Find the created element
            const markupElement = await page.$('div[data-annotation-element="true"]:has-text("Test Element")');
            if (markupElement) {
              console.log('✅ Created element found');
              
              // Click element directly (should only select)
              await markupElement.click();
              console.log('✅ Element clicked (should only select)');
              
              await page.waitForTimeout(1000);
              
              // Check if dialog opened (shouldn't)
              const dialogAfterClick = await page.$('.MuiDialog-root');
              if (dialogAfterClick) {
                console.log('❌ FAIL: Dialog opened when it shouldn\'t');
              } else {
                console.log('✅ SUCCESS: No dialog on element click');
              }
              
              // Look for edit button
              const editButton = await page.$('svg[data-testid="EditIcon"]');
              if (editButton) {
                console.log('✅ Edit button found, clicking...');
                await editButton.click();
                
                await page.waitForTimeout(1000);
                
                const editDialog = await page.$('.MuiDialog-root');
                if (editDialog) {
                  console.log('✅ SUCCESS: Dialog opened after edit button click');
                } else {
                  console.log('❌ FAIL: Dialog did not open after edit button click');
                }
              } else {
                console.log('❌ Edit button not found');
              }
            } else {
              console.log('❌ Created element not found');
            }
          }
        }
      } else {
        console.log('❌ Dialog did not open after safe click');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testClickBetterLocation().catch(console.error);