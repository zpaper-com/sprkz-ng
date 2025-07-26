export interface Webhook {
  id: number;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  is_active: boolean;
  retry_enabled: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  headers: Record<string, string> | null;
  payload_type: 'json' | 'pdf' | 'dynamic';
  payload_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookFormData {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  is_active: boolean;
  retry_enabled: boolean;
  retry_count: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  headers: Record<string, string>;
  payload_type: 'json' | 'pdf' | 'dynamic';
  payload_template: string;
}

export interface WebhookEvent {
  id: number;
  webhook_id: number;
  event_type: string;
  payload: string;
  payload_file_path: string | null;
  response_status: number | null;
  response_body: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  created_at: string;
}

export interface WebhookTestResult {
  success: boolean;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  response_time_ms: number;
}

export interface WebhookPDFTemplate {
  id: number;
  webhook_id: number;
  template_name: string;
  template_file_path: string | null;
  template_html: string | null;
  template_variables: string[];
  created_at: string;
  updated_at: string;
}