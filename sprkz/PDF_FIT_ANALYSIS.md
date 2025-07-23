# PDF Fit-to-Width/Height Implementation Analysis

## What I'm Trying to Accomplish

Implement proper fit-to-width and fit-to-height functionality for PDF viewing, similar to what's found in the official PDF.js viewer. Specifically:

- **Fit-to-Width**: Scale the PDF page so its width exactly matches the available container width
- **Fit-to-Height**: Scale the PDF page so its height exactly matches the available container height  
- **Responsive**: Update scaling automatically when container size changes
- **Multi-layer Coordination**: Ensure canvas, annotation layer, and text layer all scale together properly

The buttons should work like standard PDF viewers where clicking "fit to width" immediately resizes the PDF to fill the container width while maintaining aspect ratio.

## What I Found About the Correct PDF.js Approach

### Research from PDF.js Source Code

1. **Scale Calculation Method**:
   ```javascript
   // Get unscaled page dimensions
   const unscaledViewport = page.getViewport({ scale: 1.0 });
   
   // Calculate fit scales
   const pageWidthScale = containerWidth / unscaledViewport.width;
   const pageHeightScale = containerHeight / unscaledViewport.height;
   ```

2. **PDF.js Viewer Implementation**:
   - Uses `"page-width"`, `"page-height"`, and `"page-fit"` as scale values
   - The `PDFViewer.setScale()` method handles these string values
   - Container dimensions account for padding and scrollbars
   - Device pixel ratio is handled separately in rendering

3. **Multi-layer Architecture**:
   - Canvas layer renders the visual PDF content
   - Text layer enables text selection (must match canvas scaling)
   - Annotation layer renders interactive form fields (must match canvas scaling)
   - All layers use the same viewport for coordinate alignment

4. **Viewport Management**:
   ```javascript
   const viewport = page.getViewport({ scale: calculatedScale });
   // All layers use this same viewport for consistency
   ```

### Key Constants and Patterns
- PDF.js uses 72 DPI as the base scale reference
- `PixelsPerInch.PDF_TO_CSS_UNITS` for unit conversions
- `outputScale = window.devicePixelRatio || 1` for high-DPI displays
- Container measurements exclude margins/padding

## Why I Think I Keep Failing

### 1. **Container Measurement Issues**
**Problem**: I may be measuring the wrong container element.
- The PDF is nested in multiple containers (viewer container → flex container → canvas parent)
- I'm using `canvasRef.current!.parentElement!` but this might not be the actual constraining container
- The container that determines available space might be higher up in the DOM tree

**Evidence**: Scale calculations seem mathematically correct but visual results don't match

### 2. **Layer Coordination Failures**
**Problem**: Not all layers are updating consistently when scale changes.
- Canvas layer renders at new scale
- Annotation layer may still use old dimensions
- Text layer may not be re-rendered with new viewport
- Field overlays and highlights may be positioned incorrectly

**Evidence**: Form fields appear misaligned after scale changes

### 3. **Service Layer Abstraction Issues**
**Problem**: Using `pdfService.renderPageWithCancellation()` instead of direct PDF.js calls.
- The service may not properly handle the scale parameter I'm passing
- The service might be applying its own scaling logic
- Device pixel ratio handling might be inconsistent between my calculations and the service

**Evidence**: The service is a black box that might not respect my scale calculations

### 4. **Timing and Race Conditions**
**Problem**: Scale calculation happening at wrong time.
- Container might not be fully rendered when I measure it
- ResizeObserver might fire before layout is complete
- Multiple renders triggered by state changes might interfere

**Evidence**: Inconsistent behavior and console logs showing unexpected values

### 5. **Device Pixel Ratio Confusion**
**Problem**: Not properly accounting for high-DPI displays.
- PDF.js handles device pixel ratio internally
- Canvas internal dimensions vs styled dimensions mismatch
- Annotation layer coordinates may not account for pixel ratio scaling

**Evidence**: Different behavior on different devices/zoom levels

### 6. **React State Management Issues**
**Problem**: State updates not triggering proper re-renders.
- `calculateScale` is in a useCallback but dependencies might be wrong
- Setting `setCurrentPageObj((prev) => prev)` to force re-render is a hack
- Multiple useEffect hooks might be interfering with each other

**Evidence**: Need to force re-renders suggests state management problems

### 7. **Missing PDF.js Viewer Integration**
**Problem**: Trying to reimplement functionality that PDF.js already provides.
- PDF.js has a complete `PDFViewer` class with fit modes built-in
- I'm trying to implement this at a lower level with individual page rendering
- Missing the higher-level viewer abstraction that handles fit modes properly

**Evidence**: Official PDF.js examples work perfectly, my implementation doesn't

## Root Cause Analysis

The fundamental issue appears to be **architectural mismatch**. I'm trying to implement viewer-level functionality (fit modes) at the page-rendering level. 

### The Real PDF.js Architecture:
```
PDFViewer (handles fit modes, scale management)
  ├── PDFPageView[] (individual page rendering)
  │   ├── Canvas Layer
  │   ├── Text Layer  
  │   └── Annotation Layer
  └── Scale Management (coordinated across all pages)
```

### My Current Architecture:
```
PDFViewer Component (trying to do everything)
  ├── Single Page Rendering
  ├── Manual Scale Calculation
  └── Layer Management (incomplete)
```

## Recommended Solution Path

1. **Use PDF.js PDFViewer Class**: Instead of manual page rendering, use the actual PDF.js `PDFViewer` class that has fit modes built-in.

2. **Proper Container Integration**: Set up the container structure that PDF.js expects for proper measurement.

3. **Event-Driven Scale Changes**: Use PDF.js events and API to change scale modes rather than manual calculation.

4. **Layer Delegation**: Let PDF.js handle all layer coordination instead of managing it manually.

The current approach of trying to reimplement PDF.js viewer functionality from scratch is the core problem. The solution is to use PDF.js as intended rather than fighting against its architecture.