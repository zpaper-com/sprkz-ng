import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export interface Feature {
  id: number;
  name: string;
  description?: string;
  notes?: string;
  creationDate: string;
}

export interface URLConfig {
  id: number;
  path: string;
  pdfPath?: string;
  createdAt: string;
  features: { [featureId: number]: boolean };
  pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
}

export interface PDFFile {
  filename: string;
  size: number;
  uploadDate: string;
}

export interface Settings {
  defaultPdf?: string;
  theme?: 'light' | 'dark';
}

interface AdminState {
  features: Feature[];
  urls: URLConfig[];
  pdfs: PDFFile[];
  settings: Settings;
  loading: boolean;
  error: string | null;
}

type AdminAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FEATURES'; payload: Feature[] }
  | { type: 'ADD_FEATURE'; payload: Feature }
  | { type: 'UPDATE_FEATURE'; payload: Feature }
  | { type: 'DELETE_FEATURE'; payload: number }
  | { type: 'SET_URLS'; payload: URLConfig[] }
  | { type: 'ADD_URL'; payload: URLConfig }
  | { type: 'UPDATE_URL'; payload: URLConfig }
  | { type: 'DELETE_URL'; payload: number }
  | { type: 'SET_PDFS'; payload: PDFFile[] }
  | { type: 'ADD_PDF'; payload: PDFFile }
  | { type: 'DELETE_PDF'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> };

const initialState: AdminState = {
  features: [],
  urls: [],
  pdfs: [],
  settings: {},
  loading: false,
  error: null,
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FEATURES':
      return { ...state, features: action.payload };
    case 'ADD_FEATURE':
      return { ...state, features: [...state.features, action.payload] };
    case 'UPDATE_FEATURE':
      return {
        ...state,
        features: state.features.map(f =>
          f.id === action.payload.id ? action.payload : f
        ),
      };
    case 'DELETE_FEATURE':
      return {
        ...state,
        features: state.features.filter(f => f.id !== action.payload),
      };
    case 'SET_URLS':
      return { ...state, urls: action.payload };
    case 'ADD_URL':
      return { ...state, urls: [...state.urls, action.payload] };
    case 'UPDATE_URL':
      return {
        ...state,
        urls: state.urls.map(u =>
          u.id === action.payload.id ? action.payload : u
        ),
      };
    case 'DELETE_URL':
      return {
        ...state,
        urls: state.urls.filter(u => u.id !== action.payload),
      };
    case 'SET_PDFS':
      return { ...state, pdfs: action.payload };
    case 'ADD_PDF':
      return { ...state, pdfs: [...state.pdfs, action.payload] };
    case 'DELETE_PDF':
      return {
        ...state,
        pdfs: state.pdfs.filter(p => p.filename !== action.payload),
      };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    default:
      return state;
  }
}

interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  actions: {
    loadInitialData: () => Promise<void>;
    createFeature: (feature: Omit<Feature, 'id' | 'creationDate'>) => Promise<void>;
    updateFeature: (id: number, feature: Partial<Feature>) => Promise<void>;
    deleteFeature: (id: number) => Promise<void>;
    createURL: (url: Omit<URLConfig, 'id' | 'createdAt'>) => Promise<void>;
    updateURL: (id: number, url: Partial<URLConfig>) => Promise<void>;
    deleteURL: (id: number) => Promise<void>;
    uploadPDF: (file: File) => Promise<void>;
    deletePDF: (filename: string) => Promise<void>;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
  };
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // WebSocket handlers
  const handleWebSocketMessage = (event: string, data: unknown) => {
    switch (event) {
      case 'feature:created':
        dispatch({ type: 'ADD_FEATURE', payload: data });
        break;
      case 'feature:updated':
        dispatch({ type: 'UPDATE_FEATURE', payload: data });
        break;
      case 'feature:deleted':
        dispatch({ type: 'DELETE_FEATURE', payload: data.id });
        break;
      case 'url:created':
        dispatch({ type: 'ADD_URL', payload: data });
        break;
      case 'url:updated':
        dispatch({ type: 'UPDATE_URL', payload: data });
        break;
      case 'url:deleted':
        dispatch({ type: 'DELETE_URL', payload: data.id });
        break;
      case 'settings:updated':
        dispatch({ type: 'UPDATE_SETTINGS', payload: data });
        break;
    }
  };

  useWebSocket(handleWebSocketMessage);

  const actions = {
    loadInitialData: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data for development - replace with API calls when server is ready
        const mockFeatures: Feature[] = [
          // Main Interface Buttons (from PDFFormContainer header)
          { id: 1, name: 'Fields Toggle Button', description: 'Show/hide field names overlay on PDF with visibility icons and validation badge', notes: 'Uses Visibility/VisibilityOff icons, shows validation error count in badge, toggles field name display', creationDate: new Date().toISOString() },
          { id: 2, name: 'PDF Fit Width Button', description: 'Fit PDF viewer to container width with SwapHoriz icon', notes: 'Part of PDF fit controls, toggles between default and width-fitted view modes', creationDate: new Date().toISOString() },
          { id: 3, name: 'PDF Fit Height Button', description: 'Fit PDF viewer to container height with Height icon', notes: 'Part of PDF fit controls, toggles between default and height-fitted view modes', creationDate: new Date().toISOString() },
          { id: 4, name: 'Wizard Button', description: 'Dynamic multi-state button for guided form completion (Start → Next → Sign → Submit)', notes: 'Changes color and icon based on state: Blue Start, Orange Next, Purple Sign, Green Submit with progress indicators', creationDate: new Date().toISOString() },
          
          // Top Bar Information Display
          { id: 5, name: 'PDF Title Display', description: 'Shows "Sprkz PDF Form - Page X of Y" in the main interface header', notes: 'Typography component displaying current page position and total page count', creationDate: new Date().toISOString() },
          { id: 6, name: 'PDF Filename Display', description: 'Shows current PDF filename in header subtitle', notes: 'Displays filename with path prefix removed for clean presentation', creationDate: new Date().toISOString() },
          
          // Page Navigation & Thumbnail Preview
          { id: 7, name: 'Thumbnail Page Navigation', description: 'Clickable page thumbnails in left sidebar for quick page navigation', notes: 'Shows miniature PDF previews with current page highlighting and hover effects, 180px width', creationDate: new Date().toISOString() },
          
          // Progress & Status Features (shown when wizard is active)
          { id: 8, name: 'Wizard Status Indicator', description: 'Shows wizard mode status with completion percentage when active', notes: 'Appears only during wizard mode, displays field completion progress with AutoMode icon', creationDate: new Date().toISOString() },
          { id: 9, name: 'Mini Progress Indicator', description: 'Circular progress indicator with completion ratio display', notes: 'Shows completed vs total fields as circular progress with percentage', creationDate: new Date().toISOString() },
          { id: 10, name: 'Progress Tracker', description: 'Compact linear progress bar showing form completion status', notes: 'Displays during wizard mode, shows overall form completion progress below header', creationDate: new Date().toISOString() },
          
          // Form Interaction Features
          { id: 11, name: 'Field Tooltip System', description: 'Interactive tooltips providing field guidance and status information', notes: 'Shows field type, requirements, validation status with contextual help', creationDate: new Date().toISOString() },
          { id: 12, name: 'Signature Modal', description: 'Popup interface for signature capture with drawing and typing modes', notes: 'Modal dialog with canvas drawing area and typed signature options with font selection', creationDate: new Date().toISOString() },
          { id: 13, name: 'Form Validation Display', description: 'Real-time form field validation with error highlighting', notes: 'Shows validation errors, required field indicators, and completion status on PDF overlay', creationDate: new Date().toISOString() },
        ];
        
        const mockURLs: URLConfig[] = [
          { id: 1, path: '/makana', pdfPath: 'makana2025.pdf', createdAt: new Date().toISOString(), features: { 1: true, 2: false }, pdfFields: {} },
          { id: 2, path: '/tremfya', pdfPath: 'tremfya.pdf', createdAt: new Date().toISOString(), features: { 1: false, 2: true }, pdfFields: {} },
        ];
        
        const mockPDFs: PDFFile[] = [
          { filename: 'makana2025.pdf', size: 2048000, uploadDate: new Date().toISOString() },
          { filename: 'tremfya.pdf', size: 1536000, uploadDate: new Date().toISOString() },
        ];
        
        const mockSettings: Settings = { defaultPdf: 'makana2025.pdf', theme: 'light' };
        
        dispatch({ type: 'SET_FEATURES', payload: mockFeatures });
        dispatch({ type: 'SET_URLS', payload: mockURLs });
        dispatch({ type: 'SET_PDFS', payload: mockPDFs });
        dispatch({ type: 'SET_SETTINGS', payload: mockSettings });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createFeature: async (feature: Omit<Feature, 'id' | 'creationDate'>) => {
      try {
        // Mock implementation - replace with API call when server is ready
        const newFeature: Feature = {
          ...feature,
          id: Date.now(),
          creationDate: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_FEATURE', payload: newFeature });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create feature' });
      }
    },

    updateFeature: async (id: number, feature: Partial<Feature>) => {
      try {
        // Mock implementation - replace with API call when server is ready
        const updatedFeature = { ...state.features.find(f => f.id === id)!, ...feature };
        dispatch({ type: 'UPDATE_FEATURE', payload: updatedFeature });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update feature' });
      }
    },

    deleteFeature: async (id: number) => {
      try {
        // Mock implementation - replace with API call when server is ready
        dispatch({ type: 'DELETE_FEATURE', payload: id });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete feature' });
      }
    },

    createURL: async (url: Omit<URLConfig, 'id' | 'createdAt'>) => {
      try {
        // Mock implementation - replace with API call when server is ready
        const newURL: URLConfig = {
          ...url,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_URL', payload: newURL });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create URL configuration' });
      }
    },

    updateURL: async (id: number, url: Partial<URLConfig>) => {
      try {
        // Mock implementation - replace with API call when server is ready
        const existingURL = state.urls.find(u => u.id === id);
        const updatedURL = { ...existingURL!, ...url };
        dispatch({ type: 'UPDATE_URL', payload: updatedURL });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update URL configuration' });
      }
    },

    deleteURL: async (id: number) => {
      try {
        // Mock implementation - replace with API call when server is ready
        dispatch({ type: 'DELETE_URL', payload: id });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete URL configuration' });
      }
    },

    uploadPDF: async (file: File) => {
      try {
        const response = await adminAPI.uploadPDF(file);
        if (response.success) {
          dispatch({ type: 'ADD_PDF', payload: response.pdf });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('PDF upload error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to upload PDF' });
      }
    },

    deletePDF: async (filename: string) => {
      try {
        // Mock implementation - replace with API call when server is ready
        dispatch({ type: 'DELETE_PDF', payload: filename });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete PDF' });
      }
    },

    updateSettings: async (settings: Partial<Settings>) => {
      try {
        // Mock implementation - replace with API call when server is ready
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update settings' });
      }
    },
  };

  useEffect(() => {
    actions.loadInitialData();
  }, []); // Empty dependency array - only run once on mount

  return (
    <AdminContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AdminContext.Provider>
  );
};