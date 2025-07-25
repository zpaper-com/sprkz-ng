const { chromium } = require('playwright');

async function testSignatureEdit() {
  console.log('🎭 Testing Signature Edit Pre-fill...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n✍️ Creating signature...');
    
    // Click signature tool
    await page.click('button:has-text("Signature")');
    await page.waitForTimeout(1000);
    
    // Click to place signature
    await page.mouse.click(600, 400);
    await page.waitForTimeout(2000);
    
    // Switch to Draw Signature tab
    await page.click('button:has-text("Draw Signature")');
    await page.waitForTimeout(1000);
    
    // Draw on canvas
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      console.log('✅ Canvas found, drawing signature...');
      
      // Draw a simple signature
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 80);
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
      
      // Save signature  
      await page.click('button:has-text("Save Signature")');
      console.log('✅ Signature saved');
      
      await page.waitForTimeout(3000);
      
      // Find the signature element
      const signatureElements = await page.$$('div[data-annotation-element="true"]');
      console.log(`📋 Found ${signatureElements.length} markup elements`);
      
      if (signatureElements.length > 0) {
        // Click the last element (should be our signature)
        const signatureElement = signatureElements[signatureElements.length - 1];
        await signatureElement.click();
        console.log('✅ Signature element selected');
        
        await page.waitForTimeout(1000);
        
        // Look for edit button
        const editButton = await page.$('svg[data-testid="EditIcon"]');
        if (editButton) {
          console.log('✅ Edit button found');
          
          await editButton.click();
          await page.waitForTimeout(2000);
          
          // Check if signature dialog opened
          const editDialog = await page.$('.MuiDialog-root');
          if (editDialog) {
            console.log('✅ Signature edit dialog opened');
            
            // Check if canvas has signature data (not empty)
            const editCanvas = await page.$('canvas');
            if (editCanvas) {
              const hasSignatureData = await page.evaluate((canvas) => {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // Check if any pixel is not transparent (alpha > 0)
                for (let i = 3; i < imageData.data.length; i += 4) {
                  if (imageData.data[i] > 0) return true;
                }
                return false;
              }, editCanvas);
              
              console.log('🖼️ Canvas has signature data:', hasSignatureData);
              
              if (hasSignatureData) {
                console.log('🎉 SUCCESS: Signature edit pre-fill is working!');
                console.log('✅ Signature edit pre-fill: PASS');
              } else {
                console.log('❌ FAIL: Signature canvas is empty');
              }
            } else {
              console.log('❌ Edit canvas not found');
            }
            
            // Close dialog
            await page.click('button:has-text("Cancel")');
          } else {
            console.log('❌ Signature edit dialog did not open');
          }
        } else {
          console.log('❌ Edit button not found');
        }
      } else {
        console.log('❌ No markup elements found');
      }
    } else {
      console.log('❌ Canvas not found');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSignatureEdit().catch(console.error);