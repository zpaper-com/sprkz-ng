const { chromium } = require('playwright');

async function testDirectPDFAccess() {
  console.log('🔍 Testing direct PDF access from browser...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    
    // Test direct PDF.js access
    const result = await page.evaluate(async () => {
      try {
        // Import PDF.js the same way as the services
        const pdfjsLib = window.pdfjsLib || (await import('pdfjs-dist'));
        
        if (!pdfjsLib) {
          return { success: false, error: 'PDF.js not available' };
        }
        
        console.log('PDF.js available:', !!pdfjsLib);
        console.log('Worker URL:', pdfjsLib.GlobalWorkerOptions?.workerSrc);
        
        // Try to load the PDF directly
        const loadingTask = pdfjsLib.getDocument({ url: '/pdfs/makana2025.pdf' });
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        
        // Try to get metadata
        const metadata = await pdf.getMetadata();
        console.log('Metadata retrieved:', !!metadata);
        
        return { 
          success: true, 
          numPages: pdf.numPages,
          hasMetadata: !!metadata
        };
        
      } catch (error) {
        console.error('Direct PDF access error:', error);
        return { 
          success: false, 
          error: error.message,
          errorName: error.name,
          errorStack: error.stack
        };
      }
    });
    
    if (result.success) {
      console.log('✅ Direct PDF access successful!');
      console.log('📄 Pages:', result.numPages);
      console.log('📋 Has metadata:', result.hasMetadata);
    } else {
      console.log('❌ Direct PDF access failed:');
      console.log('   Error:', result.error);
      console.log('   Name:', result.errorName);
      if (result.errorStack) {
        console.log('   Stack:', result.errorStack.split('\n')[0]);
      }
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testDirectPDFAccess().then(success => {
  if (success) {
    console.log('🎉 Direct PDF access works!');
  } else {
    console.log('💥 Direct PDF access failed');
  }
}).catch(console.error);