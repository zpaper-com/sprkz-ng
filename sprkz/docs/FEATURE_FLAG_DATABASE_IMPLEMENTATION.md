# Feature Flag Database Implementation Guide

This document describes how to implement feature flags in the Sprkz application database system, following the established patterns used for components like the Field Tooltip System.

## Overview

Feature flags in Sprkz are database-driven toggles that dynamically control UI element visibility and functionality. They are managed through an admin interface and stored in the database with URL-specific configurations.

## Database Schema

### Features Table
```sql
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  notes TEXT,
  creation_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### URL Configurations Table
```sql
CREATE TABLE url_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  pdf_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  features TEXT, -- JSON object: {"1": true, "2": false}
  pdf_fields TEXT -- JSON object: {"fieldName": "read-only|hidden|normal"}
);
```

## Feature Flag Implementation Pattern

### 1. Feature Definition in Database

Each feature flag is stored in the `features` table with:
- **id**: Unique identifier for the feature
- **name**: Human-readable feature name (e.g., "Field Tooltip System")
- **description**: Brief description of what the feature does
- **notes**: Implementation details or usage notes
- **creation_date**: Timestamp when feature was created

### 2. URL-Specific Feature Configuration

The `url_configs` table maps URL paths to feature states:
- **path**: URL route (e.g., "/makana", "/tremfya")
- **features**: JSON object mapping feature IDs to boolean states
- **pdf_fields**: JSON object for field-specific configurations

Example:
```json
{
  "path": "/makana",
  "features": {
    "11": true,  // Field Tooltip System enabled
    "12": false, // Signature Modal disabled
    "13": true   // Form Validation Display enabled
  }
}
```

### 3. Feature Flag Usage in Components

Components check feature flags through the admin context system:

```typescript
// Example: Field Tooltip implementation
import { useAdmin } from '../contexts/AdminContext';

const MyComponent: React.FC = () => {
  const { state } = useAdmin();
  
  // Get current URL configuration
  const currentPath = window.location.pathname;
  const urlConfig = state.urls.find(url => url.path === currentPath);
  
  // Check if Field Tooltip System (ID: 11) is enabled
  const isTooltipEnabled = urlConfig?.features[11] === true;
  
  return (
    <div>
      {isTooltipEnabled && (
        <FieldTooltip
          anchorEl={anchorElement}
          fieldId={currentFieldId}
          placement="top"
        />
      )}
    </div>
  );
};
```

## Step-by-Step Implementation Process

### 1. Add Feature to Database

Through the admin interface (`/admin`):
1. Navigate to "Features" tab
2. Click "Add Feature"
3. Fill in feature details:
   - **Name**: Descriptive feature name
   - **Description**: What the feature does
   - **Notes**: Implementation details

### 2. Configure Feature for URLs

In the "URL Configuration" tab:
1. Select or create URL configuration
2. Toggle the feature on/off for specific URLs
3. Save configuration

### 3. Implement Feature Flag Check

In the component code:
```typescript
// Get feature state from admin context
const { state } = useAdmin();
const urlConfig = getCurrentURLConfig(state.urls);
const isFeatureEnabled = urlConfig?.features[FEATURE_ID] === true;

// Conditionally render component
{isFeatureEnabled && <YourComponent />}
```

## Current Feature Flags (Reference)

| ID | Feature Name | Description | Implementation |
|----|-------------|-------------|----------------|
| 1 | Fields Toggle Button | Show/hide field names overlay | PDF form container header |
| 2 | PDF Fit Width Button | Fit PDF to container width | PDF viewer controls |
| 3 | PDF Fit Height Button | Fit PDF to container height | PDF viewer controls |
| 4 | Wizard Button | Multi-state guided completion | Dynamic button states |
| 5 | PDF Title Display | Page counter in header | Typography component |
| 6 | PDF Filename Display | Current PDF filename | Header subtitle |
| 7 | Thumbnail Navigation | Clickable page thumbnails | Left sidebar |
| 8 | Wizard Status Indicator | Wizard mode progress | Progress display |
| 9 | Mini Progress Indicator | Circular completion ratio | Progress widget |
| 10 | Progress Tracker | Linear progress bar | Header progress |
| **11** | **Field Tooltip System** | **Interactive field guidance** | **Popper-based tooltips** |
| 12 | Signature Modal | Signature capture interface | Modal dialog |
| 13 | Form Validation Display | Real-time field validation | PDF overlay |

## Feature Flag Best Practices

### 1. Naming Convention
- Use descriptive, human-readable names
- Include the UI component type (Button, Modal, System, etc.)
- Be specific about functionality

### 2. Database Management
- Always add features through the admin interface
- Include detailed descriptions and notes
- Set appropriate default states for new URLs

### 3. Code Implementation
- Check feature flags at the component level
- Use conditional rendering for UI elements
- Fail gracefully when features are disabled
- Cache feature states to avoid repeated lookups

### 4. Testing
- Test both enabled and disabled states
- Verify URL-specific configurations work correctly
- Ensure graceful degradation when features are off

## Example: Adding a New Feature Flag

### Step 1: Database Entry
```sql
INSERT INTO features (name, description, notes) VALUES (
  'Export Button',
  'PDF export functionality with format options',
  'Allows users to export filled forms as PDF, with options for format and quality settings'
);
```

### Step 2: URL Configuration
```json
{
  "path": "/makana",
  "features": {
    "14": true  // Enable Export Button for Makana forms
  }
}
```

### Step 3: Component Implementation
```typescript
const ExportSection: React.FC = () => {
  const { state } = useAdmin();
  const urlConfig = getCurrentURLConfig(state.urls);
  const isExportEnabled = urlConfig?.features[14] === true;
  
  if (!isExportEnabled) return null;
  
  return (
    <Button onClick={handleExport} startIcon={<SaveIcon />}>
      Export PDF
    </Button>
  );
};
```

## API Integration

When the backend API is implemented, replace mock data with actual API calls:

```typescript
// Feature management
await adminAPI.createFeature(featureData);
await adminAPI.updateFeature(id, updates);
await adminAPI.deleteFeature(id);

// URL configuration
await adminAPI.updateURLConfig(id, { features: newFeatureStates });
```

## Real-time Updates

The system supports WebSocket updates for real-time feature flag changes:

```typescript
// WebSocket handlers in AdminContext
case 'feature:created':
  dispatch({ type: 'ADD_FEATURE', payload: data });
  break;
case 'feature:updated':
  dispatch({ type: 'UPDATE_FEATURE', payload: data });
  break;
```

This allows feature flags to be toggled in the admin interface and immediately reflected in user sessions without requiring page refreshes.