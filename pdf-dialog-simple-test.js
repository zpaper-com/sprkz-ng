const { chromium } = require('playwright');

async function testPDFDialog() {
  console.log('Testing PDF Dialog...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://host.docker.internal:7779/admin', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Admin page loaded');
    
    const pdfTab = page.locator('button[role=tab]:has-text("PDF Management")');
    if (await pdfTab.count() > 0) {
      await pdfTab.click();
      await page.waitForTimeout(2000);
      console.log('PDF Management tab clicked');
      
      const editButtons = page.locator('svg[data-testid="EditIcon"]').locator('..');
      const editCount = await editButtons.count();
      console.log('Edit buttons found:', editCount);
      
      if (editCount > 0) {
        await editButtons.first().click();
        await page.waitForTimeout(3000);
        
        const dialog = page.locator('div[role="dialog"]');
        const dialogCount = await dialog.count();
        console.log('Dialog opened:', dialogCount > 0);
        
        if (dialogCount > 0) {
          const spinner = page.locator('.MuiCircularProgress-root');
          const spinnerCount = await spinner.count();
          console.log('Loading spinner visible:', spinnerCount > 0);
          
          await page.waitForTimeout(10000);
          
          const spinnerStill = await spinner.count();
          console.log('Spinner after 10s:', spinnerStill > 0 ? 'STUCK' : 'GONE');
          
          const error = page.locator('.MuiAlert-standardError');
          const errorCount = await error.count();
          console.log('Error count:', errorCount);
          
          if (errorCount > 0) {
            const errorText = await error.first().textContent();
            console.log('Error text:', errorText);
          }
          
          const table = page.locator('table');
          const tableCount = await table.count();
          console.log('Table loaded:', tableCount > 0);
          
          await page.screenshot({ path: '/workspace/pdf-dialog-debug.png' });
          console.log('Screenshot saved');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testPDFDialog();