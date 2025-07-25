const { chromium } = require('playwright');

async function testExistingURLFields() {
  console.log('🔍 Testing existing URL field extraction...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    console.log('📱 Navigated to admin area');
    
    // Click on URL Configuration tab
    await page.click('text=URL Configuration');
    await page.waitForTimeout(1000);
    console.log('🔧 Opened URL Configuration');
    
    // Take screenshot of URL config tab
    await page.screenshot({ path: 'url-config-list.png', fullPage: true });
    console.log('📷 URL Configuration screenshot saved');
    
    // Look for any existing URL rows and click one
    const urlRows = await page.locator('tr').count();
    console.log(`📊 Found ${urlRows} rows in URL configuration`);
    
    if (urlRows > 1) { // More than just header row
      // Find the first clickable row (skip header)
      const firstDataRow = await page.locator('tbody tr').first();
      const rowExists = await firstDataRow.count() > 0;
      
      if (rowExists) {
        console.log('🔍 Clicking on first URL configuration row');
        await firstDataRow.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot of the field configuration
        await page.screenshot({ path: 'existing-url-fields.png', fullPage: true });
        console.log('📷 Field configuration screenshot saved');
        
        // Check if field extraction table is present
        const fieldTable = await page.locator('table').count();
        console.log(`📋 Found ${fieldTable} tables (should show PDF fields)`);
        
        // Count field rows in the table
        const fieldRows = await page.locator('table tbody tr').count();
        console.log(`📊 Found ${fieldRows} form fields in configuration`);
        
        if (fieldRows > 0) {
          console.log('✅ PDF field extraction appears to be working!');
          
          // Get some sample field names
          const fieldNames = await page.locator('table tbody tr td:first-child').allTextContents();
          console.log('📝 Sample field names:', fieldNames.slice(0, 5));
        } else {
          console.log('⚠️ No fields found - field extraction may not be working');
        }
      }
    } else {
      console.log('⚠️ No URL configurations found to test');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'existing-url-test-error.png', fullPage: true });
  }
  
  await browser.close();
}

testExistingURLFields().catch(console.error);