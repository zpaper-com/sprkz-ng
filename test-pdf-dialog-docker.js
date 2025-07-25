const { chromium } = require('playwright');

async function testPDFDialogWithDocker() {
  console.log('🎭 Testing: PDF Edit Dialog with Docker Playwright...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to admin interface
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Step 2: Go to PDF Management tab
    console.log('📄 Clicking on PDF Management tab...');
    const pdfTab = page.locator('button[role="tab"]:has-text("PDF Management")');
    if (await pdfTab.count() > 0) {
      await pdfTab.click();
      await page.waitForTimeout(3000);
      
      // Take screenshot of PDF Management
      await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/pdf-management-page.png' });
      console.log('📸 PDF Management screenshot saved');
      
      // Step 3: Look for any PDF files and Edit buttons
      console.log('🔍 Looking for PDF files and Edit buttons...');
      
      // Check for table rows
      const tableRows = page.locator('tbody tr');
      const rowCount = await tableRows.count();
      console.log(`📊 PDF table rows found: ${rowCount}`);
      
      if (rowCount > 0) {
        // Look for Edit buttons/icons
        const editButtons = page.locator('button[title*="Edit"], button[aria-label*="Edit"], svg[data-testid="EditIcon"]').locator('..');
        const editButtonCount = await editButtons.count();
        console.log(`✏️  Edit buttons found: ${editButtonCount}`);
        
        if (editButtonCount > 0) {
          console.log('🖱️  Clicking first Edit button...');
          await editButtons.first().click();
          await page.waitForTimeout(2000);
          
          // Step 4: Check dialog state
          const dialog = page.locator('div[role="dialog"]');
          const dialogCount = await dialog.count();
          console.log(`💬 Dialog opened: ${dialogCount > 0 ? '✅ YES' : '❌ NO'}`);
          
          if (dialogCount > 0) {
            // Check for loading spinner
            const loadingSpinner = page.locator('[data-testid="loading"], .MuiCircularProgress-root, svg[data-testid="CircularProgress"]');
            const spinnerCount = await loadingSpinner.count();
            console.log(`⏳ Loading spinner visible: ${spinnerCount > 0 ? '✅ YES' : '❌ NO'}`);
            
            // Wait longer to see if loading completes
            console.log('⏰ Waiting 10 seconds for loading to complete...');
            await page.waitForTimeout(10000);
            
            // Check again for spinner
            const spinnerStillVisible = await loadingSpinner.count();
            console.log(`⏳ Loading spinner still visible after 10s: ${spinnerStillVisible > 0 ? '❌ YES (STUCK)' : '✅ NO (LOADED)'}`);
            
            // Check for error messages
            const errorAlert = page.locator('.MuiAlert-standardError, [severity="error"]');
            const errorCount = await errorAlert.count();
            console.log(`🚨 Error messages: ${errorCount > 0 ? '❌ YES' : '✅ NO'}`);
            
            if (errorCount > 0) {
              const errorText = await errorAlert.first().textContent();
              console.log(`📝 Error message: "${errorText}"`);
            }
            
            // Check console for errors
            const logs = [];
            page.on('console', msg => {
              if (msg.type() === 'error') {
                logs.push(`CONSOLE ERROR: ${msg.text()}`);
              }
            });
            
            // Check for successful content
            const tableContent = page.locator('table');
            const tableCount = await tableContent.count();
            console.log(`📋 PDF fields table loaded: ${tableCount > 0 ? '✅ YES' : '❌ NO'}`);
            
            // Take screenshot of dialog state
            await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/pdf-dialog-state.png' });
            console.log('📸 Dialog state screenshot saved');
            
            // Check network requests
            const networkRequests = [];
            page.on('response', response => {
              if (response.url().includes('/pdfs/') || response.url().includes('pdf')) {
                networkRequests.push({
                  url: response.url(),
                  status: response.status(),
                  statusText: response.statusText()
                });
              }
            });
            
            // Print network info
            if (networkRequests.length > 0) {
              console.log('🌐 PDF-related network requests:');
              networkRequests.forEach(req => {
                console.log(`   ${req.status} ${req.statusText}: ${req.url}`);
              });
            }
            
            // Print console logs
            if (logs.length > 0) {
              console.log('📝 Console errors:');
              logs.forEach(log => console.log(`   ${log}`));
            }
          }
        } else {
          console.log('❌ No Edit buttons found');
          
          // Check what buttons are available
          const allButtons = page.locator('button');
          const buttonCount = await allButtons.count();
          console.log(`🔍 Total buttons found: ${buttonCount}`);
          
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const buttonText = await allButtons.nth(i).textContent();
            const buttonTitle = await allButtons.nth(i).getAttribute('title');
            console.log(`   Button ${i}: "${buttonText}" title: "${buttonTitle}"`);
          }
        }
      } else {
        console.log('❌ No PDF files found in table');
        
        // Check if there's an "Add PDF" or similar functionality
        const addButton = page.locator('button:has-text("Add"), button:has-text("Upload")');
        const addButtonCount = await addButton.count();
        console.log(`➕ Add/Upload buttons: ${addButtonCount}`);
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

testPDFDialogWithDocker().catch(console.error);