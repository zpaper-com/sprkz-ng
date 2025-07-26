export interface Automation {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: 'manual' | 'form_submission' | 'schedule';
  trigger_config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationFormData {
  name: string;
  description: string;
  is_active: boolean;
  trigger_type: 'manual' | 'form_submission' | 'schedule';
  trigger_config: Record<string, any>;
}

export interface AutomationStep {
  id: number;
  automation_id: number;
  webhook_id: number;
  step_order: number;
  is_conditional: boolean;
  condition_config: Record<string, any> | null;
  delay_seconds: number;
  retry_on_failure: boolean;
  continue_on_failure: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationStepFormData {
  webhook_id: number;
  step_order: number;
  is_conditional: boolean;
  condition_config: Record<string, any>;
  delay_seconds: number;
  retry_on_failure: boolean;
  continue_on_failure: boolean;
}

export interface AutomationExecution {
  id: number;
  automation_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_data: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface AutomationStepExecution {
  id: number;
  automation_execution_id: number;
  automation_step_id: number;
  webhook_id: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  webhook_response_status: number | null;
  webhook_response_body: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  created_at: string;
}

export interface AutomationWithSteps extends Automation {
  steps: (AutomationStep & {
    webhook?: {
      id: number;
      name: string;
      url: string;
      method: string;
      is_active: boolean;
    };
  })[];
}

export interface AutomationExecutionResult {
  success: boolean;
  execution_id: number;
  completed_steps: number;
  total_steps: number;
  error_message: string | null;
  execution_time_ms: number;
}

export interface AutomationStepWithWebhook extends AutomationStep {
  webhook: {
    id: number;
    name: string;
    url: string;
    method: string;
    is_active: boolean;
  };
}