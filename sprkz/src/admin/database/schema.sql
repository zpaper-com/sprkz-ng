-- Admin Interface Database Schema for Sprkz PDF Forms App

-- Features table - stores all available feature flags
CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- URL Configurations table - stores URL path configurations with JSON fields
CREATE TABLE IF NOT EXISTS url_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    pdf_path TEXT,
    features TEXT DEFAULT '{}',
    pdf_fields TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PDF Files table - stores uploaded PDF metadata
CREATE TABLE IF NOT EXISTS pdf_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table - stores global configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);