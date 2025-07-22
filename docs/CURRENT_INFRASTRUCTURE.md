# Current Infrastructure Documentation

## Overview

This document describes the current deployment configuration for the sprkz-ng project.

## Deployment Details

### Basic Information
- **Service Name**: sprkz-ng
- **Port**: 7779 (spells "SPRZ" on phone keypad)
- **Domain**: sprkz-ng.zpaper.com
- **Build Tool**: Create React App
- **Framework**: React with TypeScript

### React Development Configuration
The React application is configured to run on port 7779 for development consistency:

```bash
# Start development server
PORT=7779 npm start

# Production build
npm run build

# Serve production build
serve -s build -l 7779
```

### Environment Configuration
The application uses environment variables for configuration:

```bash
PORT=7779
REACT_APP_PDF_WORKER_URL=/pdf.worker.min.js
REACT_APP_DEFAULT_PDF=/pdfs/makana2025.pdf
```

## Production Deployment

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Serve static files
serve -s build -l 7779
```

### File Structure
```
sprkz-pdf-forms/
├── public/
│   ├── pdf.worker.min.js     # PDF.js worker
│   └── pdfs/
│       └── makana2025.pdf    # Default PDF file
├── src/                      # React source code
├── build/                    # Production build output
└── package.json             # Dependencies and scripts
```

### Static File Serving
The React application serves:
- PDF files from `/pdfs/` directory
- PDF.js worker from `/pdf.worker.min.js`
- Static assets (CSS, JS, images)

### Browser Support
- Chrome 90+ (primary target)
- Firefox 88+
- Safari 14+ (desktop and mobile)
- Edge 90+
- Mobile browsers: iOS Safari, Chrome Mobile

## Development Workflow

### Phase-Based Development
The project follows a phase-based development approach where:
1. Each phase implements specific features
2. After implementation, start the development server
3. Test functionality manually in the browser
4. Validate with stakeholders before proceeding to next phase

### Testing Protocol
For each development phase:
```bash
# Start development server
npm start

# Test in browser at http://localhost:7779
# Verify all features work correctly
# Check browser console for errors
# Validate with user before proceeding
```

### Production Deployment Steps
1. Complete all development phases with testing
2. Create production build: `npm run build`
3. Test production build locally
4. Deploy build directory to web server
5. Configure server to serve on port 7779
6. Verify all functionality works in production

## Support

For development and deployment issues:
1. Check React development server logs
2. Verify build process completes without errors
3. Test PDF files are accessible in `/pdfs/` directory
4. Check browser console for JavaScript errors
5. Verify port 7779 is available and not blocked