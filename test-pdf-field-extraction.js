const { chromium } = require('playwright');

async function testPDFFieldExtraction() {
  console.log('🔍 Testing PDF field extraction in admin interface...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to admin area
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    console.log('📱 Navigated to admin area');
    
    // Click on URL Configuration tab
    await page.click('text=URL Configuration');
    await page.waitForTimeout(1000);
    console.log('🔧 Opened URL Configuration');
    
    // Click Add URL button
    await page.click('button:has-text("Add URL")');
    await page.waitForTimeout(1000);
    console.log('➕ Opened URL creation dialog');
    
    // Fill in URL path
    await page.fill('input[placeholder="/my-form"]', '/test-extraction');
    console.log('📝 Filled URL path');
    
    // Select a PDF (tremfya.pdf if available)
    await page.click('div[role="combobox"]');
    await page.waitForTimeout(500);
    
    // Look for tremfya.pdf option
    const tremfyaOption = await page.locator('li:has-text("tremfya.pdf")').count();
    if (tremfyaOption > 0) {
      await page.click('li:has-text("tremfya.pdf")');
      console.log('📋 Selected tremfya.pdf');
    } else {
      console.log('⚠️ No tremfya.pdf found, using default');
    }
    
    // Take a screenshot of the dialog
    await page.screenshot({ path: 'pdf-extraction-dialog.png', fullPage: true });
    console.log('📷 Screenshot saved as pdf-extraction-dialog.png');
    
    // Click Create button
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(2000);
    console.log('✅ Created URL configuration');
    
    // Look for the new URL in the list and click it to see field extraction
    const newUrlRow = await page.locator('tr:has-text("/test-extraction")').count();
    if (newUrlRow > 0) {
      await page.click('tr:has-text("/test-extraction")');
      await page.waitForTimeout(2000);
      console.log('🔍 Clicked on new URL to view field configuration');
      
      // Take screenshot of field extraction results
      await page.screenshot({ path: 'pdf-field-extraction-results.png', fullPage: true });
      console.log('📷 Field extraction results saved as pdf-field-extraction-results.png');
      
      // Check if fields are loaded
      const fieldRows = await page.locator('table tbody tr').count();
      console.log(`📊 Found ${fieldRows} form fields extracted from PDF`);
      
      if (fieldRows > 0) {
        console.log('✅ PDF field extraction working correctly!');
      } else {
        console.log('⚠️ No fields extracted - may need to check PDF or extraction logic');
      }
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'pdf-extraction-error.png', fullPage: true });
  }
  
  await browser.close();
}

testPDFFieldExtraction().catch(console.error);