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
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ExecuteIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  AutoMode as AutoIcon,
} from '@mui/icons-material';
import { Automation, AutomationExecutionResult } from '../../types/automation';
import AutomationDialog from './AutomationDialog';
import AutomationExecutionDialog from './AutomationExecutionDialog';
import { adminAPI } from '../../services/api';

const AutomationManagement: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [executingAutomation, setExecutingAutomation] = useState<Automation | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);

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
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAutomations();
      setAutomations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAutomation = () => {
    setEditingAutomation(null);
    setDialogOpen(true);
  };

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation);
    setDialogOpen(true);
  };

  const handleDeleteAutomation = async (automation: Automation) => {
    if (!window.confirm(`Are you sure you want to delete "${automation.name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteAutomation(automation.id);
      showNotification('Automation deleted successfully', 'success');
      loadAutomations();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to delete automation',
        'error'
      );
    }
  };

  const handleToggleActive = async (automation: Automation) => {
    try {
      const updatedData = {
        name: automation.name,
        description: automation.description,
        is_active: !automation.is_active,
        trigger_type: automation.trigger_type,
        trigger_config: automation.trigger_config || {},
      };

      await adminAPI.updateAutomation(automation.id, updatedData);
      showNotification(
        `Automation ${automation.is_active ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
      loadAutomations();
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to update automation',
        'error'
      );
    }
  };

  const handleExecuteAutomation = async (automation: Automation) => {
    if (!automation.is_active) {
      showNotification('Cannot execute inactive automation', 'error');
      return;
    }

    setExecutingId(automation.id);
    try {
      const result = await adminAPI.executeAutomation(automation.id);
      
      if (result.success) {
        showNotification(
          `Automation executed successfully (${result.completed_steps}/${result.total_steps} steps)`,
          'success'
        );
      } else {
        showNotification(
          `Automation failed: ${result.error_message} (${result.completed_steps}/${result.total_steps} steps completed)`,
          'error'
        );
      }
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to execute automation',
        'error'
      );
    } finally {
      setExecutingId(null);
    }
  };

  const handleViewExecutions = (automation: Automation) => {
    setExecutingAutomation(automation);
    setExecutionDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAutomation(null);
  };

  const handleExecutionDialogClose = () => {
    setExecutionDialogOpen(false);
    setExecutingAutomation(null);
  };

  const handleAutomationSaved = () => {
    loadAutomations();
    handleDialogClose();
  };

  const getTriggerTypeColor = (triggerType: string) => {
    switch (triggerType) {
      case 'manual': return 'primary';
      case 'form_submission': return 'success';
      case 'schedule': return 'warning';
      default: return 'default';
    }
  };

  const getTriggerTypeLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'manual': return 'Manual';
      case 'form_submission': return 'Form Submit';
      case 'schedule': return 'Scheduled';
      default: return triggerType;
    }
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
        <Box display="flex" alignItems="center" gap={1}>
          <AutoIcon color="primary" />
          <Typography variant="h4" component="h1">
            Automation Management
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAutomations}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddAutomation}
          >
            Add Automation
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
                <TableCell>Description</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Steps</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {automations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No automations configured. Click "Add Automation" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                automations.map((automation) => (
                  <TableRow key={automation.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {automation.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {automation.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTriggerTypeLabel(automation.trigger_type)}
                        size="small"
                        color={getTriggerTypeColor(automation.trigger_type) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={automation.is_active}
                        onChange={() => handleToggleActive(automation)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent="?" color="info" variant="dot">
                        <Typography variant="body2" color="text.secondary">
                          View Steps
                        </Typography>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(automation.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Execute Automation">
                        <IconButton
                          size="small"
                          onClick={() => handleExecuteAutomation(automation)}
                          disabled={!automation.is_active || executingId === automation.id}
                        >
                          {executingId === automation.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <ExecuteIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Execution History">
                        <IconButton
                          size="small"
                          onClick={() => handleViewExecutions(automation)}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Automation">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAutomation(automation)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Automation">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAutomation(automation)}
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

      <AutomationDialog
        open={dialogOpen}
        automation={editingAutomation}
        onClose={handleDialogClose}
        onSaved={handleAutomationSaved}
      />

      <AutomationExecutionDialog
        open={executionDialogOpen}
        automation={executingAutomation}
        onClose={handleExecutionDialogClose}
      />
    </Box>
  );
};

export default AutomationManagement;