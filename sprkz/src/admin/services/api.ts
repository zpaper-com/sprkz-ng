import { Feature, URLConfig, PDFFile, Settings } from '../contexts/AdminContext';

const API_BASE = '/api/admin';

class AdminAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Feature Management
  async getFeatures(): Promise<Feature[]> {
    return this.request<Feature[]>('/features');
  }

  async createFeature(feature: Omit<Feature, 'id' | 'creationDate'>): Promise<Feature> {
    return this.request<Feature>('/features', {
      method: 'POST',
      body: JSON.stringify(feature),
    });
  }

  async updateFeature(id: number, feature: Partial<Feature>): Promise<Feature> {
    return this.request<Feature>(`/features/${id}`, {
      method: 'PUT',
      body: JSON.stringify(feature),
    });
  }

  async deleteFeature(id: number): Promise<void> {
    return this.request<void>(`/features/${id}`, {
      method: 'DELETE',
    });
  }

  // URL Configuration
  async getURLs(): Promise<URLConfig[]> {
    return this.request<URLConfig[]>('/urls');
  }

  async createURL(url: Omit<URLConfig, 'id' | 'createdAt'>): Promise<URLConfig> {
    return this.request<URLConfig>('/urls', {
      method: 'POST',
      body: JSON.stringify(url),
    });
  }

  async updateURL(id: number, url: Partial<URLConfig>): Promise<URLConfig> {
    return this.request<URLConfig>(`/urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(url),
    });
  }

  async deleteURL(id: number): Promise<void> {
    return this.request<void>(`/urls/${id}`, {
      method: 'DELETE',
    });
  }

  async updateURLFeatures(urlId: number, features: { [featureId: number]: boolean }): Promise<void> {
    return this.request<void>(`/url-features/${urlId}`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  }

  async updatePDFFields(urlId: number, fields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }): Promise<void> {
    return this.request<void>(`/pdf-fields/${urlId}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  }

  // PDF Management
  async getPDFs(): Promise<PDFFile[]> {
    return this.request<PDFFile[]>('/pdfs');
  }

  async uploadPDF(file: File): Promise<{ success: boolean; pdf: PDFFile }> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE}/pdfs/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async deletePDF(filename: string): Promise<void> {
    return this.request<void>(`/pdfs/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  async getPDFFields(filename: string): Promise<string[]> {
    return this.request<string[]>(`/pdf-fields/${encodeURIComponent(filename)}`);
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.request<Settings>('/settings');
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const adminAPI = new AdminAPI();