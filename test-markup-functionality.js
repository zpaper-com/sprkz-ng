const { chromium } = require('playwright');

async function testMarkupFunctionality() {
  console.log('🎭 Testing Markup Functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console messages
  const messages = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    messages.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔍 Checking markup toolbar visibility...');
    const markupButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Image Stamp') ||
          btn.textContent.includes('Highlight') ||
          btn.textContent.includes('Text Area') ||
          btn.textContent.includes('Date/Time')
        )
      ).map(btn => ({
        text: btn.textContent,
        disabled: btn.disabled,
        visible: !btn.hidden
      }))
    );
    
    console.log('Markup buttons found:', markupButtons.length);
    markupButtons.forEach((btn, i) => console.log(`  ${i+1}. ${btn.text} (disabled: ${btn.disabled})`));
    
    if (markupButtons.length > 0) {
      console.log('\n🧪 Testing Text Area tool...');
      
      // Click Text Area button
      await page.click('button:has-text("Text Area")');
      console.log('✅ Text Area button clicked');
      
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
          console.log('✅ Clicked to set placement');
          
          await page.waitForTimeout(1000);
          
          // Now check for dialog
          const dialog = await page.$('.MuiDialog-root');
          if (dialog) {
            console.log('✅ Dialog opened');
            
            // Fill text input - look for the multiline text field
            const textInput = await page.$('textarea, input[multiline], div[contenteditable="true"]');
            if (textInput) {
              await textInput.fill('Test markup text');
              console.log('✅ Text filled');
              
              // Wait a moment for validation
              await page.waitForTimeout(500);
              
              // Click Add button
              const addButton = await page.$('button:has-text("Add")');
              if (addButton) {
                await addButton.click();
                console.log('✅ Add button clicked');
                
                await page.waitForTimeout(2000);
                
                // Check for created markup elements
                const markupElements = await page.$$eval('div', divs => 
                  divs.filter(div => 
                    div.style.position === 'absolute' && 
                    div.textContent && 
                    div.textContent.includes('Test markup')
                  ).length
                );
                
                console.log('🎯 Markup elements created:', markupElements);
                
                if (markupElements > 0) {
                  console.log('✅ SUCCESS: Text Area markup element created');
                  
                  // Test repositioning
                  console.log('\n🖱️  Testing repositioning...');
                  const elementHandle = await page.$('div[style*="position: absolute"]:has-text("Test markup")');
                  if (elementHandle) {
                    const box = await elementHandle.boundingBox();
                    
                    // Try to drag
                    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
                    await page.mouse.down();
                    await page.mouse.move(box.x + 50, box.y + 50);
                    await page.mouse.up();
                    
                    await page.waitForTimeout(1000);
                    
                    const newBox = await elementHandle.boundingBox();
                    const moved = Math.abs(newBox.x - box.x) > 40 || Math.abs(newBox.y - box.y) > 40;
                    
                    console.log(moved ? '✅ Element repositioned successfully' : '❌ Element did not move');
                  }
                } else {
                  console.log('❌ FAIL: No markup elements created');
                }
              } else {
                console.log('❌ Add button not found');
              }
            } else {
              console.log('❌ Text input not found');
            }
          } else {
            console.log('❌ Dialog did not open after canvas click');
          }
        } else {
          console.log('❌ Canvas not found');
        }
      } else {
        console.log('❌ No placement instruction found');
      }
    }
    
    console.log('\n📋 Console errors during test:');
    if (errors.length === 0) {
      console.log('   ✅ No errors detected');
    } else {
      errors.slice(0, 5).forEach(err => console.log('   ❌', err));
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMarkupFunctionality().catch(console.error);