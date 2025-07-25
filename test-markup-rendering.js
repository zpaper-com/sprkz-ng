const { chromium } = require('playwright');

async function testMarkupRendering() {
  console.log('🎭 Testing Markup Rendering...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(8000);
    
    console.log('\n🔍 Checking if MarkupManager/MarkupOverlay is rendered...');
    
    // Check for MarkupToolbar (should be visible)
    const markupToolbar = await page.$('[data-testid="markup-toolbar"], .markup-toolbar, div:has(button:has-text("Text Area"))');
    console.log('Markup toolbar found:', !!markupToolbar);
    
    // Check for MarkupOverlay element
    const markupOverlay = await page.$$eval('div', divs => 
      divs.filter(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'absolute' && 
               style.zIndex >= '10' &&
               (parseInt(style.width) > 1000 || parseInt(style.height) > 1000);
      }).map(div => ({
        zIndex: window.getComputedStyle(div).zIndex,
        position: window.getComputedStyle(div).position,
        width: window.getComputedStyle(div).width,
        height: window.getComputedStyle(div).height,
        pointerEvents: window.getComputedStyle(div).pointerEvents,
        top: window.getComputedStyle(div).top,
        left: window.getComputedStyle(div).left,
        classes: div.className,
        id: div.id
      }))
    );
    
    console.log('Potential MarkupOverlay elements:', markupOverlay.length);
    markupOverlay.forEach((el, i) => console.log(`  ${i+1}:`, el));
    
    // Check for PDF canvas element for comparison
    const canvasInfo = await page.$$eval('canvas', canvases => 
      canvases.map(canvas => {
        const rect = canvas.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          zIndex: window.getComputedStyle(canvas).zIndex || 'auto'
        };
      })
    );
    
    console.log('\nPDF Canvas elements:', canvasInfo.length);
    canvasInfo.forEach((el, i) => console.log(`  Canvas ${i+1}:`, el));
    
    // Test if we can find any elements that could be the overlay
    const overlayLikeElements = await page.$$eval('div', divs =>
      divs.filter(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'absolute' && style.zIndex === '10';
      }).length
    );
    
    console.log('Elements with z-index 10 and absolute position:', overlayLikeElements);
    
    // Test MarkupManager container specifically
    const markupManagerContainers = await page.$$eval('div', divs =>
      divs.filter(div => {
        const style = window.getComputedStyle(div);
        return style.pointerEvents === 'none' && 
               style.position === 'absolute' &&
               style.width === '100%' &&
               style.height === '100%';
      }).length
    );
    
    console.log('MarkupManager-like containers (pointer-events: none):', markupManagerContainers);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMarkupRendering().catch(console.error);