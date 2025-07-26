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
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  AutoMode as AutoIcon,
} from '@mui/icons-material';
import { Automation, AutomationFormData } from '../../types/automation';
import WebhookSequenceBuilder from './WebhookSequenceBuilder';
import { adminAPI } from '../../services/api';

interface AutomationDialogProps {
  open: boolean;
  automation: Automation | null;
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
      id={`automation-tabpanel-${index}`}
      aria-labelledby={`automation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const AutomationDialog: React.FC<AutomationDialogProps> = ({
  open,
  automation,
  onClose,
  onSaved,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [webhookSteps, setWebhookSteps] = useState<any[]>([]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - could be replaced with a proper notification system
    if (type === 'success') {
      console.log('Success:', message);
    } else {
      console.error('Error:', message);
    }
  };
  
  const [formData, setFormData] = useState<AutomationFormData>({
    name: '',
    description: '',
    is_active: true,
    trigger_type: 'manual',
    trigger_config: {},
  });

  useEffect(() => {
    if (automation && open) {
      setFormData({
        name: automation.name,
        description: automation.description,
        is_active: automation.is_active,
        trigger_type: automation.trigger_type,
        trigger_config: automation.trigger_config || {},
      });
      
      // Load automation steps if editing
      loadAutomationSteps(automation.id);
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true,
        trigger_type: 'manual',
        trigger_config: {},
      });
      setWebhookSteps([]);
    }
    setTabValue(0);
    setErrors({});
  }, [automation, open]);

  const loadAutomationSteps = async (automationId: number) => {
    try {
      const automationWithSteps = await adminAPI.getAutomation(automationId);
      setWebhookSteps(automationWithSteps.steps || []);
    } catch (err) {
      console.error('Failed to load automation steps:', err);
      setWebhookSteps([]);
    }
  };

  const handleInputChange = (field: keyof AutomationFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (webhookSteps.length === 0) {
      newErrors.steps = 'At least one webhook step is required';
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
      const automationData = {
        ...formData,
        steps: webhookSteps
      };

      if (automation) {
        await adminAPI.updateAutomation(automation.id, automationData);
      } else {
        await adminAPI.createAutomation(automationData);
      }

      showNotification(
        `Automation ${automation ? 'updated' : 'created'} successfully`,
        'success'
      );
      onSaved();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : `Failed to ${automation ? 'update' : 'create'} automation`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleWebhookStepsChange = (steps: any[]) => {
    setWebhookSteps(steps);
    // Clear steps error when steps are added
    if (errors.steps && steps.length > 0) {
      setErrors(prev => ({ ...prev, steps: '' }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoIcon />
          {automation ? 'Edit Automation' : 'Add New Automation'}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<SettingsIcon />} label="Configuration" />
            <Tab icon={<TimelineIcon />} label="Webhook Sequence" />
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
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                multiline
                rows={2}
                placeholder="Describe what this automation does..."
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Trigger Type</InputLabel>
                <Select
                  value={formData.trigger_type}
                  onChange={handleInputChange('trigger_type')}
                  label="Trigger Type"
                >
                  <MenuItem value="manual">Manual Execution</MenuItem>
                  <MenuItem value="form_submission">Form Submission</MenuItem>
                  <MenuItem value="schedule">Scheduled</MenuItem>
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

            {formData.trigger_type === 'form_submission' && (
              <Grid item xs={12}>
                <Alert severity="info">
                  This automation will execute automatically when a form is submitted.
                  The form data will be passed to each webhook in the sequence.
                </Alert>
              </Grid>
            )}

            {formData.trigger_type === 'schedule' && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Scheduled automations are not yet implemented. This will execute manually for now.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            {errors.steps && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.steps}
              </Alert>
            )}
            
            <Typography variant="h6" gutterBottom>
              Webhook Execution Sequence
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Define the order in which webhooks will be executed. Each webhook will run one after another.
              You can configure delays, retry behavior, and failure handling for each step.
            </Typography>

            <WebhookSequenceBuilder
              steps={webhookSteps}
              onChange={handleWebhookStepsChange}
            />
          </Box>
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
          {loading ? 'Saving...' : automation ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AutomationDialog;