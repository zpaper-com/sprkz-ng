import { Layout, LayoutFormData, LayoutService } from '../types/layout';

class LayoutServiceImpl implements LayoutService {
  private layouts: Layout[] = [];
  private nextId = 1;

  constructor() {
    this.initializeLayouts();
  }

  private initializeLayouts(): void {
    // Initialize with default desktop layout only
    const defaultLayouts: LayoutFormData[] = [
      {
        name: 'Desktop Layout',
        type: 'desktop',
        description: 'Standard desktop layout with full feature set',
        viewport: '1920x1080',
        components: ['thumbnailSidebar', 'toolbar', 'progressTracker', 'wizardButton', 'fieldsButton', 'allMarkupTools'],
        notes: 'Default layout for desktop browsers with all UI components and full functionality'
      }
    ];

    this.layouts = defaultLayouts.map((layout, index) => ({
      id: `layout_${this.nextId++}`,
      ...layout,
      isActive: true,
      isDefault: index === 0, // First layout (Desktop) is default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async getAllLayouts(): Promise<Layout[]> {
    return Promise.resolve([...this.layouts]);
  }

  async getLayoutById(id: string): Promise<Layout | null> {
    const layout = this.layouts.find(l => l.id === id);
    return Promise.resolve(layout || null);
  }

  async createLayout(data: LayoutFormData): Promise<Layout> {
    const newLayout: Layout = {
      id: `layout_${this.nextId++}`,
      ...data,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.layouts.push(newLayout);
    return Promise.resolve(newLayout);
  }

  async updateLayout(id: string, data: Partial<LayoutFormData>): Promise<Layout> {
    const layoutIndex = this.layouts.findIndex(l => l.id === id);
    if (layoutIndex === -1) {
      throw new Error(`Layout with id ${id} not found`);
    }

    this.layouts[layoutIndex] = {
      ...this.layouts[layoutIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };

    return Promise.resolve(this.layouts[layoutIndex]);
  }

  async deleteLayout(id: string): Promise<void> {
    const layoutIndex = this.layouts.findIndex(l => l.id === id);
    if (layoutIndex === -1) {
      throw new Error(`Layout with id ${id} not found`);
    }

    // Prevent deleting the default layout
    if (this.layouts[layoutIndex].isDefault) {
      throw new Error('Cannot delete the default layout');
    }

    this.layouts.splice(layoutIndex, 1);
    return Promise.resolve();
  }

  async setDefaultLayout(id: string): Promise<void> {
    // First, unset all defaults
    this.layouts.forEach(layout => {
      layout.isDefault = false;
      layout.updatedAt = new Date().toISOString();
    });

    // Set the new default
    const layoutIndex = this.layouts.findIndex(l => l.id === id);
    if (layoutIndex === -1) {
      throw new Error(`Layout with id ${id} not found`);
    }

    this.layouts[layoutIndex].isDefault = true;
    this.layouts[layoutIndex].updatedAt = new Date().toISOString();
    
    return Promise.resolve();
  }

  async toggleLayoutActive(id: string): Promise<Layout> {
    const layoutIndex = this.layouts.findIndex(l => l.id === id);
    if (layoutIndex === -1) {
      throw new Error(`Layout with id ${id} not found`);
    }

    this.layouts[layoutIndex].isActive = !this.layouts[layoutIndex].isActive;
    this.layouts[layoutIndex].updatedAt = new Date().toISOString();

    return Promise.resolve(this.layouts[layoutIndex]);
  }
}

export const layoutService = new LayoutServiceImpl();