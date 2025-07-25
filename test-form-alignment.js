const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set wide viewport to test fit-width properly
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  console.log('=== TESTING FORM ALIGNMENT WITH FIT WIDTH ===');
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);  // Wait for PDF to load
  
  // Get initial state
  const initialCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
  const initialAnnotationLayer = await page.locator('.annotationLayer').boundingBox();
  const initialFormFields = await page.locator('.annotationLayer input, .annotationLayer select, .annotationLayer textarea').count();
  
  console.log('BEFORE fit-width:');
  console.log('- Canvas:', initialCanvas);
  console.log('- Annotation layer:', initialAnnotationLayer);
  console.log('- Form fields found:', initialFormFields);
  
  if (initialFormFields > 0) {
    const firstField = await page.locator('.annotationLayer input').first().boundingBox();
    console.log('- First form field position:', firstField);
  }
  
  // Click fit width button
  await page.locator('button:has-text("Width")').click();
  await page.waitForTimeout(3000);  // Wait for resize and re-render
  
  // Get state after fit-width
  const afterCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
  const afterAnnotationLayer = await page.locator('.annotationLayer').boundingBox();
  const afterFormFields = await page.locator('.annotationLayer input, .annotationLayer select, .annotationLayer textarea').count();
  
  console.log('\nAFTER fit-width:');
  console.log('- Canvas:', afterCanvas);
  console.log('- Annotation layer:', afterAnnotationLayer);
  console.log('- Form fields found:', afterFormFields);
  
  if (afterFormFields > 0) {
    const firstField = await page.locator('.annotationLayer input').first().boundingBox();
    console.log('- First form field position:', firstField);
    
    // Check if annotation layer matches canvas size
    const canvasWidth = afterCanvas?.width || 0;
    const canvasHeight = afterCanvas?.height || 0;
    const layerWidth = afterAnnotationLayer?.width || 0;
    const layerHeight = afterAnnotationLayer?.height || 0;
    
    console.log('\nAlignment check:');
    console.log('- Canvas size:', { width: canvasWidth, height: canvasHeight });
    console.log('- Annotation layer size:', { width: layerWidth, height: layerHeight });
    console.log('- Width match:', Math.abs(canvasWidth - layerWidth) < 5);
    console.log('- Height match:', Math.abs(canvasHeight - layerHeight) < 5);
    
    if (Math.abs(canvasWidth - layerWidth) > 5 || Math.abs(canvasHeight - layerHeight) > 5) {
      console.log('❌ ANNOTATION LAYER SIZE MISMATCH - This causes form field misalignment!');
    } else {
      console.log('✅ Annotation layer size matches canvas');
    }
  }
  
  await browser.close();
})().catch(console.error);