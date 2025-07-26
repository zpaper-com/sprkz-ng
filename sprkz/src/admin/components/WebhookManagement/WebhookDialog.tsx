import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Http as HttpIcon,
  Replay as ReplayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Webhook, WebhookFormData } from '../../types/webhook';
import PayloadEditor from './PayloadEditor';
import HeaderEditor from './HeaderEditor';
import { adminAPI } from '../../services/api';

interface WebhookDialogProps {
  open: boolean;
  webhook: Webhook | null;
  onClose: () => void;
  onSaved: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webhook-tabpanel-${index}`}
      aria-labelledby={`webhook-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const WebhookDialog: React.FC<WebhookDialogProps> = ({
  open,
  webhook,
  onClose,
  onSaved,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - could be replaced with a proper notification system
    if (type === 'success') {
      console.log('Success:', message);
    } else {
      console.error('Error:', message);
    }
  };
  
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    url: '',
    method: 'POST',
    is_active: true,
    retry_enabled: false,
    retry_count: 3,
    retry_delay_seconds: 60,
    timeout_seconds: 30,
    headers: {},
    payload_type: 'json',
    payload_template: '{}',
  });

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name,
        url: webhook.url,
        method: webhook.method,
        is_active: webhook.is_active,
        retry_enabled: webhook.retry_enabled,
        retry_count: webhook.retry_count,
        retry_delay_seconds: webhook.retry_delay_seconds,
        timeout_seconds: webhook.timeout_seconds,
        headers: webhook.headers || {},
        payload_type: webhook.payload_type,
        payload_template: webhook.payload_template || '{}',
      });
    } else {
      setFormData({
        name: '',
        url: '',
        method: 'POST',
        is_active: true,
        retry_enabled: false,
        retry_count: 3,
        retry_delay_seconds: 60,
        timeout_seconds: 30,
        headers: {},
        payload_type: 'json',
        payload_template: '{}',
      });
    }
    setTabValue(0);
    setErrors({});
  }, [webhook, open]);

  const handleInputChange = (field: keyof WebhookFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleHeadersChange = (headers: Record<string, string>) => {
    setFormData(prev => ({ ...prev, headers }));
  };

  const handlePayloadTemplateChange = (template: string) => {
    setFormData(prev => ({ ...prev, payload_template: template }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (formData.retry_enabled) {
      if (formData.retry_count < 1 || formData.retry_count > 10) {
        newErrors.retry_count = 'Retry count must be between 1 and 10';
      }
      if (formData.retry_delay_seconds < 1 || formData.retry_delay_seconds > 3600) {
        newErrors.retry_delay_seconds = 'Retry delay must be between 1 and 3600 seconds';
      }
    }

    if (formData.timeout_seconds < 1 || formData.timeout_seconds > 300) {
      newErrors.timeout_seconds = 'Timeout must be between 1 and 300 seconds';
    }

    if (formData.payload_type === 'json' && formData.payload_template) {
      try {
        JSON.parse(formData.payload_template);
      } catch {
        newErrors.payload_template = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (webhook) {
        await adminAPI.updateWebhook(webhook.id, formData);
      } else {
        await adminAPI.createWebhook(formData);
      }

      showNotification(
        `Webhook ${webhook ? 'updated' : 'created'} successfully`,
        'success'
      );
      onSaved();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : `Failed to ${webhook ? 'update' : 'create'} webhook`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        {webhook ? 'Edit Webhook' : 'Add New Webhook'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<HttpIcon />} label="Basic" />
            <Tab icon={<CodeIcon />} label="Payload" />
            <Tab icon={<ReplayIcon />} label="Retry" />
            <Tab icon={<SettingsIcon />} label="Advanced" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={handleInputChange('url')}
                error={!!errors.url}
                helperText={errors.url}
                placeholder="https://api.example.com/webhook"
                required
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>HTTP Method</InputLabel>
                <Select
                  value={formData.method}
                  onChange={handleInputChange('method')}
                  label="HTTP Method"
                >
                  <MenuItem value="GET">GET</MenuItem>
                  <MenuItem value="POST">POST</MenuItem>
                  <MenuItem value="PUT">PUT</MenuItem>
                  <MenuItem value="PATCH">PATCH</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange('is_active')}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box mb={2}>
            <FormControl component="fieldset">
              <Typography variant="subtitle2" gutterBottom>
                Payload Type
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                {(['json', 'pdf', 'dynamic'] as const).map((type) => (
                  <Chip
                    key={type}
                    label={type.toUpperCase()}
                    clickable
                    color={formData.payload_type === type ? 'primary' : 'default'}
                    variant={formData.payload_type === type ? 'filled' : 'outlined'}
                    onClick={() => setFormData(prev => ({ ...prev, payload_type: type }))}
                  />
                ))}
              </Box>
            </FormControl>
          </Box>
          
          <PayloadEditor
            payloadType={formData.payload_type}
            template={formData.payload_template}
            onChange={handlePayloadTemplateChange}
            error={errors.payload_template}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.retry_enabled}
                    onChange={handleInputChange('retry_enabled')}
                  />
                }
                label="Enable Retry"
              />
            </Grid>
            
            {formData.retry_enabled && (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retry Count"
                    value={formData.retry_count}
                    onChange={handleInputChange('retry_count')}
                    error={!!errors.retry_count}
                    helperText={errors.retry_count || 'Maximum number of retry attempts (1-10)'}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retry Delay (seconds)"
                    value={formData.retry_delay_seconds}
                    onChange={handleInputChange('retry_delay_seconds')}
                    error={!!errors.retry_delay_seconds}
                    helperText={errors.retry_delay_seconds || 'Delay between retry attempts'}
                    inputProps={{ min: 1, max: 3600 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (seconds)"
                value={formData.timeout_seconds}
                onChange={handleInputChange('timeout_seconds')}
                error={!!errors.timeout_seconds}
                helperText={errors.timeout_seconds || 'Request timeout duration'}
                inputProps={{ min: 1, max: 300 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Custom Headers</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <HeaderEditor
                    headers={formData.headers}
                    onChange={handleHeadersChange}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : webhook ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WebhookDialog;