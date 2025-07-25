const { chromium } = require('playwright');

async function testEditPreFillSimple() {
  console.log('🎭 Testing Edit Pre-fill (Simple Check)...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Checking if server is running...');
    await page.goto('http://localhost:7779/tremfya', { timeout: 5000 });
    
    console.log('✅ Server is running, testing edit workflow...');
    await page.waitForTimeout(8000);
    
    // Quick test: Create text area and verify edit button appears
    await page.click('button:has-text("Text Area")');
    await page.waitForTimeout(1000);
    
    await page.mouse.click(600, 300);
    await page.waitForTimeout(1000);
    
    // Fill and create
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('Test Edit Content');
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(2000);
      
      // Find element and click to select
      const element = await page.$('div[data-annotation-element="true"]:has-text("Test Edit Content")');
      if (element) {
        await element.click();
        await page.waitForTimeout(500);
        
        // Look for edit button
        const editButton = await page.$('svg[data-testid="EditIcon"]');
        if (editButton) {
          console.log('✅ Edit button found');
          
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Check if dialog opened and text is pre-filled
          const editDialog = await page.$('.MuiDialog-root');
          if (editDialog) {
            const editTextarea = await page.$('textarea');
            if (editTextarea) {
              const value = await editTextarea.inputValue();
              console.log('📝 Edit dialog text value:', value);
              
              if (value === 'Test Edit Content') {
                console.log('🎉 SUCCESS: Edit dialog pre-fill is working!');
                console.log('✅ Text area edit pre-fill: PASS');
              } else {
                console.log('❌ FAIL: Text not pre-filled correctly');
              }
            }
          } else {
            console.log('❌ Edit dialog did not open');
          }
        } else {
          console.log('❌ Edit button not found');
        }
      } else {
        console.log('❌ Created element not found');
      }
    }
    
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.log('❌ Server not running on localhost:7779');
      console.log('💡 Please start the development server first');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  } finally {
    await browser.close();
  }
}

testEditPreFillSimple().catch(console.error);