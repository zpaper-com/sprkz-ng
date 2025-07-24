import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  isFeatureEnabled,
  isCurrentFeatureEnabled,
  getCurrentURLConfig,
  getURLConfig,
  getEnabledFeatures,
  getFeatureConfigSummary,
  FEATURE_FLAGS,
  type FeatureFlagId,
} from '../utils/featureFlags';

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
  // Feature flag utilities
  featureFlags: {
    isFeatureEnabled: (path: string, featureId: FeatureFlagId) => boolean;
    isCurrentFeatureEnabled: (featureId: FeatureFlagId) => boolean;
    getCurrentURLConfig: () => URLConfig | null;
    getURLConfig: (path: string) => URLConfig | null;
    getEnabledFeatures: (path: string) => FeatureFlagId[];
    getFeatureConfigSummary: (path: string) => ReturnType<typeof getFeatureConfigSummary>;
    FEATURE_FLAGS: typeof FEATURE_FLAGS;
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
        // Load real data from API
        const [features, urls, pdfs, settings] = await Promise.all([
          adminAPI.getFeatures(),
          adminAPI.getURLs(), 
          adminAPI.getPDFs(),
          adminAPI.getSettings()
        ]);
        
        dispatch({ type: 'SET_FEATURES', payload: features });
        dispatch({ type: 'SET_URLS', payload: urls });
        dispatch({ type: 'SET_PDFS', payload: pdfs });
        dispatch({ type: 'SET_SETTINGS', payload: settings });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load initial data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createFeature: async (feature: Omit<Feature, 'id' | 'creationDate'>) => {
      try {
        const newFeature = await adminAPI.createFeature(feature);
        dispatch({ type: 'ADD_FEATURE', payload: newFeature });
      } catch (error) {
        console.error('Failed to create feature:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create feature' });
      }
    },

    updateFeature: async (id: number, feature: Partial<Feature>) => {
      try {
        const updatedFeature = await adminAPI.updateFeature(id, feature);
        dispatch({ type: 'UPDATE_FEATURE', payload: updatedFeature });
      } catch (error) {
        console.error('Failed to update feature:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update feature' });
      }
    },

    deleteFeature: async (id: number) => {
      try {
        await adminAPI.deleteFeature(id);
        dispatch({ type: 'DELETE_FEATURE', payload: id });
      } catch (error) {
        console.error('Failed to delete feature:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete feature' });
      }
    },

    createURL: async (url: Omit<URLConfig, 'id' | 'createdAt'>) => {
      try {
        const newURL = await adminAPI.createURL(url);
        dispatch({ type: 'ADD_URL', payload: newURL });
      } catch (error) {
        console.error('Failed to create URL:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create URL configuration' });
      }
    },

    updateURL: async (id: number, url: Partial<URLConfig>) => {
      try {
        const updatedURL = await adminAPI.updateURL(id, url);
        dispatch({ type: 'UPDATE_URL', payload: updatedURL });
      } catch (error) {
        console.error('Failed to update URL:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update URL configuration' });
      }
    },

    deleteURL: async (id: number) => {
      try {
        await adminAPI.deleteURL(id);
        dispatch({ type: 'DELETE_URL', payload: id });
      } catch (error) {
        console.error('Failed to delete URL:', error);
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
        await adminAPI.deletePDF(filename);
        dispatch({ type: 'DELETE_PDF', payload: filename });
      } catch (error) {
        console.error('Failed to delete PDF:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete PDF' });
      }
    },

    updateSettings: async (settings: Partial<Settings>) => {
      try {
        const updatedSettings = await adminAPI.updateSettings(settings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: updatedSettings });
      } catch (error) {
        console.error('Failed to update settings:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update settings' });
      }
    },
  };

  // Feature flag utilities
  const featureFlags = {
    isFeatureEnabled: (path: string, featureId: FeatureFlagId) => 
      isFeatureEnabled(state.urls, path, featureId),
    isCurrentFeatureEnabled: (featureId: FeatureFlagId) => 
      isCurrentFeatureEnabled(state.urls, featureId),
    getCurrentURLConfig: () => getCurrentURLConfig(state.urls),
    getURLConfig: (path: string) => getURLConfig(state.urls, path),
    getEnabledFeatures: (path: string) => getEnabledFeatures(state.urls, path),
    getFeatureConfigSummary: (path: string) => 
      getFeatureConfigSummary(state.urls, state.features, path),
    FEATURE_FLAGS,
  };

  useEffect(() => {
    actions.loadInitialData();
  }, []); // Empty dependency array - only run once on mount

  return (
    <AdminContext.Provider value={{ state, dispatch, actions, featureFlags }}>
      {children}
    </AdminContext.Provider>
  );
};