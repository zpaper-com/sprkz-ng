const { chromium } = require('playwright');

async function testPDFEditDebug() {
  console.log('🔍 Testing PDF Edit Dialog Loading...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Listen for console messages
    page.on('console', msg => {
      console.log('🖥️ Browser console:', msg.type(), msg.text());
    });
    
    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });
    
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForTimeout(5000);
    
    // Check if we're on the admin page
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Look for PDF Management section
    console.log('🔍 Looking for PDF Management...');
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    // Look for PDFs in the grid
    console.log('🔍 Looking for PDF cards...');
    const pdfCards = await page.$$('.MuiCard-root');
    console.log(`📋 Found ${pdfCards.length} PDF cards`);
    
    if (pdfCards.length > 0) {
      // Look for edit button
      console.log('🔍 Looking for edit button...');
      const editButton = await page.$('button[title="Edit PDF fields and metadata"]');
      
      if (editButton) {
        console.log('✅ Edit button found, clicking...');
        await editButton.click();
        await page.waitForTimeout(3000);
        
        // Check if dialog opened
        const dialog = await page.$('.MuiDialog-root');
        if (dialog) {
          console.log('✅ Dialog opened');
          
          // Check for error message
          const errorAlert = await page.$('.MuiAlert-root[role="alert"]');
          if (errorAlert) {
            const errorText = await errorAlert.textContent();
            console.log('❌ Error in dialog:', errorText);
          } else {
            console.log('✅ No error alert found');
          }
          
          // Check for loading spinner
          const loadingSpinner = await page.$('.MuiCircularProgress-root');
          if (loadingSpinner) {
            console.log('🔄 Loading spinner found - waiting for it to disappear...');
            await page.waitForSelector('.MuiCircularProgress-root', { state: 'detached', timeout: 10000 });
            console.log('✅ Loading completed');
          }
          
          // Check for metadata section
          const metadataSection = await page.$('text=PDF Metadata');
          if (metadataSection) {
            console.log('✅ Metadata section found');
          } else {
            console.log('❌ Metadata section not found');
          }
          
          // Check for fields section  
          const fieldsSection = await page.$('text=PDF Form Fields');
          if (fieldsSection) {
            console.log('✅ Fields section found');
          } else {
            console.log('❌ Fields section not found');
          }
          
        } else {
          console.log('❌ Dialog did not open');
        }
      } else {
        console.log('❌ Edit button not found');
        // Let's see what buttons are available
        const buttons = await page.$$('button');
        console.log(`📋 Found ${buttons.length} buttons total`);
        
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const title = await buttons[i].getAttribute('title');
          const text = await buttons[i].textContent();
          console.log(`🔘 Button ${i}: title="${title}", text="${text}"`);
        }
      }
    } else {
      console.log('❌ No PDF cards found');
    }
    
    console.log('⏸️ Pausing for manual inspection...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testPDFEditDebug().catch(console.error);