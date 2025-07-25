# Sprkz-ng (Next Generation) Documentation

## Overview

**Sprkz-ng** is an interactive PDF form completion platform designed to provide guided, wizard-style navigation through PDF forms. Built as a React rewrite of the original Sprkz platform, it leverages PDF.js integration to enable intelligent form field detection, signature capture, and seamless form submission.

## Architecture

- **Frontend Framework**: React
- **PDF Engine**: PDF.js
- **Core Features**: 
  - Intelligent form field detection
  - Wizard-style navigation
  - Signature capture
  - Seamless form submission

## New Features (Feature Flag Controlled)

All new features are implemented behind feature flags for controlled rollout

### 1. Markup Tools

Enhanced document annotation capabilities allowing users to interact with PDFs beyond simple form filling.

#### 1.1 Image Stamp
- **Description**: Add image stamps to any location on the PDF
- **Use Cases**: Company logos, approval stamps, watermarks
- **Technical Implementation**: 
  - Upload or select from pre-defined stamp library defined in /admin as a separate tab
  - Drag-and-drop positioning
  - Resizable and rotatable stamps

#### 1.2 Highlight Area
- **Description**: Highlight specific regions of the PDF
- **Use Cases**: Drawing attention to important sections, marking reviewed areas
- **Features**:
  - Multiple highlight colors
  - Adjustable opacity
  - Rectangle and freeform selection tools

#### 1.3 Signature
- **Description**: Advanced signature capture and placement (reuse the existing signature interface)
- **Implementation Options**:
  - Draw signature with mouse/touch
  - Upload signature image
  - Type-to-sign with font selection
- **Features**:
  - Save signature for reuse in local storage
  - Multiple signature styles per user
  - Timestamp integration

#### 1.4 Date/Time Stamp
- **Description**: Insert current or custom date/time stamps
- **Features**:
  - Multiple date formats
  - Timezone support
  - Auto-update on document open (optional)
  - Custom formatting templates

#### 1.5 Editable Text Area
- **Description**: Add text annotations anywhere on the document
- **Features**:
  - Rich text formatting (bold, italic, underline)
  - Font selection and sizing
  - Text box with adjustable borders
  - Multi-line support

#### 1.6 Image Attachment Selection
- **Description**: Select and embed image attachments directly into the PDF
- **Workflow**:
  1. Browse attachment library
  2. Select image
  3. Position on document
  4. Resize and adjust as needed

### 2. Attachment Features

Comprehensive attachment management system for document-related files and images.

#### 2.1 Profile Picture Capture
- **Description**: Take or upload profile pictures
- **Features**:
  - In-app camera integration
  - Crop and edit functionality
  - Auto-resize for PDF embedding
  - Privacy controls

#### 2.2 Insurance Card Capture
- **Description**: Specialized workflow for insurance card documentation
- **Features**:
  - Front and back capture prompts
  - OCR integration for data extraction
  - Auto-enhancement for readability
  - Secure storage and encryption

#### 2.3 PDF Attachment
- **Description**: Add captured images directly to PDF
- **Implementation**:
  - Append as new pages
  - Embed as annotations
  - Link as external attachments
  - Compression options for file size management


## Feature Flag Management

this is implemented in /admin and uses a sqlite backend
you should look to how the other features were built

## Technical Considerations

### Performance
- Lazy load feature modules to minimize initial bundle size
- Optimize image compression for attachments






