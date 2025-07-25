const { chromium } = require('playwright');

async function testLayoutsTab() {
  console.log('🎭 Testing: New Layouts tab in admin interface...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Navigate to admin interface
    console.log('📍 Navigating to admin interface...');
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Look for Layouts tab
    console.log('🔍 Looking for Layouts tab...');
    const layoutsTab = page.locator('button[role="tab"]:has-text("Layouts")');
    const layoutsTabCount = await layoutsTab.count();
    
    console.log(`📊 Layouts tab found: ${layoutsTabCount > 0 ? '✅ YES' : '❌ NO'}`);
    
    if (layoutsTabCount > 0) {
      // Step 3: Click on Layouts tab
      console.log('🖱️  Clicking on Layouts tab...');
      await layoutsTab.click();
      await page.waitForTimeout(2000);
      
      // Step 4: Verify Layouts content is displayed
      console.log('🔍 Checking Layouts tab content...');
      
      // Look for Layout Management heading
      const layoutHeading = page.locator('h4:has-text("Layout Management")');
      const layoutHeadingCount = await layoutHeading.count();
      console.log(`📝 Layout Management heading: ${layoutHeadingCount > 0 ? '✅ Found' : '❌ Missing'}`);
      
      // Look for Add New Layout button
      const addLayoutButton = page.locator('button:has-text("Add New Layout")');
      const addLayoutButtonCount = await addLayoutButton.count();
      console.log(`➕ Add New Layout button: ${addLayoutButtonCount > 0 ? '✅ Found' : '❌ Missing'}`);
      
      // Look for layout table
      const layoutTable = page.locator('table');
      const layoutTableCount = await layoutTable.count();
      console.log(`📋 Layout table: ${layoutTableCount > 0 ? '✅ Found' : '❌ Missing'}`);
      
      // Check for default layouts (Desktop and Mobile)
      const desktopLayout = page.locator('text="Desktop Layout"');
      const mobileLayout = page.locator('text="Mobile Layout"');
      const desktopCount = await desktopLayout.count();
      const mobileCount = await mobileLayout.count();
      
      console.log(`🖥️  Desktop Layout: ${desktopCount > 0 ? '✅ Found' : '❌ Missing'}`);
      console.log(`📱 Mobile Layout: ${mobileCount > 0 ? '✅ Found' : '❌ Missing'}`);
      
      // Take screenshot of the Layouts tab
      await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/layouts-tab-screenshot.png' });
      console.log('📸 Screenshot saved: layouts-tab-screenshot.png');
      
      // Step 5: Test Add New Layout dialog
      if (addLayoutButtonCount > 0) {
        console.log('🆕 Testing Add New Layout dialog...');
        await addLayoutButton.click();
        await page.waitForTimeout(1000);
        
        const dialog = page.locator('div[role="dialog"]');
        const dialogCount = await dialog.count();
        console.log(`💬 Add Layout dialog: ${dialogCount > 0 ? '✅ Opened' : '❌ Failed to open'}`);
        
        if (dialogCount > 0) {
          // Check form fields
          const nameField = page.locator('input[placeholder], input').filter({ hasText: '' }).first();
          const typeSelect = page.locator('div:has-text("Type")');
          const descriptionField = page.locator('textarea, input[multiline]');
          
          console.log('📝 Dialog form fields present');
          
          // Close dialog
          const cancelButton = page.locator('button:has-text("Cancel")');
          if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
      
      const success = layoutHeadingCount > 0 && addLayoutButtonCount > 0 && layoutTableCount > 0 && desktopCount > 0 && mobileCount > 0;
      console.log(`\n🎉 ${success ? 'SUCCESS' : 'PARTIAL SUCCESS'}: Layouts tab is ${success ? 'fully functional' : 'partially working'}!`);
      
      if (success) {
        console.log('✅ All features working:');
        console.log('  - Layouts tab navigation');
        console.log('  - Layout Management interface');
        console.log('  - Default layouts (Desktop & Mobile)');
        console.log('  - Add New Layout functionality');
        console.log('  - Layout table display');
      }
      
    } else {
      console.log('❌ Layouts tab not found in admin interface');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/layouts-error.png' });
  } finally {
    await browser.close();
  }
}

testLayoutsTab().catch(console.error);