const { chromium } = require('playwright');

async function testConsoleDebug() {
  console.log('🎭 Testing Console Debug...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages including our debug logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`📄 ${type.toUpperCase()}: ${text}`);
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
    
    // Click on PDF to place
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      console.log(`📏 Canvas bounds: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
      
      await page.mouse.click(box.x + 200, box.y + 200);
      console.log(`✅ Clicked at canvas position: ${box.x + 200}, ${box.y + 200}`);
      
      await page.waitForTimeout(3000);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConsoleDebug().catch(console.error);