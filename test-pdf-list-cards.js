const { chromium } = require('playwright');

async function listPDFCards() {
  console.log('📋 Listing all PDF cards...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    const pdfCards = await page.$$('.MuiCard-root');
    console.log(`Found ${pdfCards.length} PDF cards:`);
    
    for (let i = 0; i < pdfCards.length; i++) {
      const card = pdfCards[i];
      const filenameElement = await card.$('.MuiTypography-subtitle1');
      const filename = await filenameElement?.textContent();
      console.log(`${i + 1}. "${filename}"`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

listPDFCards().catch(console.error);