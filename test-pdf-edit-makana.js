const { chromium } = require('playwright');

async function testPDFEditMakana() {
  console.log('🔍 Testing PDF Edit with Makana2025 (non-password protected)...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Listen for all console messages for debugging
    page.on('console', msg => {
      if (msg.text().includes('Loading PDF from URL')) {
        console.log('🔗 URL Debug:', msg.text());
      }
      if (msg.type() === 'error' && msg.text().includes('PDF')) {
        console.log('❌ PDF Error:', msg.text());
      }
      if (msg.text().includes('Invalid') || msg.text().includes('Error')) {
        console.log('⚠️ Console:', msg.type(), msg.text());
      }
    });
    
    console.log('📍 Navigating to admin...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    
    // Navigate to PDF Management
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    // Find the Makana2025 PDF card specifically
    console.log('🔍 Looking for Makana2025.pdf card...');
    
    // Get all PDF cards and find the one with makana2025.pdf
    const pdfCards = await page.$$('.MuiCard-root');
    let makanaCard = null;
    
    for (const card of pdfCards) {
      const filenameElement = await card.$('.MuiTypography-subtitle1');
      const filename = await filenameElement?.textContent();
      console.log('📄 Found PDF:', filename);
      
      if (filename && filename.includes('makana2025.pdf')) {
        makanaCard = card;
        console.log('✅ Found Makana2025 card');
        break;
      }
    }
    
    if (makanaCard) {
      // Look for edit button within the Makana card
      const editButton = await makanaCard.$('button[title="Edit PDF fields and metadata"]');
      
      if (editButton) {
        console.log('✅ Edit button found in Makana card, clicking...');
        await editButton.click();
        
        await page.waitForSelector('.MuiDialog-root', { timeout: 5000 });
        console.log('✅ Dialog opened');
        
        // Wait for loading to complete
        console.log('⏳ Waiting for PDF data to load...');
        await page.waitForTimeout(5000);
        
        const errorAlert = await page.$('.MuiAlert-root[role="alert"]');
        if (errorAlert) {
          const errorText = await errorAlert.textContent();
          console.log('❌ Dialog error:', errorText);
          return false;
        } else {
          console.log('✅ No error alert found');
        }
        
        const metadataSection = await page.$('text=PDF Metadata');
        if (metadataSection) {
          console.log('✅ Metadata section loaded successfully');
          
          // Check for fields section
          const fieldsSection = await page.$('text=PDF Form Fields');
          if (fieldsSection) {
            console.log('✅ Fields section loaded successfully');
            
            // Count fields in table
            const fieldRows = await page.$$('tbody tr');
            console.log(`📊 Found ${fieldRows.length} PDF fields in table`);
            
            if (fieldRows.length > 0) {
              console.log('🎉 PDF Edit functionality is working correctly!');
              return true;
            } else {
              console.log('❌ No fields found in table');
              return false;
            }
          } else {
            console.log('❌ Fields section not found');
            return false;
          }
        } else {
          console.log('❌ Metadata section not found');
          return false;
        }
      } else {
        console.log('❌ Edit button not found in Makana card');
        return false;
      }
    } else {
      console.log('❌ Makana2025 card not found');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testPDFEditMakana().then(success => {
  if (success) {
    console.log('🎉 SUCCESS: PDF Edit functionality is working correctly!');
    process.exit(0);
  } else {
    console.log('💥 FAILED: PDF Edit functionality has issues');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});