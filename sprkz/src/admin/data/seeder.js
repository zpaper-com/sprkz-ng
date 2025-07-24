const fs = require('fs');
const path = require('path');

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add the last value
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

async function seedDatabase(db) {
  console.log('Checking if database needs seeding...');
  
  // Check if features table is empty
  const featureCount = await db.get('SELECT COUNT(*) as count FROM features');
  
  if (featureCount.count === 0) {
    console.log('Seeding database with initial data...');
    
    // Seed features
    const featuresCSV = fs.readFileSync(path.join(__dirname, 'initial-features.csv'), 'utf8');
    const features = parseCSV(featuresCSV);
    
    for (const feature of features) {
      await db.run(
        'INSERT INTO features (name, description, notes) VALUES (?, ?, ?)',
        [feature.name, feature.description, feature.notes]
      );
    }
    console.log(`Seeded ${features.length} features`);
    
    // Seed URLs
    const urlsCSV = fs.readFileSync(path.join(__dirname, 'initial-urls.csv'), 'utf8');
    const urls = parseCSV(urlsCSV);
    
    for (const url of urls) {
      await db.run(
        'INSERT INTO url_configs (path, pdf_path, features, pdf_fields) VALUES (?, ?, ?, ?)',
        [url.path, url.pdf_path, url.features, url.pdf_fields]
      );
    }
    console.log(`Seeded ${urls.length} URL configurations`);
    
    // Seed PDFs (only metadata, not actual files)
    const pdfsCSV = fs.readFileSync(path.join(__dirname, 'initial-pdfs.csv'), 'utf8');
    const pdfs = parseCSV(pdfsCSV);
    
    for (const pdf of pdfs) {
      await db.run(
        'INSERT INTO pdf_files (filename, original_name, size) VALUES (?, ?, ?)',
        [pdf.filename, pdf.original_name, parseInt(pdf.size)]
      );
    }
    console.log(`Seeded ${pdfs.length} PDF file records`);
    
    // Seed initial settings
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['defaultPdf', 'makana2025.pdf']);
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['theme', 'light']);
    console.log('Seeded initial settings');
    
    console.log('Database seeding completed!');
  } else {
    console.log('Database already contains data, skipping seeding');
  }
}

module.exports = { seedDatabase };