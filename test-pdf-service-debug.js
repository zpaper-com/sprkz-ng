const { chromium } = require('playwright');

async function testPDFServiceDebug() {
  console.log('🔍 Testing PDF service calls from React context...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:7779/admin', { waitUntil: 'networkidle' });
    
    // Navigate to PDF Management to trigger any necessary imports
    await page.click('text=PDF Management');
    await page.waitForTimeout(2000);
    
    // Test the exact same service calls that PDFEditDialog makes
    const result = await page.evaluate(async () => {
      try {
        // Get the services the same way PDFEditDialog would
        const { pdfService } = await import('/static/js/bundle.js').catch(() => ({}));
        const { formFieldService } = await import('/static/js/bundle.js').catch(() => ({}));
        
        console.log('Services available:', { 
          pdfService: !!pdfService, 
          formFieldService: !!formFieldService 
        });
        
        // Try to replicate what PDFEditDialog.loadPDFData does
        const filename = 'makana2025.pdf';
        const pdfUrl = filename.startsWith('/') ? filename : `/pdfs/${filename}`;
        console.log('Constructed URL:', pdfUrl);
        
        // Load PDF document the same way as PDFEditDialog
        if (!pdfService) {
          throw new Error('pdfService not available');
        }
        
        console.log('Calling pdfService.loadPDF...');
        const pdfDoc = await pdfService.loadPDF(pdfUrl);
        console.log('PDF loaded, pages:', pdfDoc.numPages);
        
        // Extract metadata
        console.log('Getting metadata...');
        const metadata = await pdfDoc.getMetadata();
        console.log('Metadata retrieved');
        
        // Extract form fields
        if (!formFieldService) {
          throw new Error('formFieldService not available');
        }
        
        console.log('Calling formFieldService.extractAllFormFields...');
        const allFields = await formFieldService.extractAllFormFields(pdfDoc);
        console.log('Fields extracted:', allFields.length);
        
        return { 
          success: true, 
          numPages: pdfDoc.numPages,
          fieldsCount: allFields.length,
          hasMetadata: !!metadata
        };
        
      } catch (error) {
        console.error('Service test error:', error);
        return { 
          success: false, 
          error: error.message,
          errorName: error.name
        };
      }
    });
    
    if (result.success) {
      console.log('✅ PDF Service calls successful!');
      console.log('📄 Pages:', result.numPages);
      console.log('📊 Fields:', result.fieldsCount);
      console.log('📋 Has metadata:', result.hasMetadata);
    } else {
      console.log('❌ PDF Service calls failed:');
      console.log('   Error:', result.error);
      console.log('   Name:', result.errorName);
    }
    
    return result.success;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testPDFServiceDebug().then(success => {
  console.log(success ? '🎉 Services working correctly!' : '💥 Service issues found');
}).catch(console.error);