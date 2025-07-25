const { chromium } = require('playwright');

async function testAfterDisable() {
  console.log('🎭 Testing Fields button after disabling feature flag...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔍') || text.includes('FEATURE FLAG') || text.includes('Tooltip feature') || text.includes('Fields button render')) {
      consoleLogs.push(text);
      console.log('📋 Console:', text);
    }
  });

  try {
    console.log('📍 Navigating to /tremfya after disabling feature flag...');
    await page.goto('http://localhost:7779/tremfya', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Check for Fields button
    console.log('🔍 Checking for Fields button...');
    const fieldsButton = page.locator('button:has-text("Fields")');
    const fieldsButtonCount = await fieldsButton.count();
    
    console.log(`📊 Fields buttons found: ${fieldsButtonCount}`);
    
    if (fieldsButtonCount === 0) {
      console.log('✅ SUCCESS: Fields button is now correctly hidden!');
    } else {
      console.log('❌ ISSUE: Fields button is still visible');
      const isVisible = await fieldsButton.first().isVisible();
      console.log(`👁️  Button is visible: ${isVisible}`);
    }
    
    // Check all buttons to confirm
    const allButtons = await page.locator('.MuiButton-root').all();
    console.log(`📊 Total buttons found: ${allButtons.length}`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`   Button ${i + 1}: "${text}" (visible: ${isVisible})`);
    }
    
    await page.screenshot({ path: '/home/shawnstorie/sprkz-ng/after-disable-screenshot.png' });
    console.log('📸 Screenshot saved: after-disable-screenshot.png');
    
    // Show relevant console logs
    console.log('\n📋 === FEATURE FLAG LOGS ===');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    // Summary
    console.log('\n📊 === FINAL TEST RESULT ===');
    console.log(`Route: /tremfya`);
    console.log(`Feature 12 setting: disabled (false)`);
    console.log(`Fields buttons found: ${fieldsButtonCount}`);
    console.log(`Expected: 0 (hidden)`);
    console.log(`✅ FEATURE FLAG SYSTEM: ${fieldsButtonCount === 0 ? 'WORKING CORRECTLY' : 'NEEDS DEBUGGING'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testAfterDisable().catch(console.error);