const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set wide viewport to test fit-width properly
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('=== TESTING SCROLLING AFTER FIT WIDTH ===');
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);  // Wait for PDF to load
  
  // Get initial state
  const initialCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
  const initialViewport = await page.evaluate(() => {
    return {
      scrollTop: document.documentElement.scrollTop,
      scrollLeft: document.documentElement.scrollLeft,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight
    };
  });
  
  console.log('BEFORE fit-width:');
  console.log('- Canvas:', initialCanvas);
  console.log('- Viewport scroll info:', initialViewport);
  console.log('- Canvas fits in viewport:', (initialCanvas?.height || 0) <= initialViewport.clientHeight);
  
  // Click fit width button
  console.log('\nClicking Fit Width button...');
  await page.locator('button:has-text("Width")').click();
  await page.waitForTimeout(3000);  // Wait for resize and re-render
  
  // Get state after fit-width
  const afterCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
  const afterViewport = await page.evaluate(() => {
    return {
      scrollTop: document.documentElement.scrollTop,
      scrollLeft: document.documentElement.scrollLeft,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight
    };
  });
  
  console.log('\nAFTER fit-width:');
  console.log('- Canvas:', afterCanvas);
  console.log('- Viewport scroll info:', afterViewport);
  console.log('- Canvas fits in viewport:', (afterCanvas?.height || 0) <= afterViewport.clientHeight);
  console.log('- Canvas is cut off by:', Math.max(0, (afterCanvas?.height || 0) - afterViewport.clientHeight), 'pixels');
  
  // Test if we can scroll to see the bottom of the PDF
  if ((afterCanvas?.height || 0) > afterViewport.clientHeight) {
    console.log('\n📜 Testing scrolling to bottom of PDF...');
    
    // Try scrolling to the bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    const scrolledViewport = await page.evaluate(() => {
      return {
        scrollTop: document.documentElement.scrollTop,
        scrollLeft: document.documentElement.scrollLeft
      };
    });
    
    console.log('- Scroll position after scrolling:', scrolledViewport);
    
    if (scrolledViewport.scrollTop > 0) {
      console.log('✅ Page scrolling is working');
      
      // Check if we can see the bottom of the canvas now
      const canvasAfterScroll = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
      const canvasBottom = (canvasAfterScroll?.y || 0) + (canvasAfterScroll?.height || 0);
      const viewportBottom = scrolledViewport.scrollTop + afterViewport.clientHeight;
      
      console.log('- Canvas bottom:', canvasBottom);  
      console.log('- Viewport bottom:', viewportBottom);
      console.log('- Can see full canvas:', canvasBottom <= viewportBottom + 50); // 50px tolerance
      
    } else {
      console.log('❌ Page scrolling is NOT working - PDF is cut off');
    }
  } else {
    console.log('✅ PDF fits entirely in viewport, no scrolling needed');
  }
  
  await browser.close();
})().catch(console.error);