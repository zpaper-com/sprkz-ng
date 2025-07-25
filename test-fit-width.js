const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set a much wider viewport to give room for fit-width scaling
  await page.setViewportSize({ width: 1920, height: 1080 });
  console.log('Set viewport to 1920x1080 for better fit-width testing');
  
  console.log('=== TESTING FIT WIDTH FUNCTIONALITY ===');
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);  // Wait for PDF to load
  
  // Check if PDF viewer loaded
  const pdfViewer = await page.locator('[data-testid="pdf-viewer"]').count();
  console.log('PDF viewer elements found:', pdfViewer);
  
  if (pdfViewer === 0) {
    console.log('❌ PDF viewer not found, cannot test fit width');
    await browser.close();
    return;
  }
  
  // Get initial canvas dimensions
  const initialCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
  console.log('Initial canvas dimensions:', initialCanvas);
  
  // Look for fit width button - try different possible selectors
  const fitWidthButton = await page.locator('button:has-text("Width")').count();
  console.log('Width button found:', fitWidthButton);
  
  if (fitWidthButton > 0) {
    console.log('✅ Found Width button, testing functionality...');
    
    // Click the width button  
    await page.locator('button:has-text("Width")').click();
    await page.waitForTimeout(2000);  // Wait for resize
    
    // Get canvas dimensions after fit width
    const afterFitCanvas = await page.locator('[data-testid="pdf-canvas"]').boundingBox();
    console.log('Canvas dimensions after Fit Width:', afterFitCanvas);
    
    // Compare dimensions
    const widthChanged = Math.abs((afterFitCanvas?.width || 0) - (initialCanvas?.width || 0)) > 10;
    const heightChanged = Math.abs((afterFitCanvas?.height || 0) - (initialCanvas?.height || 0)) > 10;
    
    console.log('Width changed significantly:', widthChanged);
    console.log('Height changed significantly:', heightChanged);
    
    if (!widthChanged && !heightChanged) {
      console.log('❌ Width button appears to have no effect');
    } else {
      console.log('✅ Width button caused canvas resize');
    }
    
    // Get container dimensions to understand the issue
    const container = await page.locator('[data-testid="pdf-viewer"]').boundingBox();
    console.log('PDF container dimensions:', container);
    
    // Check if canvas is already at maximum width
    const containerWidth = container?.width || 0;
    const canvasWidth = afterFitCanvas?.width || 0;
    console.log('Container vs Canvas width:', { containerWidth, canvasWidth });
    
    if (canvasWidth >= containerWidth - 20) {
      console.log('🔍 Canvas might already be at maximum width for container');
    }
  } else {
    console.log('❌ Width button not found');
  }
  
  await browser.close();
})().catch(console.error);