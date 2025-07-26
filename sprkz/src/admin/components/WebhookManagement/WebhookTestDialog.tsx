import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Alert,
  Chip,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { Webhook, WebhookTestResult } from '../../types/webhook';
import { adminAPI } from '../../services/api';

interface WebhookTestDialogProps {
  open: boolean;
  webhook: Webhook | null;
  onClose: () => void;
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
      id={`test-tabpanel-${index}`}
      aria-labelledby={`test-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const WebhookTestDialog: React.FC<WebhookTestDialogProps> = ({
  open,
  webhook,
  onClose,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testPayload, setTestPayload] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');

  useEffect(() => {
    if (webhook && open) {
      // Initialize with default test payload
      const defaultPayload = {
        formData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        },
        timestamp: new Date().toISOString(),
        pdfUrl: 'https://example.com/sample-form.pdf',
        metadata: {
          source: 'sprkz-test',
          version: '1.0'
        }
      };

      setTestPayload(JSON.stringify(defaultPayload, null, 2));
      setCustomHeaders('{}');
      setTestResult(null);
      setTabValue(0);
    }
  }, [webhook, open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTestWebhook = async () => {
    if (!webhook) return;

    setLoading(true);
    try {
      let parsedPayload = {};
      if (testPayload.trim()) {
        parsedPayload = JSON.parse(testPayload);
      }

      const result = await adminAPI.testWebhook(webhook.id, { testPayload: parsedPayload });
      setTestResult(result);
      setTabValue(1); // Switch to results tab
    } catch (err) {
      setTestResult({
        success: false,
        status_code: null,
        response_body: null,
        error_message: err instanceof Error ? err.message : 'Failed to test webhook',
        response_time_ms: 0
      });
      setTabValue(1); // Switch to results tab
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatResponseBody = (body: string | null) => {
    if (!body) return 'No response body';
    
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return 'error';
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400) return 'error';
    return 'warning';
  };

  if (!webhook) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlayIcon />
          Test Webhook: {webhook.name}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Configure Test" />
            <Tab label="Results" disabled={!testResult && !loading} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Webhook Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>URL:</strong> {webhook.url}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Method:</strong> 
                      <Chip 
                        label={webhook.method} 
                        size="small" 
                        sx={{ ml: 1 }}
                        color={webhook.method === 'POST' ? 'success' : 'primary'}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Timeout:</strong> {webhook.timeout_seconds}s
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Test Payload
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                placeholder="Enter JSON payload for testing..."
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This payload will be sent to the webhook URL. Modify as needed for testing.
              </Typography>
            </Grid>

            {webhook.headers && Object.keys(webhook.headers).length > 0 && (
              <Grid item xs={12}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Configured Headers ({Object.keys(webhook.headers).length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      {Object.entries(webhook.headers).map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {key}:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Testing webhook...</Typography>
            </Box>
          ) : testResult ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert 
                  severity={testResult.success ? 'success' : 'error'}
                  icon={testResult.success ? <SuccessIcon /> : <ErrorIcon />}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography>
                      {testResult.success ? 'Webhook test successful!' : 'Webhook test failed'}
                    </Typography>
                    {testResult.status_code && (
                      <Chip 
                        label={`HTTP ${testResult.status_code}`}
                        size="small"
                        color={getStatusColor(testResult.status_code)}
                      />
                    )}
                    <Chip 
                      icon={<TimeIcon />}
                      label={`${testResult.response_time_ms}ms`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Alert>
              </Grid>

              {testResult.error_message && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Error Message
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {testResult.error_message}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {testResult.response_body && (
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle2">
                      Response Body
                    </Typography>
                    <Tooltip title="Copy response">
                      <IconButton 
                        size="small" 
                        onClick={() => copyToClipboard(testResult.response_body || '')}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {formatResponseBody(testResult.response_body)}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Test Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Status Code:</strong> {testResult.status_code || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Response Time:</strong> {testResult.response_time_ms}ms
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : null}
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        {tabValue === 0 && (
          <Button
            onClick={handleTestWebhook}
            variant="contained"
            disabled={loading || !webhook.is_active}
            startIcon={loading ? <CircularProgress size={16} /> : <PlayIcon />}
          >
            {loading ? 'Testing...' : 'Run Test'}
          </Button>
        )}
        {tabValue === 1 && testResult && (
          <Button
            onClick={() => setTabValue(0)}
            variant="outlined"
          >
            Run Another Test
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WebhookTestDialog;