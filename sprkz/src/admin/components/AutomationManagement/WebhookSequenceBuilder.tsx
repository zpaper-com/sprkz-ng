import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  DragIndicator as DragIcon,
  Schedule as DelayIcon,
  Replay as RetryIcon,
  Error as ErrorIcon,
  ArrowDownward as ArrowIcon,
} from '@mui/icons-material';
import { Webhook } from '../../types/webhook';
import { AutomationStepFormData } from '../../types/automation';
import { adminAPI } from '../../services/api';

interface WebhookSequenceBuilderProps {
  steps: any[];
  onChange: (steps: any[]) => void;
}

interface StepFormData extends AutomationStepFormData {
  id?: number;
}

const WebhookSequenceBuilder: React.FC<WebhookSequenceBuilderProps> = ({
  steps,
  onChange,
}) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getWebhooks();
      // Only show active webhooks
      setWebhooks(data.filter(w => w.is_active));
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addWebhookStep = () => {
    const newStep: StepFormData = {
      webhook_id: 0,
      step_order: steps.length + 1,
      is_conditional: false,
      condition_config: {},
      delay_seconds: 0,
      retry_on_failure: true,
      continue_on_failure: false,
    };

    onChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, step_order: i + 1 }));
    onChange(newSteps);
  };

  const updateStep = (index: number, field: keyof StepFormData, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap steps
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update step orders
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });

    onChange(newSteps);
  };

  const getWebhookName = (webhookId: number) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    return webhook ? webhook.name : 'Select Webhook';
  };

  const getWebhookDetails = (webhookId: number) => {
    const webhook = webhooks.find(w => w.id === webhookId);
    return webhook ? `${webhook.method} ${webhook.url}` : '';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'primary';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'PATCH': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {steps.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No webhook steps configured. Add your first webhook to start building the automation sequence.
        </Alert>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {steps.length} webhook{steps.length !== 1 ? 's' : ''} in sequence
        </Typography>
      )}

      {steps.map((step, index) => {
        const webhook = webhooks.find(w => w.id === step.webhook_id);
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Card variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={`Step ${index + 1}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Typography variant="h6">
                      {getWebhookName(step.webhook_id)}
                    </Typography>
                    {webhook && (
                      <Chip
                        label={webhook.method}
                        size="small"
                        color={getMethodColor(webhook.method) as any}
                      />
                    )}
                  </Box>
                  
                  <Box>
                    <Tooltip title="Move Up">
                      <IconButton
                        size="small"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Move Down">
                      <IconButton
                        size="small"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        ↓
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Step">
                      <IconButton
                        size="small"
                        onClick={() => removeStep(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Webhook</InputLabel>
                  <Select
                    value={step.webhook_id || ''}
                    onChange={(e) => updateStep(index, 'webhook_id', e.target.value)}
                    label="Select Webhook"
                  >
                    {webhooks.map((webhook) => (
                      <MenuItem key={webhook.id} value={webhook.id}>
                        <Box>
                          <Typography variant="subtitle2">
                            {webhook.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {webhook.method} {webhook.url}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Accordion 
                  expanded={expandedStep === index}
                  onChange={() => setExpandedStep(expandedStep === index ? null : index)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">Advanced Settings</Typography>
                    <Box ml="auto" mr={1} display="flex" gap={1}>
                      {step.delay_seconds > 0 && (
                        <Chip icon={<DelayIcon />} label={`${step.delay_seconds}s delay`} size="small" />
                      )}
                      {step.retry_on_failure && (
                        <Chip icon={<RetryIcon />} label="Retry enabled" size="small" color="success" />
                      )}
                      {step.continue_on_failure && (
                        <Chip icon={<ErrorIcon />} label="Continue on failure" size="small" color="warning" />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Delay Before Execution (seconds)"
                        value={step.delay_seconds || 0}
                        onChange={(e) => updateStep(index, 'delay_seconds', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 3600 }}
                        helperText="Wait time before executing this webhook"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={step.retry_on_failure || false}
                            onChange={(e) => updateStep(index, 'retry_on_failure', e.target.checked)}
                          />
                        }
                        label="Retry on Failure"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={step.continue_on_failure || false}
                            onChange={(e) => updateStep(index, 'continue_on_failure', e.target.checked)}
                          />
                        }
                        label="Continue Sequence on Failure"
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>

            {index < steps.length - 1 && (
              <Box display="flex" justifyContent="center" my={1}>
                <ArrowIcon color="action" />
              </Box>
            )}
          </Box>
        );
      })}

      <Box mt={2}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addWebhookStep}
          fullWidth
          disabled={loading || webhooks.length === 0}
        >
          {webhooks.length === 0 ? 'No Active Webhooks Available' : 'Add Webhook Step'}
        </Button>
      </Box>

      {webhooks.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No active webhooks found. Please create and activate some webhooks first in the Webhooks tab.
        </Alert>
      )}
    </Box>
  );
};

export default WebhookSequenceBuilder;