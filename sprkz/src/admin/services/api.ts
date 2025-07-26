import {
  Feature,
  URLConfig,
  PDFFile,
  Settings,
} from '../contexts/AdminContext';
import { Webhook, WebhookFormData, WebhookTestResult } from '../types/webhook';
import { 
  Automation, 
  AutomationFormData, 
  AutomationWithSteps, 
  AutomationExecutionResult,
  AutomationExecution
} from '../types/automation';
import {
  SystemEvent,
  EventSummary,
  EventFilters,
  EventAnalytics
} from '../types/event';

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

  async createFeature(
    feature: Omit<Feature, 'id' | 'creationDate'>
  ): Promise<Feature> {
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

  async createURL(
    url: Omit<URLConfig, 'id' | 'createdAt'>
  ): Promise<URLConfig> {
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

  async updateURLFeatures(
    urlId: number,
    features: { [featureId: number]: boolean }
  ): Promise<void> {
    return this.request<void>(`/url-features/${urlId}`, {
      method: 'PUT',
      body: JSON.stringify({ features }),
    });
  }

  async updatePDFFields(
    urlId: number,
    fields: { [fieldName: string]: 'read-only' | 'hidden' | 'normal' }
  ): Promise<void> {
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
    return this.request<string[]>(
      `/pdf-fields/${encodeURIComponent(filename)}`
    );
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

  // Webhook Management
  async getWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>('/webhooks');
  }

  async getWebhook(id: number): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}`);
  }

  async createWebhook(webhook: WebhookFormData): Promise<Webhook> {
    return this.request<Webhook>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }

  async updateWebhook(id: number, webhook: WebhookFormData): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(webhook),
    });
  }

  async deleteWebhook(id: number): Promise<void> {
    return this.request<void>(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async testWebhook(id: number, payload?: { testPayload?: any }): Promise<WebhookTestResult> {
    return this.request<WebhookTestResult>(`/webhooks/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  async previewWebhookPayload(id: number, sampleData?: Record<string, any>): Promise<{ payload: any; contentType: string }> {
    return this.request<{ payload: any; contentType: string }>(`/webhooks/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ sampleData: sampleData || {} }),
    });
  }

  // Automation Management
  async getAutomations(): Promise<Automation[]> {
    return this.request<Automation[]>('/automations');
  }

  async getAutomation(id: number): Promise<AutomationWithSteps> {
    return this.request<AutomationWithSteps>(`/automations/${id}`);
  }

  async createAutomation(automation: AutomationFormData & { steps?: any[] }): Promise<Automation> {
    return this.request<Automation>('/automations', {
      method: 'POST',
      body: JSON.stringify(automation),
    });
  }

  async updateAutomation(id: number, automation: AutomationFormData & { steps?: any[] }): Promise<Automation> {
    return this.request<Automation>(`/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(automation),
    });
  }

  async deleteAutomation(id: number): Promise<void> {
    return this.request<void>(`/automations/${id}`, {
      method: 'DELETE',
    });
  }

  async executeAutomation(id: number, triggerData?: Record<string, any>): Promise<AutomationExecutionResult> {
    return this.request<AutomationExecutionResult>(`/automations/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ triggerData: triggerData || {} }),
    });
  }

  async getAutomationExecutions(id: number, limit?: number): Promise<AutomationExecution[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<AutomationExecution[]>(`/automations/${id}/executions${params}`);
  }

  // Event Management
  async getEvents(filters?: EventFilters): Promise<SystemEvent[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return this.request<SystemEvent[]>(`/events${queryString ? `?${queryString}` : ''}`);
  }

  async getEventSummary(): Promise<EventSummary> {
    return this.request<EventSummary>('/events/summary');
  }

  async getEventAnalytics(timePeriod?: 'hour' | 'day' | 'week' | 'month'): Promise<EventAnalytics> {
    const params = timePeriod ? `?time_period=${timePeriod}` : '';
    return this.request<EventAnalytics>(`/events/analytics${params}`);
  }

  async logEvent(eventData: {
    event_type: string;
    event_category: string;
    event_name: string;
    description: string;
    metadata?: Record<string, any>;
    session_id?: string;
    user_id?: string;
  }): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/events/log', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }
}

export const adminAPI = new AdminAPI();
