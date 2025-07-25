const { chromium } = require('playwright');

async function debugPDFEdit() {
  console.log('🔍 Detailed PDF Edit Debug...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Intercept network requests to see what URLs are being requested
    page.on('request', request => {
      if (request.url().includes('.pdf')) {
        console.log('📡 PDF Request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('.pdf')) {
        console.log('📨 PDF Response:', response.url(), 'Status:', response.status());
      }
    });
    
    // Listen for all console messages
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('PDF')) {
        console.log('❌ PDF Error:', msg.text());
      }
    });
    
    console.log('📍 Navigating to admin...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    
    // Navigate to PDF Management
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    // Get PDF card information
    const pdfCards = await page.$$('.MuiCard-root');
    console.log(`📋 Found ${pdfCards.length} PDF cards`);
    
    // Get the filename from the first card
    if (pdfCards.length > 0) {
      const firstCard = pdfCards[0];
      const filenameElement = await firstCard.$('.MuiTypography-subtitle1');
      const filename = await filenameElement?.textContent();
      console.log('📄 First PDF filename:', filename);
      
      // Check if the PDF file is accessible via direct URL
      if (filename) {
        const directUrl = `http://localhost:7779/pdfs/${filename}`;
        console.log('🔗 Testing direct PDF access:', directUrl);
        
        try {
          const response = await page.goto(directUrl);
          console.log('✅ Direct PDF access status:', response.status());
          
          // Go back to admin
          await page.goto('http://localhost:7779/admin');
          await page.click('text=PDF Management');
          await page.waitForTimeout(1000);
        } catch (e) {
          console.log('❌ Direct PDF access failed:', e.message);
        }
      }
      
      // Now try to click edit button
      const editButton = await page.$('button[title="Edit PDF fields and metadata"]');
      if (editButton) {
        console.log('✅ Edit button found, clicking...');
        await editButton.click();
        
        await page.waitForSelector('.MuiDialog-root', { timeout: 5000 });
        console.log('✅ Dialog opened');
        
        // Wait a bit and check what's happening
        await page.waitForTimeout(3000);
        
        const errorAlert = await page.$('.MuiAlert-root[role="alert"]');
        if (errorAlert) {
          const errorText = await errorAlert.textContent();
          console.log('❌ Dialog error:', errorText);
        } else {
          console.log('✅ No error alert found');
        }
        
        const metadataSection = await page.$('text=PDF Metadata');
        if (metadataSection) {
          console.log('✅ Metadata section loaded successfully');
        } else {
          console.log('❌ Metadata section not found');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugPDFEdit().catch(console.error);