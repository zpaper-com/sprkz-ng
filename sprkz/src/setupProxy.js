const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Database functions - we'll implement these directly here since setupProxy.js can't import .ts files
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { seedDatabase } = require('./admin/data/seeder');

let db = null;

async function initializeDatabase() {
  if (db) {
    return db;
  }

  const path = require('path');
  const fs = require('fs');

  // Create database directory if it doesn't exist
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'admin.db');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');

  // Initialize schema
  const schemaPath = path.join(__dirname, 'admin/database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schema);
  } else {
    // Fallback schema if file doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS url_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        pdf_path TEXT,
        features TEXT DEFAULT '{}',
        pdf_fields TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pdf_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  console.log('Admin database initialized at:', dbPath);
  
  // Seed the database with initial data
  await seedDatabase(db);
  
  return db;
}

async function getDatabase() {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

module.exports = function(app) {
  // Initialize database on startup
  initializeDatabase().catch(console.error);

  // Add JSON parsing middleware
  app.use('/api', express.json());

  // Features API endpoints
  app.get('/api/admin/features', async (req, res) => {
    try {
      const db = await getDatabase();
      const features = await db.all('SELECT id, name, description, notes, created_at as creationDate FROM features ORDER BY created_at DESC');
      res.json(features);
    } catch (error) {
      console.error('Error fetching features:', error);
      res.status(500).json({ error: 'Failed to fetch features' });
    }
  });

  app.post('/api/admin/features', async (req, res) => {
    try {
      const { name, description, notes } = req.body;
      const db = await getDatabase();
      const result = await db.run(
        'INSERT INTO features (name, description, notes) VALUES (?, ?, ?)',
        [name, description, notes]
      );
      const feature = await db.get('SELECT id, name, description, notes, created_at as creationDate FROM features WHERE id = ?', result.lastID);
      res.json(feature);
    } catch (error) {
      console.error('Error creating feature:', error);
      res.status(500).json({ error: 'Failed to create feature' });
    }
  });

  app.put('/api/admin/features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, notes } = req.body;
      const db = await getDatabase();
      await db.run(
        'UPDATE features SET name = ?, description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, notes, id]
      );
      const feature = await db.get('SELECT id, name, description, notes, created_at as creationDate FROM features WHERE id = ?', id);
      res.json(feature);
    } catch (error) {
      console.error('Error updating feature:', error);
      res.status(500).json({ error: 'Failed to update feature' });
    }
  });

  app.delete('/api/admin/features/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      await db.run('DELETE FROM features WHERE id = ?', id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting feature:', error);
      res.status(500).json({ error: 'Failed to delete feature' });
    }
  });

  // URL Configuration API endpoints
  app.get('/api/admin/urls', async (req, res) => {
    try {
      const db = await getDatabase();
      const urls = await db.all('SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs ORDER BY created_at DESC');
      // Parse JSON fields
      const urlsWithParsedFields = urls.map(url => ({
        ...url,
        features: JSON.parse(url.features || '{}'),
        pdfFields: JSON.parse(url.pdfFields || '{}')
      }));
      res.json(urlsWithParsedFields);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      res.status(500).json({ error: 'Failed to fetch URLs' });
    }
  });

  app.post('/api/admin/urls', async (req, res) => {
    try {
      const { path, pdfPath, features, pdfFields } = req.body;
      const db = await getDatabase();
      const result = await db.run(
        'INSERT INTO url_configs (path, pdf_path, features, pdf_fields) VALUES (?, ?, ?, ?)',
        [path, pdfPath, JSON.stringify(features || {}), JSON.stringify(pdfFields || {})]
      );
      const url = await db.get('SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs WHERE id = ?', result.lastID);
      res.json({
        ...url,
        features: JSON.parse(url.features || '{}'),
        pdfFields: JSON.parse(url.pdfFields || '{}')
      });
    } catch (error) {
      console.error('Error creating URL:', error);
      res.status(500).json({ error: 'Failed to create URL' });
    }
  });

  app.put('/api/admin/urls/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { path, pdfPath, features, pdfFields } = req.body;
      const db = await getDatabase();
      await db.run(
        'UPDATE url_configs SET path = ?, pdf_path = ?, features = ?, pdf_fields = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [path, pdfPath, JSON.stringify(features || {}), JSON.stringify(pdfFields || {}), id]
      );
      const url = await db.get('SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs WHERE id = ?', id);
      res.json({
        ...url,
        features: JSON.parse(url.features || '{}'),
        pdfFields: JSON.parse(url.pdfFields || '{}')
      });
    } catch (error) {
      console.error('Error updating URL:', error);
      res.status(500).json({ error: 'Failed to update URL' });
    }
  });

  app.delete('/api/admin/urls/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      await db.run('DELETE FROM url_configs WHERE id = ?', id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting URL:', error);
      res.status(500).json({ error: 'Failed to delete URL' });
    }
  });

  // PDF Management API endpoints
  app.get('/api/admin/pdfs', async (req, res) => {
    try {
      const db = await getDatabase();
      const pdfs = await db.all('SELECT filename, size, uploaded_at as uploadDate FROM pdf_files ORDER BY uploaded_at DESC');
      res.json(pdfs);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      res.status(500).json({ error: 'Failed to fetch PDFs' });
    }
  });

  app.post('/api/admin/pdfs/upload', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      const { filename, size } = req.file;
      const db = await getDatabase();
      
      const result = await db.run(
        'INSERT INTO pdf_files (filename, original_name, size) VALUES (?, ?, ?)',
        [filename, req.file.originalname, size]
      );

      const pdf = await db.get('SELECT * FROM pdf_files WHERE id = ?', result.lastID);
      res.json({ success: true, pdf });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  app.delete('/api/admin/pdfs/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const db = await getDatabase();
      
      // Delete from database
      await db.run('DELETE FROM pdf_files WHERE filename = ?', filename);
      
      // Delete physical file
      const filePath = path.join(__dirname, '../public/pdfs', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting PDF:', error);
      res.status(500).json({ error: 'Failed to delete PDF' });
    }
  });

  // Public API endpoint for URL configurations (used by main app)
  app.get('/api/url-configs', async (req, res) => {
    try {
      const db = await getDatabase();
      const urls = await db.all('SELECT path, pdf_path as pdfPath, features, pdf_fields as pdfFields FROM url_configs');
      // Parse JSON fields and return simplified structure
      const urlsWithParsedFields = urls.map(url => ({
        path: url.path,
        pdfPath: url.pdfPath,
        features: JSON.parse(url.features || '{}'),
        pdfFields: JSON.parse(url.pdfFields || '{}')
      }));
      res.json(urlsWithParsedFields);
    } catch (error) {
      console.error('Error fetching URL configurations:', error);
      res.status(500).json({ error: 'Failed to fetch URL configurations' });
    }
  });

  // Settings API endpoints
  app.get('/api/admin/settings', async (req, res) => {
    try {
      const db = await getDatabase();
      const settings = await db.all('SELECT * FROM settings');
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/admin/settings', async (req, res) => {
    try {
      const settings = req.body;
      const db = await getDatabase();
      
      for (const [key, value] of Object.entries(settings)) {
        await db.run(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [key, value]
        );
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });
};