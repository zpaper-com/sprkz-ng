import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as TestIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Webhook } from '../../types/webhook';
import WebhookDialog from './WebhookDialog';
import WebhookTestDialog from './WebhookTestDialog';
import { adminAPI } from '../../services/api';

const WebhookManagement: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<Webhook | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - could be replaced with a proper notification system
    if (type === 'success') {
      console.log('Success:', message);
    } else {
      console.error('Error:', message);
    }
    // You could also show a Material-UI Snackbar here
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWebhook = () => {
    setEditingWebhook(null);
    setDialogOpen(true);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setDialogOpen(true);
  };

  const handleDeleteWebhook = async (webhook: Webhook) => {
    if (!window.confirm(`Are you sure you want to delete "${webhook.name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteWebhook(webhook.id);
      showNotification('Webhook deleted successfully', 'success');
      loadWebhooks();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to delete webhook',
        'error'
      );
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const updatedData = {
        name: webhook.name,
        url: webhook.url,
        method: webhook.method,
        is_active: !webhook.is_active,
        retry_enabled: webhook.retry_enabled,
        retry_count: webhook.retry_count,
        retry_delay_seconds: webhook.retry_delay_seconds,
        timeout_seconds: webhook.timeout_seconds,
        headers: webhook.headers || {},
        payload_type: webhook.payload_type,
        payload_template: webhook.payload_template || '{}',
      };

      await adminAPI.updateWebhook(webhook.id, updatedData);
      showNotification(
        `Webhook ${webhook.is_active ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
      loadWebhooks();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to update webhook',
        'error'
      );
    }
  };

  const handleTestWebhook = (webhook: Webhook) => {
    setTestingWebhook(webhook);
    setTestDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingWebhook(null);
  };

  const handleTestDialogClose = () => {
    setTestDialogOpen(false);
    setTestingWebhook(null);
  };

  const handleWebhookSaved = () => {
    loadWebhooks();
    handleDialogClose();
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

  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Webhook Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadWebhooks}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddWebhook}
          >
            Add Webhook
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Retry</TableCell>
                <TableCell>Payload Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No webhooks configured. Click "Add Webhook" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {webhook.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={webhook.url}>
                        <Typography variant="body2" color="text.secondary">
                          {truncateUrl(webhook.url)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={webhook.method}
                        size="small"
                        color={getMethodColor(webhook.method) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={webhook.is_active}
                        onChange={() => handleToggleActive(webhook)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={webhook.retry_enabled ? 'Enabled' : 'Disabled'}
                        size="small"
                        variant={webhook.retry_enabled ? 'filled' : 'outlined'}
                        color={webhook.retry_enabled ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={webhook.payload_type.toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Test Webhook">
                        <IconButton
                          size="small"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={!webhook.is_active}
                        >
                          <TestIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Webhook">
                        <IconButton
                          size="small"
                          onClick={() => handleEditWebhook(webhook)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Webhook">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWebhook(webhook)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <WebhookDialog
        open={dialogOpen}
        webhook={editingWebhook}
        onClose={handleDialogClose}
        onSaved={handleWebhookSaved}
      />

      <WebhookTestDialog
        open={testDialogOpen}
        webhook={testingWebhook}
        onClose={handleTestDialogClose}
      />
    </Box>
  );
};

export default WebhookManagement;