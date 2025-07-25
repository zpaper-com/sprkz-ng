const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });
  
  await page.goto('http://10.0.1.249:7779', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  
  const fieldLogs = consoleMessages.filter(msg => msg.includes('🔍 Field'));
  
  console.log('=== PDF METADATA ANALYSIS ===');
  console.log('Total fields found:', fieldLogs.length);
  
  let pdfRequiredCount = 0;
  let nameBasedOnlyCount = 0;
  let flagsZeroCount = 0;
  let flagsTwoCount = 0;
  
  fieldLogs.forEach(log => {
    const hasFieldFlags0 = log.includes('fieldFlags: 0');
    const hasFieldFlags2 = log.includes('fieldFlags: 2'); 
    const hasIsRequiredTrue = log.includes('isRequired: true');
    const hasFinalRequiredTrue = log.includes('finalRequired: true');
    
    if (hasFieldFlags0) flagsZeroCount++;
    if (hasFieldFlags2) flagsTwoCount++;
    
    if (hasIsRequiredTrue) {
      pdfRequiredCount++;
    }
    
    if (!hasIsRequiredTrue && hasFinalRequiredTrue) {
      nameBasedOnlyCount++;
    }
  });
  
  console.log('\n=== FIELD FLAGS ANALYSIS ===');
  console.log('Fields with fieldFlags: 0 (not required by PDF):', flagsZeroCount);
  console.log('Fields with fieldFlags: 2 (required by PDF):', flagsTwoCount);
  console.log('Other fieldFlags values:', fieldLogs.length - flagsZeroCount - flagsTwoCount);
  
  console.log('\n=== REQUIREMENT SOURCE ANALYSIS ===');
  console.log('PDF-defined required (fieldFlags & 2):', pdfRequiredCount);
  console.log('Name-pattern-only required:', nameBasedOnlyCount);
  console.log('Total marked as required:', pdfRequiredCount + nameBasedOnlyCount);
  
  console.log('\n=== RECOMMENDATION ===');
  if (pdfRequiredCount < 10 && nameBasedOnlyCount > 30) {
    console.log('⚠️  The PDF itself defines very few required fields (' + pdfRequiredCount + ')');
    console.log('⚠️  Most required fields (' + nameBasedOnlyCount + ') are detected by name patterns');
    console.log('⚠️  This suggests the PDF may not have proper required field metadata');
  } else {
    console.log('✅ The PDF appears to have proper required field metadata');
  }
  
  // Show some specific examples
  console.log('\n=== SPECIFIC EXAMPLES ===');
  fieldLogs.slice(0, 10).forEach((log, i) => {
    if (log.includes('isRequired: true') || log.includes('finalRequired: true')) {
      console.log(log);
    }
  });
  
  await browser.close();
})().catch(console.error);