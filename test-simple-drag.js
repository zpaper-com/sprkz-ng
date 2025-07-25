const { chromium } = require('playwright');

async function testSimpleDrag() {
  console.log('🎭 Testing Simple Drag...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    // Check what drag-related elements exist
    console.log('\n🔍 Checking for drag-related elements...');
    
    // Look for drag handles (DragIndicator icons)
    const dragIcons = await page.$$eval('svg', icons => 
      icons.filter(icon => {
        const testId = icon.getAttribute('data-testid');
        const className = icon.className?.baseVal || icon.className || '';
        return testId?.includes('Drag') || 
               className.includes('Drag') ||
               icon.innerHTML?.includes('drag');
      }).length
    );
    console.log('Drag icons found:', dragIcons);
    
    // Look for elements with position absolute (potential markup elements)
    const absoluteElements = await page.$$eval('div[style*="position: absolute"]', divs => 
      divs.filter(div => 
        div.style.zIndex && parseInt(div.style.zIndex) >= 100
      ).length
    );
    console.log('Absolute positioned elements:', absoluteElements);
    
    // Look for ResizableMarkupElement components
    const resizableElements = await page.$$eval('div', divs => 
      divs.filter(div => 
        div.style.position === 'absolute' && 
        div.style.zIndex === '100'
      ).length
    );
    console.log('Elements with z-index 100:', resizableElements);
    
    // Check if markup toolbar is working
    console.log('\n🧰 Testing markup toolbar...');
    const markupButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => 
        btn.textContent && (
          btn.textContent.includes('Image Stamp') ||
          btn.textContent.includes('Text Area') ||
          btn.textContent.includes('Highlight')
        )
      ).map(btn => ({
        text: btn.textContent,
        disabled: btn.disabled
      }))
    );
    
    console.log('Markup buttons:', markupButtons);
    
    if (markupButtons.length > 0) {
      console.log('\n🧪 Quick test: Click Text Area and check for placement mode...');
      await page.click('button:has-text("Text Area")');
      await page.waitForTimeout(1000);
      
      const placementMode = await page.$('text=Click to place');
      console.log('Placement mode active:', !!placementMode);
      
      if (placementMode) {
        console.log('✅ Markup workflow is working - placement instruction appeared');
      } else {
        console.log('❌ Markup workflow issue - no placement instruction');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleDrag().catch(console.error);