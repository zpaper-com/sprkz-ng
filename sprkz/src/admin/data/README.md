# Admin Data Initialization

This directory contains CSV files used to seed the SQLite database with initial data when the application starts.

## Files

### initial-features.csv
Contains the 13 interface features from the main PDF form interface:
- **Fields Toggle Button** - Show/hide field overlay
- **PDF Fit Width/Height Buttons** - PDF viewer controls  
- **Wizard Button** - Multi-state form completion guide
- **PDF Title/Filename Display** - Header information
- **Thumbnail Navigation** - Page thumbnails sidebar
- **Progress Indicators** - Wizard completion tracking
- **Form Interaction Features** - Tooltips, signatures, validation

### initial-urls.csv
Default URL configurations:
- `/makana` → `makana2025.pdf`
- `/tremfya` → `tremfya.pdf`

### initial-pdfs.csv
PDF file metadata (files should exist in `public/pdfs/`):
- `makana2025.pdf` (2MB)
- `tremfya.pdf` (1.5MB)

## Database Seeding

The `seeder.js` module automatically runs when the application starts:

1. **Checks if database is empty** - Only seeds if `features` table has no records
2. **Parses CSV files** - Handles quoted fields and commas within values
3. **Inserts initial data** - Features, URLs, PDFs, and settings
4. **Logging** - Shows seeding progress in console

## Adding New Initial Data

To modify initial data:

1. **Edit CSV files** - Use proper CSV format with quoted strings for commas
2. **Restart application** - Delete `data/admin.db` to force re-seeding
3. **Verify in admin** - Check `/admin` interface to confirm data loaded

## CSV Format Notes

- **Headers** - First row contains column names
- **Quoted fields** - Use double quotes for strings containing commas
- **Escaped quotes** - Use `""` for literal quote characters within quoted fields
- **JSON fields** - Features and pdf_fields columns contain JSON strings

Example:
```csv
name,description,notes
"Feature Name","Description with, comma","Notes with ""quotes"" inside"
```