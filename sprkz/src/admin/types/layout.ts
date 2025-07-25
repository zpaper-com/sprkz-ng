export interface Layout {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'custom';
  description: string;
  viewport: string;
  components: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface LayoutFormData {
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'custom';
  description: string;
  viewport: string;
  components: string[];
  notes?: string;
}

export interface LayoutService {
  getAllLayouts(): Promise<Layout[]>;
  getLayoutById(id: string): Promise<Layout | null>;
  createLayout(data: LayoutFormData): Promise<Layout>;
  updateLayout(id: string, data: Partial<LayoutFormData>): Promise<Layout>;
  deleteLayout(id: string): Promise<void>;
  setDefaultLayout(id: string): Promise<void>;
  toggleLayoutActive(id: string): Promise<Layout>;
}

export const AVAILABLE_COMPONENTS = [
  'thumbnailSidebar',
  'toolbar',
  'progressTracker',
  'wizardButton',
  'fieldsButton',
  'markupTools',
  'compactToolbar',
  'bottomNavigation',
  'swipeGesture',
  'mobileWizard',
  'allMarkupTools'
] as const;

export type LayoutComponent = typeof AVAILABLE_COMPONENTS[number];