const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Database functions
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { seedDatabase } = require('./src/admin/data/seeder');

const app = express();
const PORT = process.env.PORT || 3001;

let db = null;

async function initializeDatabase() {
  if (db) {
    return db;
  }

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
  const schemaPath = path.join(__dirname, 'src/admin/database/schema.sql');
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

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  },
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Main API endpoint for URL configurations (used by frontend)
app.get('/api/url-configs', async (req, res) => {
  try {
    const db = await getDatabase();
    const urls = await db.all(
      'SELECT path, pdf_path as pdfPath, features, pdf_fields as pdfFields FROM url_configs'
    );
    // Parse JSON fields and return simplified structure
    const urlsWithParsedFields = urls.map((url) => ({
      path: url.path,
      pdfPath: url.pdfPath,
      features: JSON.parse(url.features || '{}'),
      pdfFields: JSON.parse(url.pdfFields || '{}'),
    }));
    res.json(urlsWithParsedFields);
  } catch (error) {
    console.error('Error fetching URL configurations:', error);
    res.status(500).json({ error: 'Failed to fetch URL configurations' });
  }
});

// Admin API endpoints
app.get('/api/admin/features', async (req, res) => {
  try {
    const db = await getDatabase();
    const features = await db.all(
      'SELECT id, name, description, notes, created_at as creationDate FROM features ORDER BY created_at DESC'
    );
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
    const feature = await db.get(
      'SELECT id, name, description, notes, created_at as creationDate FROM features WHERE id = ?',
      result.lastID
    );
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
    const feature = await db.get(
      'SELECT id, name, description, notes, created_at as creationDate FROM features WHERE id = ?',
      id
    );
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
    const urls = await db.all(
      'SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs ORDER BY created_at DESC'
    );
    // Parse JSON fields
    const urlsWithParsedFields = urls.map((url) => ({
      ...url,
      features: JSON.parse(url.features || '{}'),
      pdfFields: JSON.parse(url.pdfFields || '{}'),
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
      [
        path,
        pdfPath,
        JSON.stringify(features || {}),
        JSON.stringify(pdfFields || {}),
      ]
    );
    const url = await db.get(
      'SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs WHERE id = ?',
      result.lastID
    );
    res.json({
      ...url,
      features: JSON.parse(url.features || '{}'),
      pdfFields: JSON.parse(url.pdfFields || '{}'),
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
      [
        path,
        pdfPath,
        JSON.stringify(features || {}),
        JSON.stringify(pdfFields || {}),
        id,
      ]
    );
    const url = await db.get(
      'SELECT id, path, pdf_path as pdfPath, features, pdf_fields as pdfFields, created_at as createdAt FROM url_configs WHERE id = ?',
      id
    );
    res.json({
      ...url,
      features: JSON.parse(url.features || '{}'),
      pdfFields: JSON.parse(url.pdfFields || '{}'),
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
    const pdfs = await db.all(
      'SELECT filename, size, uploaded_at as uploadDate FROM pdf_files ORDER BY uploaded_at DESC'
    );
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

    const pdf = await db.get(
      'SELECT * FROM pdf_files WHERE id = ?',
      result.lastID
    );
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
    const filePath = path.join(__dirname, 'public/pdfs', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
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

// Webhook API endpoints
app.get('/api/admin/webhooks', async (req, res) => {
  try {
    const db = await getDatabase();
    const webhooks = await db.all(`
      SELECT 
        id, name, url, method, is_active, retry_enabled, retry_count, 
        retry_delay_seconds, timeout_seconds, headers, payload_type, 
        payload_template, created_at as createdAt, updated_at as updatedAt
      FROM webhooks 
      ORDER BY created_at DESC
    `);
    
    // Parse JSON fields
    const webhooksWithParsedFields = webhooks.map((webhook) => ({
      ...webhook,
      is_active: Boolean(webhook.is_active),
      retry_enabled: Boolean(webhook.retry_enabled),
      headers: JSON.parse(webhook.headers || '{}'),
    }));
    
    res.json(webhooksWithParsedFields);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

app.post('/api/admin/webhooks', async (req, res) => {
  try {
    const {
      name, url, method, is_active, retry_enabled, retry_count,
      retry_delay_seconds, timeout_seconds, headers, payload_type, payload_template
    } = req.body;
    
    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO webhooks (
        name, url, method, is_active, retry_enabled, retry_count,
        retry_delay_seconds, timeout_seconds, headers, payload_type, payload_template
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, url, method || 'POST', is_active ? 1 : 0, retry_enabled ? 1 : 0,
      retry_count || 3, retry_delay_seconds || 30, timeout_seconds || 30,
      JSON.stringify(headers || {}), payload_type || 'json', payload_template
    ]);
    
    const webhook = await db.get(`
      SELECT 
        id, name, url, method, is_active, retry_enabled, retry_count,
        retry_delay_seconds, timeout_seconds, headers, payload_type,
        payload_template, created_at as createdAt, updated_at as updatedAt
      FROM webhooks WHERE id = ?
    `, result.lastID);
    
    res.json({
      ...webhook,
      is_active: Boolean(webhook.is_active),
      retry_enabled: Boolean(webhook.retry_enabled),
      headers: JSON.parse(webhook.headers || '{}'),
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

app.put('/api/admin/webhooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, url, method, is_active, retry_enabled, retry_count,
      retry_delay_seconds, timeout_seconds, headers, payload_type, payload_template
    } = req.body;
    
    const db = await getDatabase();
    await db.run(`
      UPDATE webhooks SET 
        name = ?, url = ?, method = ?, is_active = ?, retry_enabled = ?,
        retry_count = ?, retry_delay_seconds = ?, timeout_seconds = ?,
        headers = ?, payload_type = ?, payload_template = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, url, method, is_active ? 1 : 0, retry_enabled ? 1 : 0,
      retry_count, retry_delay_seconds, timeout_seconds,
      JSON.stringify(headers || {}), payload_type, payload_template, id
    ]);
    
    const webhook = await db.get(`
      SELECT 
        id, name, url, method, is_active, retry_enabled, retry_count,
        retry_delay_seconds, timeout_seconds, headers, payload_type,
        payload_template, created_at as createdAt, updated_at as updatedAt
      FROM webhooks WHERE id = ?
    `, id);
    
    res.json({
      ...webhook,
      is_active: Boolean(webhook.is_active),
      retry_enabled: Boolean(webhook.retry_enabled),
      headers: JSON.parse(webhook.headers || '{}'),
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

app.delete('/api/admin/webhooks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM webhooks WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Webhook testing endpoint
app.post('/api/admin/webhooks/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { testPayload } = req.body;
    
    const db = await getDatabase();
    const webhook = await db.get('SELECT * FROM webhooks WHERE id = ?', id);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    const result = await executeWebhook(webhook, testPayload || {});
    res.json(result);
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// Webhook events endpoint
app.get('/api/admin/webhooks/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const db = await getDatabase();
    const events = await db.all(`
      SELECT 
        id, webhook_id, event_type, payload, response_status, response_body,
        attempt_count, last_attempt_at, status, created_at as createdAt
      FROM webhook_events 
      WHERE webhook_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [id, parseInt(limit)]);
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
});

// Event logging helper function
async function logEvent(eventData) {
  try {
    const db = await getDatabase();
    await db.run(`
      INSERT INTO system_events (
        event_type, event_category, event_name, description,
        user_agent, ip_address, session_id, user_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventData.event_type,
      eventData.event_category,
      eventData.event_name,
      eventData.description,
      eventData.user_agent || null,
      eventData.ip_address || null,
      eventData.session_id || null,
      eventData.user_id || null,
      JSON.stringify(eventData.metadata || {})
    ]);
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

// Update session tracking
async function updateSessionActivity(sessionId, userAgent, ipAddress) {
  if (!sessionId) return;
  
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    // Update or create session
    await db.run(`
      INSERT OR REPLACE INTO event_sessions (
        session_id, user_agent, ip_address, first_event_at, 
        last_event_at, total_events, updated_at
      ) VALUES (
        ?, ?, ?, 
        COALESCE((SELECT first_event_at FROM event_sessions WHERE session_id = ?), ?),
        ?, 
        COALESCE((SELECT total_events FROM event_sessions WHERE session_id = ?), 0) + 1,
        ?
      )
    `, [sessionId, userAgent, ipAddress, sessionId, now, now, sessionId, now]);
  } catch (error) {
    console.error('Failed to update session:', error);
  }
}

// Webhook execution function
async function executeWebhook(webhook, payload, sessionId = null, userAgent = null, ipAddress = null) {
  const startTime = Date.now();
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...JSON.parse(webhook.headers || '{}')
    };
    
    const requestOptions = {
      method: webhook.method,
      headers,
      timeout: webhook.timeout_seconds * 1000,
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(webhook.method)) {
      requestOptions.body = JSON.stringify(payload);
    }
    
    // Log webhook triggered event
    await logEvent({
      event_type: 'webhook_triggered',
      event_category: 'webhook_activity',
      event_name: `Webhook ${webhook.name} Triggered`,
      description: `Webhook ${webhook.name} (${webhook.method} ${webhook.url}) was triggered`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        webhook_url: webhook.url,
        webhook_method: webhook.method,
        payload_size_bytes: JSON.stringify(payload).length
      }
    });
    
    const response = await fetch(webhook.url, requestOptions);
    const responseBody = await response.text();
    const responseTime = Date.now() - startTime;
    
    const success = response.ok;
    
    // Log webhook result
    await logEvent({
      event_type: success ? 'webhook_triggered' : 'webhook_failed',
      event_category: 'webhook_activity',
      event_name: `Webhook ${webhook.name} ${success ? 'Succeeded' : 'Failed'}`,
      description: success 
        ? `Webhook ${webhook.name} completed successfully in ${responseTime}ms`
        : `Webhook ${webhook.name} failed with status ${response.status}`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        response_status: response.status,
        response_time_ms: responseTime,
        success: success
      }
    });
    
    return {
      success: success,
      status_code: response.status,
      response_body: responseBody,
      error_message: success ? null : `HTTP ${response.status}`,
      response_time_ms: responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log webhook error
    await logEvent({
      event_type: 'webhook_failed',
      event_category: 'webhook_activity',
      event_name: `Webhook ${webhook.name} Error`,
      description: `Webhook ${webhook.name} failed with error: ${error.message}`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        error_message: error.message,
        response_time_ms: responseTime,
        success: false
      }
    });
    
    return {
      success: false,
      status_code: null,
      response_body: null,
      error_message: error.message,
      response_time_ms: responseTime
    };
  }
}

// Automation API endpoints
app.get('/api/admin/automations', async (req, res) => {
  try {
    const db = await getDatabase();
    const automations = await db.all(`
      SELECT 
        id, name, description, is_active, trigger_type, trigger_config,
        created_at as createdAt, updated_at as updatedAt
      FROM automations 
      ORDER BY created_at DESC
    `);
    
    const automationsWithParsedFields = automations.map((automation) => ({
      ...automation,
      is_active: Boolean(automation.is_active),
      trigger_config: JSON.parse(automation.trigger_config || '{}'),
    }));
    
    res.json(automationsWithParsedFields);
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

app.get('/api/admin/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    
    const automation = await db.get(`
      SELECT 
        id, name, description, is_active, trigger_type, trigger_config,
        created_at as createdAt, updated_at as updatedAt
      FROM automations WHERE id = ?
    `, id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    const steps = await db.all(`
      SELECT 
        ast.id, ast.automation_id, ast.webhook_id, ast.step_order,
        ast.is_conditional, ast.condition_config, ast.delay_seconds,
        ast.retry_on_failure, ast.continue_on_failure,
        ast.created_at as createdAt, ast.updated_at as updatedAt,
        w.name as webhook_name, w.url as webhook_url, w.method as webhook_method,
        w.is_active as webhook_is_active
      FROM automation_steps ast
      JOIN webhooks w ON ast.webhook_id = w.id
      WHERE ast.automation_id = ?
      ORDER BY ast.step_order
    `, id);
    
    const stepsWithParsedFields = steps.map((step) => ({
      ...step,
      is_conditional: Boolean(step.is_conditional),
      retry_on_failure: Boolean(step.retry_on_failure),
      continue_on_failure: Boolean(step.continue_on_failure),
      condition_config: JSON.parse(step.condition_config || '{}'),
      webhook: {
        id: step.webhook_id,
        name: step.webhook_name,
        url: step.webhook_url,
        method: step.webhook_method,
        is_active: Boolean(step.webhook_is_active)
      }
    }));
    
    res.json({
      ...automation,
      is_active: Boolean(automation.is_active),
      trigger_config: JSON.parse(automation.trigger_config || '{}'),
      steps: stepsWithParsedFields
    });
  } catch (error) {
    console.error('Error fetching automation:', error);
    res.status(500).json({ error: 'Failed to fetch automation' });
  }
});

app.post('/api/admin/automations', async (req, res) => {
  try {
    const {
      name, description, is_active, trigger_type, trigger_config, steps
    } = req.body;
    
    const db = await getDatabase();
    
    // Start transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Create automation
      const automationResult = await db.run(`
        INSERT INTO automations (
          name, description, is_active, trigger_type, trigger_config
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        name, description, is_active ? 1 : 0, trigger_type || 'manual',
        JSON.stringify(trigger_config || {})
      ]);
      
      const automationId = automationResult.lastID;
      
      // Create automation steps
      if (steps && Array.isArray(steps)) {
        for (const step of steps) {
          await db.run(`
            INSERT INTO automation_steps (
              automation_id, webhook_id, step_order, is_conditional, condition_config,
              delay_seconds, retry_on_failure, continue_on_failure
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            automationId, step.webhook_id, step.step_order,
            step.is_conditional ? 1 : 0, JSON.stringify(step.condition_config || {}),
            step.delay_seconds || 0, step.retry_on_failure ? 1 : 0, step.continue_on_failure ? 1 : 0
          ]);
        }
      }
      
      await db.exec('COMMIT');
      
      // Return the created automation with steps
      const automation = await db.get(`
        SELECT 
          id, name, description, is_active, trigger_type, trigger_config,
          created_at as createdAt, updated_at as updatedAt
        FROM automations WHERE id = ?
      `, automationId);
      
      res.json({
        ...automation,
        is_active: Boolean(automation.is_active),
        trigger_config: JSON.parse(automation.trigger_config || '{}'),
      });
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

app.put('/api/admin/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, is_active, trigger_type, trigger_config, steps
    } = req.body;
    
    const db = await getDatabase();
    
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Update automation
      await db.run(`
        UPDATE automations SET 
          name = ?, description = ?, is_active = ?, trigger_type = ?, 
          trigger_config = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name, description, is_active ? 1 : 0, trigger_type,
        JSON.stringify(trigger_config || {}), id
      ]);
      
      // Delete existing steps
      await db.run('DELETE FROM automation_steps WHERE automation_id = ?', id);
      
      // Create new steps
      if (steps && Array.isArray(steps)) {
        for (const step of steps) {
          await db.run(`
            INSERT INTO automation_steps (
              automation_id, webhook_id, step_order, is_conditional, condition_config,
              delay_seconds, retry_on_failure, continue_on_failure
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, step.webhook_id, step.step_order,
            step.is_conditional ? 1 : 0, JSON.stringify(step.condition_config || {}),
            step.delay_seconds || 0, step.retry_on_failure ? 1 : 0, step.continue_on_failure ? 1 : 0
          ]);
        }
      }
      
      await db.exec('COMMIT');
      
      const automation = await db.get(`
        SELECT 
          id, name, description, is_active, trigger_type, trigger_config,
          created_at as createdAt, updated_at as updatedAt
        FROM automations WHERE id = ?
      `, id);
      
      res.json({
        ...automation,
        is_active: Boolean(automation.is_active),
        trigger_config: JSON.parse(automation.trigger_config || '{}'),
      });
    } catch (err) {
      await db.exec('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error updating automation:', error);
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

app.delete('/api/admin/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    await db.run('DELETE FROM automations WHERE id = ?', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

// Execute automation endpoint
app.post('/api/admin/automations/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { triggerData } = req.body;
    
    const result = await executeAutomation(id, triggerData || {});
    res.json(result);
  } catch (error) {
    console.error('Error executing automation:', error);
    res.status(500).json({ error: 'Failed to execute automation' });
  }
});

// Automation execution function
async function executeAutomation(automationId, triggerData, sessionId = null, userAgent = null, ipAddress = null) {
  const startTime = Date.now();
  const db = await getDatabase();
  
  try {
    // Get automation and steps
    const automation = await db.get(`
      SELECT * FROM automations WHERE id = ? AND is_active = 1
    `, automationId);
    
    if (!automation) {
      throw new Error('Automation not found or inactive');
    }
    
    const steps = await db.all(`
      SELECT ast.*, w.* 
      FROM automation_steps ast
      JOIN webhooks w ON ast.webhook_id = w.id
      WHERE ast.automation_id = ? AND w.is_active = 1
      ORDER BY ast.step_order
    `, automationId);
    
    if (steps.length === 0) {
      throw new Error('No active steps found for automation');
    }
    
    // Log automation started event
    await logEvent({
      event_type: 'automation_executed',
      event_category: 'automation_activity',
      event_name: `Automation ${automation.name} Started`,
      description: `Automation ${automation.name} started execution with ${steps.length} steps`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        automation_id: automationId,
        automation_name: automation.name,
        trigger_type: automation.trigger_type,
        total_steps: steps.length,
        trigger_data: triggerData
      }
    });
    
    // Create execution record
    const executionResult = await db.run(`
      INSERT INTO automation_executions (
        automation_id, status, trigger_data, started_at
      ) VALUES (?, ?, ?, ?)
    `, [automationId, 'running', JSON.stringify(triggerData), new Date().toISOString()]);
    
    const executionId = executionResult.lastID;
    let completedSteps = 0;
    let lastError = null;
    
    for (const step of steps) {
      try {
        // Create step execution record
        const stepExecutionResult = await db.run(`
          INSERT INTO automation_step_executions (
            automation_execution_id, automation_step_id, webhook_id, 
            status, started_at
          ) VALUES (?, ?, ?, ?, ?)
        `, [executionId, step.id, step.webhook_id, 'running', new Date().toISOString()]);
        
        const stepExecutionId = stepExecutionResult.lastID;
        
        // Add delay if specified
        if (step.delay_seconds > 0) {
          await new Promise(resolve => setTimeout(resolve, step.delay_seconds * 1000));
        }
        
        // Execute webhook
        const webhookResult = await executeWebhook(step, triggerData, sessionId, userAgent, ipAddress);
        
        // Update step execution
        await db.run(`
          UPDATE automation_step_executions SET
            status = ?, webhook_response_status = ?, webhook_response_body = ?,
            error_message = ?, completed_at = ?
          WHERE id = ?
        `, [
          webhookResult.success ? 'completed' : 'failed',
          webhookResult.status_code,
          webhookResult.response_body,
          webhookResult.error_message,
          new Date().toISOString(),
          stepExecutionId
        ]);
        
        if (webhookResult.success) {
          completedSteps++;
        } else {
          lastError = webhookResult.error_message;
          if (!step.continue_on_failure) {
            break;
          }
        }
      } catch (stepError) {
        lastError = stepError.message;
        
        await db.run(`
          UPDATE automation_step_executions SET
            status = ?, error_message = ?, completed_at = ?
          WHERE automation_execution_id = ? AND automation_step_id = ?
        `, ['failed', stepError.message, new Date().toISOString(), executionId, step.id]);
        
        if (!step.continue_on_failure) {
          break;
        }
      }
    }
    
    // Update execution status
    const finalStatus = completedSteps === steps.length ? 'completed' : 'failed';
    const executionTime = Date.now() - startTime;
    
    await db.run(`
      UPDATE automation_executions SET
        status = ?, completed_at = ?, error_message = ?
      WHERE id = ?
    `, [finalStatus, new Date().toISOString(), lastError, executionId]);
    
    // Log automation completion event
    await logEvent({
      event_type: finalStatus === 'completed' ? 'automation_executed' : 'automation_failed',
      event_category: 'automation_activity',
      event_name: `Automation ${automation.name} ${finalStatus === 'completed' ? 'Completed' : 'Failed'}`,
      description: finalStatus === 'completed' 
        ? `Automation ${automation.name} completed successfully in ${executionTime}ms`
        : `Automation ${automation.name} failed: ${lastError}`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        automation_id: automationId,
        automation_name: automation.name,
        execution_id: executionId,
        completed_steps: completedSteps,
        total_steps: steps.length,
        execution_time_ms: executionTime,
        success: finalStatus === 'completed'
      }
    });
    
    return {
      success: finalStatus === 'completed',
      execution_id: executionId,
      completed_steps: completedSteps,
      total_steps: steps.length,
      error_message: lastError,
      execution_time_ms: executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Update execution as failed
    await db.run(`
      UPDATE automation_executions SET
        status = ?, completed_at = ?, error_message = ?
      WHERE automation_id = ? AND status = 'running'
    `, ['failed', new Date().toISOString(), error.message, automationId]);
    
    // Log automation error event
    await logEvent({
      event_type: 'automation_failed',
      event_category: 'automation_activity',
      event_name: `Automation ${automationId} Error`,
      description: `Automation execution failed: ${error.message}`,
      session_id: sessionId,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        automation_id: automationId,
        error_message: error.message,
        execution_time_ms: executionTime,
        success: false
      }
    });
    
    throw error;
  }
}

// Get automation executions
app.get('/api/admin/automations/:id/executions', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const db = await getDatabase();
    const executions = await db.all(`
      SELECT 
        id, automation_id, status, trigger_data, started_at, completed_at,
        error_message, created_at as createdAt
      FROM automation_executions 
      WHERE automation_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [id, parseInt(limit)]);
    
    const executionsWithParsedData = executions.map((execution) => ({
      ...execution,
      trigger_data: JSON.parse(execution.trigger_data || '{}'),
    }));
    
    res.json(executionsWithParsedData);
  } catch (error) {
    console.error('Error fetching automation executions:', error);
    res.status(500).json({ error: 'Failed to fetch automation executions' });
  }
});

// Events API endpoints
app.get('/api/admin/events', async (req, res) => {
  try {
    const {
      event_type,
      event_category,
      start_date,
      end_date,
      search,
      user_id,
      session_id,
      limit = 100,
      offset = 0
    } = req.query;

    const db = await getDatabase();
    let query = `
      SELECT 
        id, event_type, event_category, event_name, description,
        user_agent, ip_address, session_id, user_id, metadata,
        created_at as createdAt
      FROM system_events 
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (event_type) {
      query += ' AND event_type = ?';
      params.push(event_type);
    }
    
    if (event_category) {
      query += ' AND event_category = ?';
      params.push(event_category);
    }
    
    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(end_date);
    }
    
    if (search) {
      query += ' AND (event_name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    if (session_id) {
      query += ' AND session_id = ?';
      params.push(session_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const events = await db.all(query, params);
    
    // Parse metadata JSON and format dates
    const eventsWithParsedMetadata = events.map((event) => ({
      ...event,
      metadata: JSON.parse(event.metadata || '{}'),
      created_at: new Date(event.createdAt).toISOString(),
    }));

    res.json(eventsWithParsedMetadata);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/admin/events/summary', async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get total events
    const totalResult = await db.get('SELECT COUNT(*) as total FROM system_events');
    const total_events = totalResult.total;
    
    // Get events by type
    const typeResults = await db.all(`
      SELECT event_type, COUNT(*) as count 
      FROM system_events 
      GROUP BY event_type
    `);
    const events_by_type = typeResults.reduce((acc, row) => {
      acc[row.event_type] = row.count;
      return acc;
    }, {});
    
    // Get events by category
    const categoryResults = await db.all(`
      SELECT event_category, COUNT(*) as count 
      FROM system_events 
      GROUP BY event_category
    `);
    const events_by_category = categoryResults.reduce((acc, row) => {
      acc[row.event_category] = row.count;
      return acc;
    }, {});
    
    // Get time-based counts
    const todayResult = await db.get(`
      SELECT COUNT(*) as count 
      FROM system_events 
      WHERE DATE(created_at) = DATE('now')
    `);
    const events_today = todayResult.count;
    
    const weekResult = await db.get(`
      SELECT COUNT(*) as count 
      FROM system_events 
      WHERE created_at >= DATE('now', '-7 days')
    `);
    const events_this_week = weekResult.count;
    
    const monthResult = await db.get(`
      SELECT COUNT(*) as count 
      FROM system_events 
      WHERE created_at >= DATE('now', '-30 days')
    `);
    const events_this_month = monthResult.count;
    
    // Get most active sessions
    const sessionResults = await db.all(`
      SELECT session_id, COUNT(*) as event_count, MAX(created_at) as last_activity
      FROM system_events 
      WHERE session_id IS NOT NULL
      GROUP BY session_id 
      ORDER BY event_count DESC 
      LIMIT 10
    `);
    const most_active_sessions = sessionResults.map((session) => ({
      ...session,
      last_activity: new Date(session.last_activity).toISOString(),
    }));
    
    // Get recent errors
    const errorResults = await db.all(`
      SELECT 
        id, event_type, event_category, event_name, description,
        user_agent, ip_address, session_id, user_id, metadata,
        created_at as createdAt
      FROM system_events 
      WHERE event_category = 'error_tracking' OR event_type LIKE '%_failed'
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    const recent_errors = errorResults.map((event) => ({
      ...event,
      metadata: JSON.parse(event.metadata || '{}'),
      created_at: new Date(event.createdAt).toISOString(),
    }));

    res.json({
      total_events,
      events_by_type,
      events_by_category,
      events_today,
      events_this_week,
      events_this_month,
      most_active_sessions,
      recent_errors
    });
  } catch (error) {
    console.error('Error fetching event summary:', error);
    res.status(500).json({ error: 'Failed to fetch event summary' });
  }
});

app.get('/api/admin/events/analytics', async (req, res) => {
  try {
    const { time_period = 'day' } = req.query;
    const db = await getDatabase();
    
    let timeFormat, timeRange;
    switch (time_period) {
      case 'hour':
        timeFormat = '%Y-%m-%d %H:00:00';
        timeRange = '-24 hours';
        break;
      case 'week':
        timeFormat = '%Y-%m-%d';
        timeRange = '-7 days';
        break;
      case 'month':
        timeFormat = '%Y-%m-%d';
        timeRange = '-30 days';
        break;
      default: // day
        timeFormat = '%Y-%m-%d %H:00:00';
        timeRange = '-24 hours';
    }
    
    // Get event timeline
    const timelineResults = await db.all(`
      SELECT 
        strftime(?, created_at) as timestamp,
        event_type,
        COUNT(*) as count
      FROM system_events 
      WHERE created_at >= datetime('now', ?)
      GROUP BY strftime(?, created_at), event_type
      ORDER BY timestamp
    `, [timeFormat, timeRange, timeFormat]);
    
    // Process timeline data
    const timelineMap = new Map();
    timelineResults.forEach(row => {
      if (!timelineMap.has(row.timestamp)) {
        timelineMap.set(row.timestamp, { timestamp: row.timestamp, event_count: 0, event_type_breakdown: {} });
      }
      const entry = timelineMap.get(row.timestamp);
      entry.event_count += row.count;
      entry.event_type_breakdown[row.event_type] = row.count;
    });
    
    const event_timeline = Array.from(timelineMap.values());

    res.json({
      time_period,
      event_timeline,
      // Add more analytics as needed
      top_pages: [], // To be implemented with form view events
      conversion_funnel: { // To be implemented with form submission events
        views: 0,
        submissions: 0,
        successful_submissions: 0,
        conversion_rate: 0
      }
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

// Log custom event endpoint (for frontend to log events)
app.post('/api/events/log', async (req, res) => {
  try {
    const {
      event_type,
      event_category,
      event_name,
      description,
      metadata = {},
      session_id,
      user_id
    } = req.body;
    
    // Extract client info from request
    const user_agent = req.get('User-Agent');
    const ip_address = req.ip || req.connection.remoteAddress;
    
    await logEvent({
      event_type,
      event_category,
      event_name,
      description,
      user_agent,
      ip_address,
      session_id,
      user_id,
      metadata
    });
    
    // Update session activity
    if (session_id) {
      await updateSessionActivity(session_id, user_agent, ip_address);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging custom event:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on http://0.0.0.0:${PORT}`);
      console.log(`API available at http://0.0.0.0:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();