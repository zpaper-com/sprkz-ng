-- Admin Interface Database Schema for Sprkz PDF Forms App

-- Features table - stores all available feature flags
CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    notes TEXT,
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URLs table - stores URL path configurations  
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    pdfPath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URL Features junction table - links URLs to enabled features
CREATE TABLE IF NOT EXISTS url_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    urlId INTEGER NOT NULL,
    featureId INTEGER NOT NULL,
    enabled BOOLEAN DEFAULT false,
    FOREIGN KEY (urlId) REFERENCES urls(id) ON DELETE CASCADE,
    FOREIGN KEY (featureId) REFERENCES features(id) ON DELETE CASCADE,
    UNIQUE(urlId, featureId)
);

-- PDF Fields table - stores field configuration for each URL/PDF combination
CREATE TABLE IF NOT EXISTS pdf_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    urlId INTEGER NOT NULL,
    pdfPath TEXT NOT NULL,
    fieldName TEXT NOT NULL,
    status TEXT CHECK(status IN ('read-only', 'hidden', 'normal')) DEFAULT 'normal',
    FOREIGN KEY (urlId) REFERENCES urls(id) ON DELETE CASCADE,
    UNIQUE(urlId, fieldName)
);

-- Settings table - stores global configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('defaultPdf', 'makana2025.pdf'),
    ('theme', 'light');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_url_features_url ON url_features(urlId);
CREATE INDEX IF NOT EXISTS idx_url_features_feature ON url_features(featureId);
CREATE INDEX IF NOT EXISTS idx_pdf_fields_url ON pdf_fields(urlId);
CREATE INDEX IF NOT EXISTS idx_pdf_fields_pdf ON pdf_fields(pdfPath);

-- Insert sample data for development/testing
INSERT OR IGNORE INTO features (name, description, notes) VALUES
    ('wizard_mode', 'Guided form completion with step-by-step navigation', 'Enables the wizard button and navigation system'),
    ('mobile_interface', 'Mobile-optimized UI for tablets and phones', 'Responsive design with touch-friendly controls'),
    ('signature_canvas', 'HTML5 canvas-based signature capture', 'Allows drawing signatures with mouse/touch/stylus'),
    ('signature_typed', 'Text-based signature with font selection', 'Typed signatures with serif, sans-serif, cursive options'),
    ('field_validation', 'Real-time form field validation', 'Validates required fields and data formats'),
    ('progress_tracking', 'Visual progress indicator for form completion', 'Shows completion percentage and remaining fields'),
    ('thumbnail_sidebar', 'PDF page thumbnails for quick navigation', 'Side panel with clickable page previews'),
    ('debug_mode', 'Developer tools and field inspection', 'Shows field boundaries and metadata for debugging');

-- Insert sample URL configurations
INSERT OR IGNORE INTO urls (path, pdfPath) VALUES
    ('/makana', 'makana2025.pdf'),
    ('/tremfya', 'tremfya.pdf'),
    ('/demo', 'makana2025.pdf');

-- Enable some features for sample URLs (assuming IDs 1-3 for URLs and 1-8 for features)
INSERT OR IGNORE INTO url_features (urlId, featureId, enabled) VALUES
    -- Makana form with full features
    (1, 1, true),  -- wizard_mode
    (1, 2, true),  -- mobile_interface  
    (1, 3, true),  -- signature_canvas
    (1, 4, true),  -- signature_typed
    (1, 5, true),  -- field_validation
    (1, 6, true),  -- progress_tracking
    (1, 7, true),  -- thumbnail_sidebar
    -- Tremfya form with basic features
    (2, 1, true),  -- wizard_mode
    (2, 3, true),  -- signature_canvas
    (2, 5, true),  -- field_validation
    -- Demo form with debug features
    (3, 1, true),  -- wizard_mode
    (3, 5, true),  -- field_validation
    (3, 8, true);  -- debug_mode