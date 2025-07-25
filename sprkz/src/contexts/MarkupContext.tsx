import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { MarkupTool } from '../components/markup/MarkupToolbar';

// Markup annotation types
export interface BaseMarkupAnnotation {
  id: string;
  type: MarkupTool;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: Date;
}

export interface ImageStampAnnotation extends BaseMarkupAnnotation {
  type: 'image-stamp';
  imageData: string; // base64 data URL
  rotation?: number;
  opacity?: number;
}

export interface HighlightAnnotation extends BaseMarkupAnnotation {
  type: 'highlight-area';
  color: string;
  opacity: number;
  shape: 'rectangle' | 'freeform';
  points?: { x: number; y: number }[]; // for freeform highlights
}

export interface SignatureAnnotation extends BaseMarkupAnnotation {
  type: 'signature';
  signatureData: string; // base64 data URL
}

export interface DateTimeStampAnnotation extends BaseMarkupAnnotation {
  type: 'date-time-stamp';
  dateTime: Date;
  format: string;
  timezone?: string;
  autoUpdate?: boolean;
}

export interface TextAreaAnnotation extends BaseMarkupAnnotation {
  type: 'text-area';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  textAlign: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ImageAttachmentAnnotation extends BaseMarkupAnnotation {
  type: 'image-attachment';
  attachmentId: string;
  attachmentName: string;
  imageData: string; // base64 data URL
}

export type MarkupAnnotation = 
  | ImageStampAnnotation
  | HighlightAnnotation
  | SignatureAnnotation
  | DateTimeStampAnnotation
  | TextAreaAnnotation
  | ImageAttachmentAnnotation;

// Context state
export interface MarkupState {
  activeTool: MarkupTool | null;
  annotations: MarkupAnnotation[];
  selectedAnnotationId: string | null;
  isDrawingMode: boolean;
  toolbarCollapsed: boolean;
  // Tool-specific settings
  highlightColor: string;
  highlightOpacity: number;
  textFontSize: number;
  textFontFamily: string;
  textColor: string;
  dateTimeFormat: string;
}

// Actions
type MarkupAction =
  | { type: 'SET_ACTIVE_TOOL'; payload: MarkupTool | null }
  | { type: 'ADD_ANNOTATION'; payload: MarkupAnnotation }
  | { type: 'UPDATE_ANNOTATION'; payload: { id: string; annotation: Partial<MarkupAnnotation> } }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'SELECT_ANNOTATION'; payload: string | null }
  | { type: 'SET_DRAWING_MODE'; payload: boolean }
  | { type: 'TOGGLE_TOOLBAR_COLLAPSED' }
  | { type: 'SET_HIGHLIGHT_COLOR'; payload: string }
  | { type: 'SET_HIGHLIGHT_OPACITY'; payload: number }
  | { type: 'SET_TEXT_FONT_SIZE'; payload: number }
  | { type: 'SET_TEXT_FONT_FAMILY'; payload: string }
  | { type: 'SET_TEXT_COLOR'; payload: string }
  | { type: 'SET_DATETIME_FORMAT'; payload: string }
  | { type: 'CLEAR_ALL_ANNOTATIONS' };

// Initial state
const initialState: MarkupState = {
  activeTool: null,
  annotations: [],
  selectedAnnotationId: null,
  isDrawingMode: false,
  toolbarCollapsed: false,
  highlightColor: '#ffff00', // Yellow
  highlightOpacity: 0.3,
  textFontSize: 14,
  textFontFamily: 'Arial, sans-serif',
  textColor: '#000000',
  dateTimeFormat: 'MM/dd/yyyy HH:mm:ss',
};

// Reducer
function markupReducer(state: MarkupState, action: MarkupAction): MarkupState {
  switch (action.type) {
    case 'SET_ACTIVE_TOOL':
      return {
        ...state,
        activeTool: action.payload,
        isDrawingMode: action.payload === 'highlight-area',
        selectedAnnotationId: null, // Clear selection when changing tools
      };

    case 'ADD_ANNOTATION':
      return {
        ...state,
        annotations: [...state.annotations, action.payload],
        selectedAnnotationId: action.payload.id,
      };

    case 'UPDATE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.map(annotation =>
          annotation.id === action.payload.id
            ? { ...annotation, ...action.payload.annotation }
            : annotation
        ),
      };

    case 'DELETE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(annotation => annotation.id !== action.payload),
        selectedAnnotationId: state.selectedAnnotationId === action.payload ? null : state.selectedAnnotationId,
      };

    case 'SELECT_ANNOTATION':
      return {
        ...state,
        selectedAnnotationId: action.payload,
      };

    case 'SET_DRAWING_MODE':
      return {
        ...state,
        isDrawingMode: action.payload,
      };

    case 'TOGGLE_TOOLBAR_COLLAPSED':
      return {
        ...state,
        toolbarCollapsed: !state.toolbarCollapsed,
      };

    case 'SET_HIGHLIGHT_COLOR':
      return {
        ...state,
        highlightColor: action.payload,
      };

    case 'SET_HIGHLIGHT_OPACITY':
      return {
        ...state,
        highlightOpacity: action.payload,
      };

    case 'SET_TEXT_FONT_SIZE':
      return {
        ...state,
        textFontSize: action.payload,
      };

    case 'SET_TEXT_FONT_FAMILY':
      return {
        ...state,
        textFontFamily: action.payload,
      };

    case 'SET_TEXT_COLOR':
      return {
        ...state,
        textColor: action.payload,
      };

    case 'SET_DATETIME_FORMAT':
      return {
        ...state,
        dateTimeFormat: action.payload,
      };

    case 'CLEAR_ALL_ANNOTATIONS':
      return {
        ...state,
        annotations: [],
        selectedAnnotationId: null,
      };

    default:
      return state;
  }
}

// Context
interface MarkupContextType {
  state: MarkupState;
  setActiveTool: (tool: MarkupTool | null) => void;
  addAnnotation: (annotation: MarkupAnnotation) => void;
  updateAnnotation: (id: string, annotation: Partial<MarkupAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setDrawingMode: (enabled: boolean) => void;
  toggleToolbarCollapsed: () => void;
  setHighlightColor: (color: string) => void;
  setHighlightOpacity: (opacity: number) => void;
  setTextFontSize: (size: number) => void;
  setTextFontFamily: (family: string) => void;
  setTextColor: (color: string) => void;
  setDateTimeFormat: (format: string) => void;
  clearAllAnnotations: () => void;
  // Helper functions
  getAnnotationsForPage: (pageNumber: number) => MarkupAnnotation[];
  getSelectedAnnotation: () => MarkupAnnotation | null;
}

const MarkupContext = createContext<MarkupContextType | null>(null);

// Provider component
interface MarkupProviderProps {
  children: ReactNode;
}

export const MarkupProvider: React.FC<MarkupProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(markupReducer, initialState);

  // Action creators
  const setActiveTool = useCallback((tool: MarkupTool | null) => {
    dispatch({ type: 'SET_ACTIVE_TOOL', payload: tool });
  }, []);

  const addAnnotation = useCallback((annotation: MarkupAnnotation) => {
    dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
  }, []);

  const updateAnnotation = useCallback((id: string, annotation: Partial<MarkupAnnotation>) => {
    dispatch({ type: 'UPDATE_ANNOTATION', payload: { id, annotation } });
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ANNOTATION', payload: id });
  }, []);

  const selectAnnotation = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ANNOTATION', payload: id });
  }, []);

  const setDrawingMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_DRAWING_MODE', payload: enabled });
  }, []);

  const toggleToolbarCollapsed = useCallback(() => {
    dispatch({ type: 'TOGGLE_TOOLBAR_COLLAPSED' });
  }, []);

  const setHighlightColor = useCallback((color: string) => {
    dispatch({ type: 'SET_HIGHLIGHT_COLOR', payload: color });
  }, []);

  const setHighlightOpacity = useCallback((opacity: number) => {
    dispatch({ type: 'SET_HIGHLIGHT_OPACITY', payload: opacity });
  }, []);

  const setTextFontSize = useCallback((size: number) => {
    dispatch({ type: 'SET_TEXT_FONT_SIZE', payload: size });
  }, []);

  const setTextFontFamily = useCallback((family: string) => {
    dispatch({ type: 'SET_TEXT_FONT_FAMILY', payload: family });
  }, []);

  const setTextColor = useCallback((color: string) => {
    dispatch({ type: 'SET_TEXT_COLOR', payload: color });
  }, []);

  const setDateTimeFormat = useCallback((format: string) => {
    dispatch({ type: 'SET_DATETIME_FORMAT', payload: format });
  }, []);

  const clearAllAnnotations = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_ANNOTATIONS' });
  }, []);

  // Helper functions
  const getAnnotationsForPage = useCallback((pageNumber: number) => {
    return state.annotations.filter(annotation => annotation.pageNumber === pageNumber);
  }, [state.annotations]);

  const getSelectedAnnotation = useCallback(() => {
    if (!state.selectedAnnotationId) return null;
    return state.annotations.find(annotation => annotation.id === state.selectedAnnotationId) || null;
  }, [state.annotations, state.selectedAnnotationId]);

  const contextValue: MarkupContextType = {
    state,
    setActiveTool,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setDrawingMode,
    toggleToolbarCollapsed,
    setHighlightColor,
    setHighlightOpacity,
    setTextFontSize,
    setTextFontFamily,
    setTextColor,
    setDateTimeFormat,
    clearAllAnnotations,
    getAnnotationsForPage,
    getSelectedAnnotation,
  };

  return (
    <MarkupContext.Provider value={contextValue}>
      {children}
    </MarkupContext.Provider>
  );
};

// Hook to use markup context
export const useMarkup = () => {
  const context = useContext(MarkupContext);
  if (!context) {
    throw new Error('useMarkup must be used within a MarkupProvider');
  }
  return context;
};