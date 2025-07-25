const { chromium } = require('playwright');

async function testSignatureDebug() {
  console.log('🎭 Testing Signature Debug...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/tremfya');
    await page.waitForTimeout(8000);
    
    console.log('✅ Page loaded');
    
    // Click signature tool
    await page.click('button:has-text("Signature")');
    console.log('✅ Signature tool clicked');
    await page.waitForTimeout(1000);
    
    // Check if placement instruction appears
    const placementInstruction = await page.$('text=Click to place');
    console.log('📍 Placement instruction visible:', !!placementInstruction);
    
    // Click to place signature
    await page.mouse.click(600, 400);
    console.log('✅ Clicked to place signature');
    await page.waitForTimeout(3000);
    
    // Check if any dialog opened
    const dialog = await page.$('.MuiDialog-root');
    console.log('📋 Dialog opened:', !!dialog);
    
    if (dialog) {
      // Check what's in the dialog
      const dialogTitle = await page.$eval('.MuiDialog-root h2', el => el.textContent).catch(() => 'No title');
      console.log('📝 Dialog title:', dialogTitle);
      
      // Check for tabs
      const tabs = await page.$$eval('.MuiTab-root', tabs => tabs.map(tab => tab.textContent)).catch(() => []);
      console.log('📑 Dialog tabs:', tabs);
      
      // Check all buttons in dialog
      const dialogButtons = await page.$$eval('.MuiDialog-root button', btns => 
        btns.map(btn => btn.textContent?.trim()).filter(text => text)
      );
      console.log('🔘 Dialog buttons:', dialogButtons);
      
      // Check for canvas
      const canvas = await page.$('.MuiDialog-root canvas');
      console.log('🖼️ Canvas in dialog:', !!canvas);
      
    } else {
      console.log('❌ No dialog opened - signature modal not working');
      
      // Check if any elements were created
      const markupElements = await page.$$('div[data-annotation-element="true"]');
      console.log('📋 Markup elements on page:', markupElements.length);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSignatureDebug().catch(console.error);