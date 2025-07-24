export interface URLConfig {
  path: string;
  pdfPath?: string;
  features: { [featureId: number]: boolean };
  pdfFields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' };
}

export class DynamicRoutingService {
  private urlConfigs: URLConfig[] = [];
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load URL configurations from the API
   */
  async loadURLConfigs(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchURLConfigs();
    return this.loadPromise;
  }

  private async fetchURLConfigs(): Promise<void> {
    try {
      const response = await fetch('/api/url-configs');
      if (!response.ok) {
        throw new Error(`Failed to fetch URL configurations: ${response.status}`);
      }
      
      this.urlConfigs = await response.json();
      this.isLoaded = true;
      console.log('Loaded URL configurations:', this.urlConfigs);
    } catch (error) {
      console.error('Error loading URL configurations:', error);
      this.urlConfigs = [];
      this.isLoaded = false;
      throw error;
    }
  }

  /**
   * Find URL configuration for a given path
   */
  findURLConfig(path: string): URLConfig | null {
    if (!this.isLoaded) {
      console.warn('URL configurations not loaded yet');
      return null;
    }

    return this.urlConfigs.find(config => config.path === path) || null;
  }

  /**
   * Check if a path matches any configured dynamic route
   */
  hasRoute(path: string): boolean {
    return this.findURLConfig(path) !== null;
  }

  /**
   * Get all configured paths
   */
  getAllPaths(): string[] {
    return this.urlConfigs.map(config => config.path);
  }

  /**
   * Get PDF path for a route, with fallback to default
   */
  getPDFPath(routePath: string): string {
    const config = this.findURLConfig(routePath);
    
    if (config?.pdfPath) {
      return `/pdfs/${config.pdfPath}`;
    }
    
    // Fallback to default PDF
    return '/pdfs/makana2025.pdf';
  }

  /**
   * Get feature toggles for a route
   */
  getFeatures(routePath: string): { [featureId: number]: boolean } {
    const config = this.findURLConfig(routePath);
    return config?.features || {};
  }

  /**
   * Get PDF field configurations for a route
   */
  getPDFFields(routePath: string): { [fieldName: string]: 'read-only' | 'hidden' | 'normal' } {
    const config = this.findURLConfig(routePath);
    return config?.pdfFields || {};
  }

  /**
   * Refresh URL configurations (call after admin changes)
   */
  async refresh(): Promise<void> {
    this.isLoaded = false;
    this.loadPromise = null;
    await this.loadURLConfigs();
  }

  /**
   * Check if configurations are loaded
   */
  getLoaded(): boolean {
    return this.isLoaded;
  }
}

// Singleton instance
export const dynamicRoutingService = new DynamicRoutingService();