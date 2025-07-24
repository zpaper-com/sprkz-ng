const { chromium } = require('playwright');

async function takeScreenshot(url, filename) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1200, height: 800 });
  
  try {
    console.log(`Loading ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for React to fully load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait for specific elements based on the route
    if (url.includes('/admin')) {
      // Wait for admin interface elements
      await page.waitForSelector('[data-testid="admin-interface"]', { timeout: 10000 }).catch(() => {
        console.log('Admin interface selector not found, waiting for general content...');
      });
      await page.waitForSelector('h1, h2, .MuiTypography-h4', { timeout: 10000 }).catch(() => {});
    } else if (url.includes('/makana') || url.includes('/tremfya') || url.includes('/test')) {
      // Wait for PDF viewer elements
      await page.waitForSelector('.pdf-container, [data-testid="pdf-viewer"]', { timeout: 15000 }).catch(() => {
        console.log('PDF container not found, waiting for canvas...');
      });
      await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => {
        console.log('Canvas not found, continuing...');
      });
    }
    
    // Additional wait for dynamic content and animations
    await page.waitForTimeout(5000);
    
    // Wait for any loading indicators to disappear
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return loadingElements.length === 0;
    }, { timeout: 10000 }).catch(() => {
      console.log('Loading indicators still present, continuing...');
    });
    
    // Final wait for layout stability
    await page.waitForTimeout(3000);
    
    console.log(`Taking screenshot of ${url}...`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`Screenshot saved: ${filename}`);
  } catch (error) {
    console.error(`Error taking screenshot of ${url}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function takeAdminSectionScreenshot(url, section, filename) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewportSize({ width: 1200, height: 800 });
  
  try {
    console.log(`Loading ${url} and navigating to ${section}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for React to fully load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Wait for admin interface to load
    await page.waitForSelector('h1, h2, .MuiTypography-h4', { timeout: 10000 }).catch(() => {});
    
    // Click on the specific section tab/button
    console.log(`Clicking on ${section} section...`);
    if (section === 'url-config') {
      await page.click('button:has-text("URL Configuration"), [role="tab"]:has-text("URL"), button:has-text("URLs")').catch(() => {
        console.log('URL Config button not found, trying alternative selectors...');
      });
    } else if (section === 'pdf-management') {
      await page.click('button:has-text("PDF Management"), [role="tab"]:has-text("PDF"), button:has-text("Files")').catch(() => {
        console.log('PDF Management button not found, trying alternative selectors...');
      });
    }
    
    // Wait for section content to load
    await page.waitForTimeout(3000);
    
    // Wait for any loading indicators to disappear
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return loadingElements.length === 0;
    }, { timeout: 10000 }).catch(() => {
      console.log('Loading indicators still present, continuing...');
    });
    
    // Final wait for layout stability
    await page.waitForTimeout(2000);
    
    console.log(`Taking screenshot of ${section} section...`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`Screenshot saved: ${filename}`);
  } catch (error) {
    console.error(`Error taking screenshot of ${section}:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  const baseUrl = 'http://localhost:7779';
  const routes = [
    { url: baseUrl, filename: 'screenshots/home.png' },
    { url: `${baseUrl}/admin`, filename: 'screenshots/admin.png' },
    { url: `${baseUrl}/makana`, filename: 'screenshots/makana.png' },
    { url: `${baseUrl}/tremfya`, filename: 'screenshots/tremfya.png' },
    { url: `${baseUrl}/test`, filename: 'screenshots/test.png' }
  ];

  // Take main screenshots
  for (const route of routes) {
    await takeScreenshot(route.url, route.filename);
  }
  
  // Take admin section screenshots
  const adminSections = [
    { section: 'url-config', filename: 'screenshots/admin-url-config.png' },
    { section: 'pdf-management', filename: 'screenshots/admin-pdf-management.png' }
  ];
  
  for (const adminSection of adminSections) {
    await takeAdminSectionScreenshot(`${baseUrl}/admin`, adminSection.section, adminSection.filename);
  }
}

main().catch(console.error);