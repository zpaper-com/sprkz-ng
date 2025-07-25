const { chromium } = require('playwright');

async function testFullscreenPDFDialog() {
  console.log('🎭 Testing: Fullscreen PDF Edit Dialog...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to admin interface
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Go to PDF Management tab
    console.log('📄 Clicking on PDF Management tab...');
    const pdfTab = page.locator('button[role="tab"]:has-text("PDF Management")');
    if (await pdfTab.count() > 0) {
      await pdfTab.click();
      await page.waitForTimeout(2000);
      
      // Step 3: Look for Edit button and click it
      console.log('✏️  Looking for PDF Edit button...');
      const editButton = page.locator('button[title*="Edit"], button:has-text("Edit")').first();
      const editButtonCount = await editButton.count();
      
      console.log(`📊 Edit buttons found: ${editButtonCount}`);
      
      if (editButtonCount > 0) {
        console.log('🖱️  Clicking Edit button...');
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Step 4: Check if dialog opened and is fullscreen
        const dialog = page.locator('div[role="dialog"]');
        const dialogCount = await dialog.count();
        
        console.log(`💬 Dialog opened: ${dialogCount > 0 ? '✅ YES' : '❌ NO'}`);
        
        if (dialogCount > 0) {
          // Check if dialog takes up full screen
          const dialogBox = await dialog.boundingBox();
          const viewportSize = page.viewportSize();
          
          if (dialogBox && viewportSize) {
            const isFullWidth = dialogBox.width >= viewportSize.width * 0.95;
            const isFullHeight = dialogBox.height >= viewportSize.height * 0.95;
            
            console.log(`📐 Dialog dimensions: ${dialogBox.width}x${dialogBox.height}`);
            console.log(`📐 Viewport dimensions: ${viewportSize.width}x${viewportSize.height}`);
            console.log(`🖥️  Full width: ${isFullWidth ? '✅ YES' : '❌ NO'}`);
            console.log(`📏 Full height: ${isFullHeight ? '✅ YES' : '❌ NO'}`);
            
            // Check for close button in title bar
            const closeButton = page.locator('button[aria-label="close"]');
            const closeButtonCount = await closeButton.count();
            console.log(`❌ Close button in title: ${closeButtonCount > 0 ? '✅ Found' : '❌ Missing'}`);
            
            // Check for table with proper spacing
            const table = page.locator('table');
            const tableCount = await table.count();
            console.log(`📋 Table present: ${tableCount > 0 ? '✅ Found' : '❌ Missing'}`);
            
            if (tableCount > 0) {
              // Check table headers for all expected columns
              const headers = [
                'Field Name',
                'Type', 
                'Page',
                'Required',
                'Status',
                'Label',
                'Placeholder',
                'Actions'
              ];
              
              let allHeadersFound = true;
              for (const header of headers) {
                const headerCell = page.locator(`th:has-text("${header}")`);
                const headerCount = await headerCell.count();
                if (headerCount === 0) {
                  allHeadersFound = false;
                  console.log(`📝 Header "${header}": ❌ Missing`);
                } else {
                  console.log(`📝 Header "${header}": ✅ Found`);
                }
              }
              
              console.log(`📊 All table headers: ${allHeadersFound ? '✅ Present' : '❌ Some missing'}`);
            }
            
            // Take screenshot of fullscreen dialog
            await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/fullscreen-pdf-dialog.png' });
            console.log('📸 Screenshot saved: fullscreen-pdf-dialog.png');
            
            const success = dialogCount > 0 && isFullWidth && isFullHeight && closeButtonCount > 0;
            console.log(`\n🎉 ${success ? 'SUCCESS' : 'PARTIAL SUCCESS'}: PDF Edit Dialog is ${success ? 'fully functional in fullscreen mode' : 'partially working'}!`);
            
            // Close dialog
            if (closeButtonCount > 0) {
              await closeButton.click();
              await page.waitForTimeout(1000);
              console.log('🔄 Dialog closed successfully');
            }
          }
        }
      } else {
        console.log('❌ No Edit buttons found in PDF Management');
      }
    } else {
      console.log('❌ PDF Management tab not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/pdf-dialog-error.png' });
  } finally {
    await browser.close();
  }
}

testFullscreenPDFDialog().catch(console.error);