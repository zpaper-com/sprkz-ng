const { chromium } = require('playwright');

async function testFieldsButtonFeatureFlag() {
  console.log('🎭 Testing Fields button feature flag with Playwright...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    
    // Print relevant logs immediately
    if (text.includes('🔍') || text.includes('FEATURE FLAG') || text.includes('Tooltip feature') || text.includes('Fields button render')) {
      console.log('📋 Console:', text);
    }
  });

  try {
    console.log('📍 Navigating to /tremfya...');
    await page.goto('http://localhost:7779/tremfya', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏰ Waiting for page to fully load...');
    await page.waitForTimeout(5000);
    
    // Check for Fields button
    console.log('🔍 Checking for Fields button...');
    const fieldsButton = page.locator('button:has-text("Fields")');
    const fieldsButtonCount = await fieldsButton.count();
    
    console.log(`📊 Fields buttons found: ${fieldsButtonCount}`);
    
    if (fieldsButtonCount > 0) {
      console.log('❌ ISSUE: Fields button is visible when it should be hidden!');
      
      const isVisible = await fieldsButton.first().isVisible();
      console.log(`👁️  Button is visible: ${isVisible}`);
      
      // Get button details
      const buttonText = await fieldsButton.first().textContent();
      const buttonHTML = await fieldsButton.first().innerHTML();
      console.log(`🏷️  Button text: "${buttonText}"`);
      console.log(`🔧 Button HTML: ${buttonHTML.substring(0, 100)}...`);
      
    } else {
      console.log('✅ SUCCESS: Fields button is correctly hidden!');
    }
    
    // Check for all relevant elements in the controls area
    console.log('🔍 Checking all control buttons...');
    const allButtons = await page.locator('.MuiButton-root').all();
    console.log(`📊 Total buttons found: ${allButtons.length}`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`   Button ${i + 1}: "${text}" (visible: ${isVisible})`);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: '/home/shawnstorie/sprkz-ng/tremfya-fields-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot saved: tremfya-fields-test.png');
    
    // Wait a bit more to capture any delayed logs
    console.log('⏰ Waiting for additional logs...');
    await page.waitForTimeout(3000);
    
    // Filter and display relevant console logs
    console.log('\n📋 === RELEVANT CONSOLE LOGS ===');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('🔍') || 
      log.includes('FEATURE FLAG') || 
      log.includes('Tooltip feature') || 
      log.includes('Fields button render') ||
      log.includes('Dynamic route matched') ||
      log.includes('enabled')
    );
    
    relevantLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    if (relevantLogs.length === 0) {
      console.log('⚠️  No relevant feature flag logs found!');
      console.log('🔍 All console logs:');
      consoleLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    // Summary
    console.log('\n📊 === TEST SUMMARY ===');
    console.log(`Route: /tremfya`);
    console.log(`Fields buttons found: ${fieldsButtonCount}`);
    console.log(`Expected: 0 (hidden)`);
    console.log(`Result: ${fieldsButtonCount === 0 ? '✅ PASS' : '❌ FAIL'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/error-screenshot.png' });
  } finally {
    console.log('🏁 Test completed. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
testFieldsButtonFeatureFlag().catch(console.error);