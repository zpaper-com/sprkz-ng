const { chromium } = require('playwright');

async function testThumbnailCollapse() {
  console.log('🔍 Testing Thumbnail Sidebar Collapse Functionality...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to PDF page...');
    await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting for PDF to load...');
    await page.waitForTimeout(5000);
    
    // Check if thumbnail sidebar is visible
    const thumbnailSidebar = await page.$('[data-testid="thumbnail-sidebar"]');
    if (!thumbnailSidebar) {
      console.log('❌ Thumbnail sidebar not found');
      return false;
    }
    
    console.log('✅ Thumbnail sidebar found');
    
    // Get initial width
    const initialWidth = await thumbnailSidebar.evaluate(el => el.offsetWidth);
    console.log('📏 Initial sidebar width:', initialWidth);
    
    // Look for collapse button
    const collapseButton = await page.$('[data-testid="thumbnail-toggle-button"]');
    if (!collapseButton) {
      console.log('❌ Collapse button not found');
      return false;
    }
    
    console.log('✅ Collapse button found');
    
    // Test collapse functionality
    console.log('🔄 Testing collapse...');
    await collapseButton.click();
    await page.waitForTimeout(500); // Wait for transition
    
    const collapsedWidth = await thumbnailSidebar.evaluate(el => el.offsetWidth);
    console.log('📏 Collapsed sidebar width:', collapsedWidth);
    
    if (collapsedWidth < initialWidth) {
      console.log('✅ Sidebar collapsed successfully');
    } else {
      console.log('❌ Sidebar did not collapse');
      return false;
    }
    
    // Check if thumbnails are hidden
    const thumbnailsContainer = await page.$('[data-testid="thumbnail-sidebar"] > div:nth-child(2)');
    if (thumbnailsContainer) {
      const isHidden = await thumbnailsContainer.evaluate(el => 
        getComputedStyle(el).display === 'none'
      );
      if (isHidden) {
        console.log('✅ Thumbnails hidden when collapsed');
      } else {
        console.log('❌ Thumbnails still visible when collapsed');
      }
    }
    
    // Test expand functionality
    console.log('🔄 Testing expand...');
    await collapseButton.click();
    await page.waitForTimeout(500); // Wait for transition
    
    const expandedWidth = await thumbnailSidebar.evaluate(el => el.offsetWidth);
    console.log('📏 Expanded sidebar width:', expandedWidth);
    
    if (expandedWidth > collapsedWidth) {
      console.log('✅ Sidebar expanded successfully');
    } else {
      console.log('❌ Sidebar did not expand');
      return false;
    }
    
    // Check if thumbnails are visible again
    if (thumbnailsContainer) {
      const isVisible = await thumbnailsContainer.evaluate(el => 
        getComputedStyle(el).display !== 'none'
      );
      if (isVisible) {
        console.log('✅ Thumbnails visible when expanded');
      } else {
        console.log('❌ Thumbnails still hidden when expanded');
      }
    }
    
    // Test tooltip
    const tooltip = await collapseButton.getAttribute('aria-describedby');
    console.log('🏷️ Tooltip ID:', tooltip ? 'Present' : 'Not found');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testThumbnailCollapse().then(success => {
  if (success) {
    console.log('🎉 Thumbnail collapse functionality working correctly!');
    process.exit(0);
  } else {
    console.log('💥 Thumbnail collapse functionality has issues');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});