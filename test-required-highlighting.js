const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Check current viewport size
  const viewport = page.viewportSize();
  console.log('Current viewport:', viewport);
  
  // Capture console logs for field processing
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔍 Field') && text.includes('finalRequired: true')) {
      consoleMessages.push(text);
    }
  });
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);  // Wait longer for PDF to load
  
  console.log('=== TESTING REQUIRED FIELD HIGHLIGHTING ===');
  
  // Debug: Check if the page loaded correctly
  const title = await page.title();
  console.log('Page title:', title);
  
  // Debug: Check for PDF viewer elements
  const pdfViewer = await page.locator('[data-testid="pdf-viewer"]').count();
  console.log('PDF viewer elements found:', pdfViewer);
  
  // Debug: Check for annotation layer
  const annotationLayer = await page.locator('.annotationLayer').count();
  console.log('Annotation layer elements found:', annotationLayer);
  
  // Check for elements with the 'required' class
  const requiredElements = await page.locator('.annotationLayer .required').count();
  console.log('Found', requiredElements, 'elements with "required" class');
  
  // Check if required fields are visible
  if (requiredElements > 0) {
    console.log('✅ Required field highlighting is working!');
    
    // Get the first few required field names for verification
    const requiredFieldElements = await page.locator('.annotationLayer .required').all();
    
    for (let i = 0; i < Math.min(requiredFieldElements.length, 5); i++) {
      const fieldId = await requiredFieldElements[i].getAttribute('data-field-id');
      const tagName = await requiredFieldElements[i].evaluate(el => el.tagName);
      const type = await requiredFieldElements[i].evaluate(el => el.type || 'div');
      
      console.log((i + 1) + '.', fieldId, `(${tagName.toLowerCase()}:${type})`);
    }
  } else {
    console.log('❌ No required field highlighting found');
    
    // Debug: check if any form fields exist at all
    const allInputs = await page.locator('.annotationLayer input, .annotationLayer select, .annotationLayer textarea, .annotationLayer div[data-field-id]').count();
    console.log('Total form elements found:', allInputs);
    
    // Show console messages about required fields
    console.log('\\nRequired field detection logs:');
    consoleMessages.slice(0, 3).forEach(log => {
      console.log('-', log.substring(0, 100) + '...');
    });
  }
  
  await browser.close();
})().catch(console.error);