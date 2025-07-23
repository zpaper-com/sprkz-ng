# Admin Interface Specification for PDF Forms App

## Overview
React MUI-based admin interface for managing feature flags, PDF forms, and URL configurations with live updates via WebSockets.

## Database Schema

### 1. `features` table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `notes` (TEXT)
- `creationDate` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 2. `urls` table
- `id` (INTEGER PRIMARY KEY)
- `path` (TEXT UNIQUE NOT NULL)
- `pdfPath` (TEXT)
- `createdAt` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 3. `url_features` table
- `id` (INTEGER PRIMARY KEY)
- `urlId` (INTEGER FOREIGN KEY → urls.id)
- `featureId` (INTEGER FOREIGN KEY → features.id)
- `enabled` (BOOLEAN DEFAULT false)
- UNIQUE(urlId, featureId)

### 4. `pdf_fields` table
- `id` (INTEGER PRIMARY KEY)
- `urlId` (INTEGER FOREIGN KEY → urls.id)
- `pdfPath` (TEXT NOT NULL)
- `fieldName` (TEXT NOT NULL)
- `status` (TEXT CHECK(status IN ('read-only', 'hidden', 'normal')) DEFAULT 'normal')
- UNIQUE(urlId, fieldName)

### 5. `settings` table
- `id` (INTEGER PRIMARY KEY)
- `key` (TEXT UNIQUE NOT NULL)
- `value` (TEXT)
- `updatedAt` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- Keys: 'defaultPdf', 'theme'

## Core Features

### 1. Feature Management Section
- **Display**: DataGrid/Table showing all features from the `features` table
- **Columns**: Name, Description, Notes, Creation Date
- **Actions**: 
  - Add new feature (Dialog with form)
  - Edit existing feature
  - Delete feature (with confirmation)
- **Real-time**: Updates via WebSocket when features are added/modified/deleted

### 2. URL Configuration Section
- **Display**: List of configured URLs with expansion panels
- **Reserved URLs**: Block creation of `/mobile`, `/health`, `/admin`, `/`
- **For each URL**:
  - Path display with edit/delete options
  - PDF selection dropdown (shows all PDFs from `sparkz/public/pdfs/`)
  - Feature toggles section:
    - List of all features with large MUI Switch components
    - Toggle state saved to `url_features` table
  - PDF field configuration:
    - List all fields detected in selected PDF
    - Status dropdown for each field (read-only, hidden, normal)
    - Saves to `pdf_fields` table
- **Add URL**: Button opens dialog to create new URL configuration

### 3. PDF Management Section
- **Current PDFs**: Grid view of all PDFs in `sparkz/public/pdfs/`
  - Preview thumbnail for each PDF
  - Set as default option
  - Delete option (with usage check)
- **Upload Area**: 
  - Drag-and-drop zone with MUI styling
  - File validation (PDF format, size limits)
  - Progress indicator during upload
  - Preview modal after successful upload
- **Default PDF**: Dropdown to select global default from available PDFs

### 4. Theme Settings
- **Toggle**: Light/Dark theme switch in app bar
- **Persistence**: Save preference to `settings` table
- **Application**: Applied globally across admin interface

## Technical Implementation Details

### WebSocket Integration
- **Events**:
  - `feature:created`, `feature:updated`, `feature:deleted`
  - `url:created`, `url:updated`, `url:deleted`
  - `settings:updated`
- **Client**: Auto-reconnect on disconnect
- **Server**: Broadcast changes to all connected admin clients

### API Endpoints
- `GET /api/admin/features` - List all features
- `POST /api/admin/features` - Create feature
- `PUT /api/admin/features/:id` - Update feature
- `DELETE /api/admin/features/:id` - Delete feature
- `GET /api/admin/urls` - List all URL configurations
- `POST /api/admin/urls` - Create URL configuration
- `PUT /api/admin/urls/:id` - Update URL configuration
- `DELETE /api/admin/urls/:id` - Delete URL configuration
- `GET /api/admin/pdfs` - List all PDFs
- `POST /api/admin/pdfs/upload` - Upload new PDF
- `DELETE /api/admin/pdfs/:filename` - Delete PDF
- `GET /api/admin/pdf-fields/:filename` - Get fields for a PDF
- `PUT /api/admin/url-features/:urlId` - Update feature states for URL
- `PUT /api/admin/pdf-fields/:urlId` - Update field configurations for URL
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings

### Logging
- Winston integration for all admin actions
- Log format: `[timestamp] [level] [action] [user] [details]`
- Actions logged: Feature CRUD, URL CRUD, PDF uploads/deletes, Setting changes

### UI Components Structure
```
AdminInterface/
├── components/
│   ├── FeatureManagement/
│   │   ├── FeatureTable.jsx
│   │   ├── FeatureDialog.jsx
│   │   └── FeatureRow.jsx
│   ├── URLConfiguration/
│   │   ├── URLList.jsx
│   │   ├── URLPanel.jsx
│   │   ├── FeatureToggles.jsx
│   │   └── PDFFieldConfig.jsx
│   ├── PDFManagement/
│   │   ├── PDFGrid.jsx
│   │   ├── PDFUploadZone.jsx
│   │   └── PDFPreviewModal.jsx
│   └── Common/
│       ├── ThemeToggle.jsx
│       ├── ConfirmDialog.jsx
│       └── LoadingSpinner.jsx
├── hooks/
│   ├── useWebSocket.js
│   └── useTheme.js
├── services/
│   ├── api.js
│   └── websocket.js
└── AdminInterface.jsx
```

### State Management
- Use React Context for global state (features, urls, settings)
- WebSocket updates trigger context updates
- Local component state for UI interactions

### Error Handling
- Toast notifications for user feedback
- Graceful degradation if WebSocket fails
- Validation on all inputs before API calls
- Rollback UI on failed operations

### Performance Considerations
- Virtualized lists for large feature sets
- Lazy load PDF previews
- Debounce rapid toggle changes
- Cache PDF field detection results

## User Flow

1. **Initial Load**:
   - Fetch all features, URLs, PDFs, and settings
   - Establish WebSocket connection
   - Apply saved theme preference

2. **Creating a URL Configuration**:
   - Click "Add URL" → Enter path (validate against reserved)
   - Select PDF (or use default)
   - System detects PDF fields
   - Enable/disable features via toggles
   - Configure field statuses
   - Save configuration

3. **Managing Features**:
   - View all features in table
   - Add/Edit via dialog forms
   - Changes broadcast to all clients
   - URLs using deleted features handle gracefully

4. **PDF Workflow**:
   - View current PDFs in grid
   - Drag new PDF to upload zone
   - Preview uploaded PDF
   - Set as default if desired
   - Configure in URL settings

## Security Considerations
- Validate PDF files before processing
- Sanitize all inputs
- Rate limit API endpoints
- Log all administrative actions
- Validate URL paths (no path traversal)

## Future Enhancements (Not in current scope)
- Authentication and role-based access
- Feature flag scheduling
- A/B testing capabilities
- PDF template builder
- Audit trail UI
- Import/Export configurations
