# Form Wizard Feature Documentation

## Overview

The Form Wizard feature provides a guided, step-by-step experience for completing PDF forms. It automatically navigates users through required fields and signature fields in a logical order, ensuring all necessary information is collected before form submission.

## Features

### 1. Smart Field Navigation with Tooltips
- Automatically identifies and categorizes form fields:
  - **Required Fields**: Non-signature fields marked as required (excluding read-only fields)
  - **Signature Fields**: All signature type fields
- Navigates to fields in order: required fields first, then signatures
- Automatically scrolls to and highlights the current field
- **Field Tooltips**: Each focused field displays a tooltip with a "Next" button for quick navigation
  - Appears above or below the field based on available space
  - Contains a "Next" button to jump to the next required field
  - Automatically hides when scrolling or clicking elsewhere
  - Provides immediate access to navigation without returning to toolbar

### 2. Dynamic Button States
The wizard button dynamically changes based on form completion status:

- **"Start"** (Blue): Initial state, ready to begin the wizard
- **"Next"** (Orange): Navigate to the next required field
- **"Sign"** (Purple): Navigate to signature fields (after all required fields are complete)
- **"Submit"** (Green): Submit the completed form

### 3. Visual Field Highlighting
When navigating to a field:
- The page containing the field is automatically displayed
- The field receives focus for immediate input
- A blue outline highlights the field for 3 seconds
- The field is scrolled into view with smooth animation

### 4. Real-time Progress Tracking
- Fields are marked as completed when values are entered
- The wizard button automatically updates based on completion status
- Supports all field types: text, checkbox, radio, dropdown, and signatures

### 5. Submission Dialog
Upon completion, a modal dialog confirms successful form submission with:
- Success message
- Professional styling with overlay
- OK button to close and reset the wizard

## User Workflow

1. **Start**: Click the "Start" button to begin the wizard
2. **Fill Required Fields**: The wizard navigates to each required field
   - Enter values in the highlighted fields
   - Use the tooltip "Next" button for quick navigation to the next field
   - Or click "Next" in the toolbar to move to the next field
3. **Add Signatures**: After all required fields, add any signatures
   - Click "Sign" to navigate to signature fields
   - Continue using the tooltip for field-to-field navigation
4. **Submit**: Once all fields are complete, click "Submit"
5. **Confirmation**: View the submission confirmation and click OK

## Quick Navigation

The tooltip feature enables rapid form completion:
- **Tooltip Next Button**: Appears at each field for immediate navigation
- **Keyboard Support**: Tab to fields, then click Next in tooltip
- **No Scrolling Required**: Stay focused on fields without returning to toolbar
- **Smart Positioning**: Tooltip adjusts position to avoid viewport edges

## Technical Implementation

### State Management
```javascript
wizardState: 'start' | 'next' | 'sign' | 'submit'
currentFieldIndex: Current field being processed
requiredFields: Array of required form fields
signatureFields: Array of signature fields
completedFields: Set of completed field names
```

### Key Functions
- `categorizeFields()`: Sorts fields into required and signature categories
- `navigateToField(field)`: Navigates to and highlights a specific field
- `getNextField()`: Determines the next incomplete field to visit
- `updateWizardButton()`: Updates button text and style based on state
- `showSubmissionDialog()`: Displays the submission confirmation
- `showFieldTooltip(fieldElement)`: Shows tooltip with Next button at field
- `hideFieldTooltip()`: Hides the current tooltip
- `wizardNextField()`: Handles navigation from tooltip button

### Field Detection
The wizard uses PDF.js annotations to detect form fields:
- Extracts field metadata including name, type, and requirements
- Excludes read-only fields from validation
- Maintains field-to-page mapping for navigation

## Styling

The wizard uses distinct colors for each state:
- Start: Blue (#2196F3)
- Next: Orange (#FF9800)
- Sign: Purple (#9C27B0)
- Submit: Green (#4CAF50)

## Browser Compatibility

The wizard feature is compatible with:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with touch support

## Accessibility

- Full keyboard navigation support
- Focus management for screen readers
- Clear visual indicators for current field
- Smooth scrolling for better orientation

## Future Enhancements

Potential improvements could include:
- Progress indicator showing completion percentage
- Field validation with error messages
- Save and resume functionality
- Multi-language support
- Customizable field order preferences