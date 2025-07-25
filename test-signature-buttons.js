const { chromium } = require('playwright');

async function testSignatureButtons() {
  console.log('🎭 Testing Signature Dialog Buttons...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/tremfya');
    await page.waitForTimeout(8000);
    
    // Click signature tool
    await page.click('button:has-text("Signature")');
    await page.waitForTimeout(1000);
    
    // Click to place signature
    await page.mouse.click(600, 400);
    await page.waitForTimeout(2000);
    
    // Draw on canvas
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 70);
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
      
      // Check what buttons are available
      const buttons = await page.$$eval('button', btns => 
        btns.map(btn => ({
          text: btn.textContent?.trim(),
          visible: !btn.hidden && btn.offsetWidth > 0,
          disabled: btn.disabled
        })).filter(btn => btn.visible && btn.text)
      );
      
      console.log('Available buttons:', buttons);
      
      // Try common button variations
      const saveVariations = ['Save', 'Save Signature', 'Add', 'Create', 'Done'];
      for (const text of saveVariations) {
        const button = await page.$(`button:has-text("${text}")`);
        if (button) {
          console.log(`✅ Found button: "${text}"`);
          await button.click();
          break;
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSignatureButtons().catch(console.error);