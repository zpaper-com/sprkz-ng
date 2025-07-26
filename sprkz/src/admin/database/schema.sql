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

-- URL Configurations table - stores URL path configurations with layout selection
CREATE TABLE IF NOT EXISTS url_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    pdf_path TEXT,
    desktop_layout_id INTEGER,
    mobile_layout_id INTEGER,
    pdf_fields TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (desktop_layout_id) REFERENCES layouts(id),
    FOREIGN KEY (mobile_layout_id) REFERENCES layouts(id)
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

-- Layouts table - stores layout configurations with features
CREATE TABLE IF NOT EXISTS layouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'desktop',
    description TEXT,
    viewport TEXT,
    components TEXT DEFAULT '[]',
    features TEXT DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks table - stores webhook configurations
CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'POST',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    retry_enabled BOOLEAN NOT NULL DEFAULT 1,
    retry_count INTEGER NOT NULL DEFAULT 3,
    retry_delay_seconds INTEGER NOT NULL DEFAULT 30,
    timeout_seconds INTEGER NOT NULL DEFAULT 30,
    headers TEXT DEFAULT '{}',
    payload_type TEXT NOT NULL DEFAULT 'json',
    payload_template TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Events table - stores webhook execution history
CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    payload_file_path TEXT,
    response_status INTEGER,
    response_body TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt_at DATETIME,
    next_retry_at DATETIME,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
);

-- Webhook PDF Templates table - stores PDF generation templates for webhooks
CREATE TABLE IF NOT EXISTS webhook_pdf_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    webhook_id INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    template_file_path TEXT,
    template_html TEXT,
    template_variables TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
);

-- Automations table - stores automation configurations
CREATE TABLE IF NOT EXISTS automations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    trigger_type TEXT NOT NULL DEFAULT 'manual',
    trigger_config TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation Steps table - stores webhook sequences for automations
CREATE TABLE IF NOT EXISTS automation_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL,
    webhook_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    is_conditional BOOLEAN NOT NULL DEFAULT 0,
    condition_config TEXT DEFAULT '{}',
    delay_seconds INTEGER NOT NULL DEFAULT 0,
    retry_on_failure BOOLEAN NOT NULL DEFAULT 1,
    continue_on_failure BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automation_id) REFERENCES automations (id) ON DELETE CASCADE,
    FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE,
    UNIQUE(automation_id, step_order)
);

-- Automation Executions table - stores execution history
CREATE TABLE IF NOT EXISTS automation_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    trigger_data TEXT DEFAULT '{}',
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automation_id) REFERENCES automations (id) ON DELETE CASCADE
);

-- Automation Step Executions table - stores individual step execution details
CREATE TABLE IF NOT EXISTS automation_step_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    automation_execution_id INTEGER NOT NULL,
    automation_step_id INTEGER NOT NULL,
    webhook_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    webhook_response_status INTEGER,
    webhook_response_body TEXT,
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (automation_execution_id) REFERENCES automation_executions (id) ON DELETE CASCADE,
    FOREIGN KEY (automation_step_id) REFERENCES automation_steps (id) ON DELETE CASCADE,
    FOREIGN KEY (webhook_id) REFERENCES webhooks (id) ON DELETE CASCADE
);

-- System Events table - stores all system events for monitoring and analytics
CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_name TEXT NOT NULL,
    description TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    session_id TEXT,
    user_id TEXT,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Sessions table - tracks user sessions for analytics
CREATE TABLE IF NOT EXISTS event_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    first_event_at DATETIME,
    last_event_at DATETIME,
    total_events INTEGER DEFAULT 0,
    session_duration_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_category ON system_events(event_category);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_session_id ON system_events(session_id);
CREATE INDEX IF NOT EXISTS idx_system_events_user_id ON system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_session_id ON event_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_event_sessions_created_at ON event_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_url_configs_desktop_layout_id ON url_configs(desktop_layout_id);
CREATE INDEX IF NOT EXISTS idx_url_configs_mobile_layout_id ON url_configs(mobile_layout_id);
CREATE INDEX IF NOT EXISTS idx_layouts_is_default ON layouts(is_default);
CREATE INDEX IF NOT EXISTS idx_layouts_is_active ON layouts(is_active);