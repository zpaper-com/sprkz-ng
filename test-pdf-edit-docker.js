const { chromium } = require('playwright');

async function testPDFEditWithDocker() {
  console.log('🐳 Testing PDF Edit Dialog with Docker Playwright...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    // Listen for console messages and errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });
    
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting for page to stabilize...');
    await page.waitForTimeout(3000);
    
    // Navigate to PDF Management
    console.log('🔍 Looking for PDF Management...');
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    // Look for PDF cards
    console.log('🔍 Looking for PDF cards...');
    const pdfCards = await page.$$('.MuiCard-root');
    console.log(`📋 Found ${pdfCards.length} PDF cards`);
    
    if (pdfCards.length > 0) {
      // Look for edit button specifically
      console.log('🔍 Looking for edit button...');
      const editButton = await page.$('button[title="Edit PDF fields and metadata"]');
      
      if (editButton) {
        console.log('✅ Edit button found, clicking...');
        await editButton.click();
        
        // Wait for dialog to open
        await page.waitForSelector('.MuiDialog-root', { timeout: 5000 });
        console.log('✅ Dialog opened');
        
        // Wait for loading to complete or error to appear
        console.log('⏳ Waiting for PDF data to load...');
        
        try {
          // Wait for either success (metadata section) or error (alert)
          await Promise.race([
            page.waitForSelector('text=PDF Metadata', { timeout: 10000 }),
            page.waitForSelector('.MuiAlert-root[role="alert"]', { timeout: 10000 })
          ]);
          
          // Check if we got an error
          const errorAlert = await page.$('.MuiAlert-root[role="alert"]');
          if (errorAlert) {
            const errorText = await errorAlert.textContent();
            console.log('❌ Error found:', errorText);
            
            // Take a screenshot for debugging
            await page.screenshot({ path: 'pdf-edit-error.png' });
            console.log('📸 Screenshot saved as pdf-edit-error.png');
            
            return false;
          } else {
            console.log('✅ PDF Metadata section found - loading successful!');
            
            // Check for fields section
            const fieldsSection = await page.$('text=PDF Form Fields');
            if (fieldsSection) {
              console.log('✅ PDF Form Fields section found');
              
              // Count fields in table
              const fieldRows = await page.$$('tbody tr');
              console.log(`📊 Found ${fieldRows.length} PDF fields in table`);
              
              // Take a success screenshot
              await page.screenshot({ path: 'pdf-edit-success.png' });
              console.log('📸 Success screenshot saved as pdf-edit-success.png');
              
              return true;
            } else {
              console.log('❌ PDF Form Fields section not found');
              return false;
            }
          }
        } catch (timeoutError) {
          console.log('❌ Timeout waiting for dialog content');
          await page.screenshot({ path: 'pdf-edit-timeout.png' });
          console.log('📸 Timeout screenshot saved');
          return false;
        }
        
      } else {
        console.log('❌ Edit button not found');
        return false;
      }
    } else {
      console.log('❌ No PDF cards found');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    await page.screenshot({ path: 'pdf-edit-test-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testPDFEditWithDocker().then(success => {
  if (success) {
    console.log('🎉 PDF Edit functionality is working correctly!');
    process.exit(0);
  } else {
    console.log('💥 PDF Edit functionality has issues');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});