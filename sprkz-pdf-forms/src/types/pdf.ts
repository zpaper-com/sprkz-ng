// PDF.js related types
export interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date' | 'unknown';
  value: string | boolean | string[];
  required: boolean;
  readOnly: boolean;
  page: number;
  rect: [number, number, number, number]; // [x1, y1, x2, y2]
  isComplete: boolean;
  validationErrors: string[];
  options?: string[]; // For dropdown/radio fields
  multiline?: boolean;
  maxLength?: number;
  pattern?: string; // For validation regex
  id: string;
  subtype?: string;
}

export interface PDFDocumentInfo {
  numPages: number;
  fingerprint: string;
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  formFields: FormField[];
  hasFormFields: boolean;
  thumbnail?: string;
}

export interface PDFRenderOptions {
  scale: number;
  rotation?: number;
  renderInteractiveForms?: boolean;
}

export interface PDFViewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

// Application state types
export interface PDFState {
  document: any; // PDFDocumentProxy
  currentPage: number;
  totalPages: number;
  scale: number;
  loading: boolean;
  error: string | null;
  documentInfo: PDFDocumentInfo | null;
  pages: Map<number, PDFPageInfo>;
}

export interface PDFAction {
  type: 'LOAD_START' | 'LOAD_SUCCESS' | 'LOAD_ERROR' | 'SET_PAGE' | 'SET_SCALE' | 'ADD_PAGE_INFO' | 'CLEAR_ERROR';
  payload?: any;
}

// Form-related types
export interface FormFieldValue {
  fieldName: string;
  value: string | boolean | string[];
  page: number;
  isValid: boolean;
  errors: string[];
}

export interface FormState {
  fields: Map<string, FormFieldValue>;
  currentFieldIndex: number;
  completedFields: string[];
  requiredFields: string[];
  totalRequiredFields: number;
  completionPercentage: number;
  isValid: boolean;
}