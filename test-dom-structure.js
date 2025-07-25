const { chromium } = require('playwright');

async function testDOMStructure() {
  console.log('🎭 Testing DOM Structure...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔍 Analyzing DOM structure around PDF and markup...');
    
    // Get the structure of elements with z-index 10
    const overlayStructure = await page.evaluate(() => {
      const overlays = Array.from(document.querySelectorAll('div')).filter(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'absolute' && style.zIndex === '10';
      });
      
      return overlays.map(div => {
        const rect = div.getBoundingClientRect();
        const style = window.getComputedStyle(div);
        return {
          elementInfo: {
            tagName: div.tagName,
            className: div.className,
            id: div.id || 'no-id',
            children: div.children.length,
            hasClickHandler: !!div.onclick || div.getAttribute('onclick') !== null
          },
          styling: {
            position: style.position,
            zIndex: style.zIndex,
            pointerEvents: style.pointerEvents,
            top: style.top,
            left: style.left,
            width: style.width,
            height: style.height
          },
          bounds: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          clickable: rect.width > 0 && rect.height > 0 && style.pointerEvents !== 'none'
        };
      });
    });
    
    console.log('Overlay elements (z-index 10):');
    overlayStructure.forEach((el, i) => {
      console.log(`\n  Element ${i+1}:`);
      console.log('    Info:', el.elementInfo);
      console.log('    Style:', el.styling);
      console.log('    Bounds:', el.bounds);
      console.log('    Clickable:', el.clickable);
    });
    
    // Test a manual click on the overlay to see what happens
    console.log('\n🖱️ Testing manual click on overlay...');
    
    // Find the clickable overlay (should be the MarkupOverlay)
    const clickableOverlay = overlayStructure.find(el => el.clickable);
    if (clickableOverlay) {
      console.log('✅ Found clickable overlay, testing click...');
      
      // Click in the center of the clickable overlay
      const centerX = clickableOverlay.bounds.x + clickableOverlay.bounds.width / 2;
      const centerY = clickableOverlay.bounds.y + clickableOverlay.bounds.height / 2;
      
      console.log(`🎯 Clicking at overlay center: (${centerX}, ${centerY})`);
      
      // First select a tool
      await page.click('button:has-text("Text Area")');
      await page.waitForTimeout(1000);
      
      // Then click on the overlay
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(2000);
      
      // Check if dialog opened
      const dialog = await page.$('.MuiDialog-root');
      console.log('✅ Dialog opened after overlay click:', !!dialog);
    } else {
      console.log('❌ No clickable overlay found');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDOMStructure().catch(console.error);