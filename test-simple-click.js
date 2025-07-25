const { chromium } = require('playwright');

async function testSimpleClick() {
  console.log('🎭 Testing Simple Click with Debug...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages that contain our debug keywords
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MarkupOverlay') || 
        text.includes('MarkupManager') || 
        text.includes('background click') ||
        text.includes('canvas click')) {
      console.log(`🔍 MARKUP DEBUG: ${text}`);
    }
  });
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔧 Testing markup click...');
    
    // Click Text Area tool
    await page.click('button:has-text("Text Area")');
    console.log('✅ Text Area tool selected');
    
    await page.waitForTimeout(1000);
    
    // Click somewhere on the page (should hit MarkupOverlay now)
    console.log('🖱️ Clicking at position 500, 400...');
    await page.mouse.click(500, 400);
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Click completed, check for debug logs above');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleClick().catch(console.error);