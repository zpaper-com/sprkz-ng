const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set wide viewport to test fit-width properly
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('=== TESTING CONTAINER SCROLLING AFTER FIT WIDTH ===');
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);  // Wait for PDF to load
  
  // Click fit width button
  console.log('Clicking Fit Width button...');
  await page.locator('button:has-text("Width")').click();
  await page.waitForTimeout(3000);  // Wait for resize and re-render
  
  // Find the PDF container that should have overflow: auto
  const containers = await page.locator('div').all();
  
  console.log('Looking for scrollable containers...');
  
  for (let i = 0; i < Math.min(containers.length, 20); i++) {
    try {
      const container = containers[i];
      const styles = await container.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          overflow: computed.overflow,
          overflowY: computed.overflowY,
          height: computed.height,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          hasScrollbar: el.scrollHeight > el.clientHeight
        };
      });
      
      if (styles.overflow === 'auto' || styles.overflowY === 'auto' || styles.hasScrollbar) {
        console.log(`Container ${i}:`, styles);
        
        if (styles.hasScrollbar) {
          console.log('Found scrollable container! Testing scroll...');
          
          // Try scrolling this container
          await container.evaluate(el => {
            el.scrollTop = el.scrollHeight;
          });
          
          await page.waitForTimeout(500);
          
          const newScrollTop = await container.evaluate(el => el.scrollTop);
          console.log('Scroll position after scrolling:', newScrollTop);
          
          if (newScrollTop > 0) {
            console.log('✅ Container scrolling is working!');
            
            // Check if we can see more of the PDF now
            const canvasAfterScroll = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
            console.log('Canvas position after container scroll:', canvasAfterScroll);
            
            break;
          } else {
            console.log('❌ Container scrolling failed');
          }
        }
      }
    } catch (e) {
      // Skip containers that can't be evaluated
    }
  }
  
  // Also test direct scroll on the PDF container area
  console.log('\nTesting scroll on PDF container area...');
  try {
    // Find the container with grey background (PDF container)
    const pdfContainer = page.locator('div').filter({ hasText: /^$/ }).first();
    
    await pdfContainer.evaluate(el => {
      // Find parent with overflow auto
      let current = el;
      while (current && current !== document.body) {
        const styles = window.getComputedStyle(current);
        if (styles.overflow === 'auto' || styles.overflowY === 'auto') {
          console.log('Found scrollable parent, scrolling...');
          current.scrollTop = current.scrollHeight;
          return;
        }
        current = current.parentElement;
      }
    });
    
    await page.waitForTimeout(500);
    console.log('Attempted scroll on PDF container area');
    
  } catch (e) {
    console.log('Could not test PDF container scroll');
  }
  
  await browser.close();
})().catch(console.error);