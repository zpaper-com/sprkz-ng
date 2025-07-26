export interface SystemEvent {
  id: number;
  event_type: EventType;
  event_category: EventCategory;
  event_name: string;
  description: string;
  user_agent: string | null;
  ip_address: string | null;
  session_id: string | null;
  user_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export type EventType = 
  | 'form_view'
  | 'form_submission'
  | 'webhook_triggered'
  | 'webhook_failed'
  | 'automation_executed'
  | 'automation_failed'
  | 'pdf_viewed'
  | 'pdf_downloaded'
  | 'admin_action'
  | 'api_request'
  | 'error_occurred';

export type EventCategory = 
  | 'user_interaction'
  | 'system_operation'
  | 'webhook_activity'
  | 'automation_activity'
  | 'admin_activity'
  | 'error_tracking';

export interface EventFormData {
  event_type: EventType;
  event_category: EventCategory;
  event_name: string;
  description: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface EventFilters {
  event_type?: EventType;
  event_category?: EventCategory;
  start_date?: string;
  end_date?: string;
  search?: string;
  user_id?: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

export interface EventSummary {
  total_events: number;
  events_by_type: Record<EventType, number>;
  events_by_category: Record<EventCategory, number>;
  events_today: number;
  events_this_week: number;
  events_this_month: number;
  most_active_sessions: Array<{
    session_id: string;
    event_count: number;
    last_activity: string;
  }>;
  recent_errors: SystemEvent[];
}

export interface FormViewEvent {
  pdf_url: string;
  pdf_name: string;
  page_number?: number;
  view_duration_ms?: number;
  form_fields_count?: number;
}

export interface FormSubmissionEvent {
  pdf_url: string;
  pdf_name: string;
  form_data: Record<string, any>;
  submission_duration_ms: number;
  validation_errors?: string[];
  completion_percentage: number;
}

export interface WebhookEvent {
  webhook_id: number;
  webhook_name: string;
  webhook_url: string;
  http_method: string;
  response_status: number | null;
  response_time_ms: number;
  payload_size_bytes: number;
  error_message: string | null;
}

export interface AutomationEvent {
  automation_id: number;
  automation_name: string;
  execution_id: number;
  trigger_type: string;
  steps_completed: number;
  total_steps: number;
  execution_time_ms: number;
  error_message: string | null;
}

export interface AdminActionEvent {
  admin_user: string;
  action_type: string;
  resource_type: string;
  resource_id: string | number;
  changes: Record<string, any>;
}

export interface ErrorEvent {
  error_type: string;
  error_message: string;
  stack_trace: string | null;
  request_url: string | null;
  request_method: string | null;
  request_body: string | null;
}

// Real-time event streaming types
export interface EventStreamMessage {
  type: 'event' | 'heartbeat' | 'error';
  data: SystemEvent | null;
  timestamp: string;
}

export interface EventAnalytics {
  time_period: 'hour' | 'day' | 'week' | 'month';
  event_timeline: Array<{
    timestamp: string;
    event_count: number;
    event_type_breakdown: Record<EventType, number>;
  }>;
  top_pages: Array<{
    pdf_url: string;
    view_count: number;
    submission_count: number;
    bounce_rate: number;
  }>;
  conversion_funnel: {
    views: number;
    submissions: number;
    successful_submissions: number;
    conversion_rate: number;
  };
}