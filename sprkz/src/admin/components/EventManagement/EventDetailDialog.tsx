import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { SystemEvent } from '../../types/event';

interface EventDetailDialogProps {
  open: boolean;
  event: SystemEvent | null;
  onClose: () => void;
}

const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  open,
  event,
  onClose,
}) => {
  if (!event) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatMetadata = (metadata: Record<string, any> | null) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return 'No metadata available';
    }
    return JSON.stringify(metadata, null, 2);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'form_view': return 'info';
      case 'form_submission': return 'success';
      case 'webhook_triggered': return 'primary';
      case 'webhook_failed': return 'error';
      case 'automation_executed': return 'secondary';
      case 'automation_failed': return 'error';
      case 'pdf_viewed': return 'info';
      case 'admin_action': return 'warning';
      case 'error_occurred': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Event Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Event ID:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {event.id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Timestamp:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {new Date(event.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Event Type:</strong>
                  </Typography>
                  <Chip
                    label={event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    size="small"
                    color={getEventTypeColor(event.event_type) as any}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Category:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {event.event_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Event Name:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {event.event_name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {event.description}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Session & User Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Session & User Information
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Session ID:</strong>
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {event.session_id || 'None'}
                    </Typography>
                    {event.session_id && (
                      <Tooltip title="Copy Session ID">
                        <IconButton size="small" onClick={() => copyToClipboard(event.session_id!)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>User ID:</strong>
                  </Typography>
                  <Typography variant="body1">
                    {event.user_id || 'None'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>IP Address:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {event.ip_address || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>User Agent:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {event.user_agent || 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Metadata */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6">
                Event Metadata
              </Typography>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <Tooltip title="Copy Metadata">
                  <IconButton size="small" onClick={() => copyToClipboard(formatMetadata(event.metadata))}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
              <Typography 
                variant="body2" 
                component="pre" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0
                }}
              >
                {formatMetadata(event.metadata)}
              </Typography>
            </Paper>
          </Grid>

          {/* Additional Insights */}
          {event.metadata && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Quick Insights
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Grid container spacing={1}>
                  {event.event_type === 'webhook_triggered' && event.metadata.response_time_ms && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Response Time:</strong> {event.metadata.response_time_ms}ms
                      </Typography>
                    </Grid>
                  )}
                  {event.metadata.success !== undefined && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Success:</strong> {event.metadata.success ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  )}
                  {event.metadata.payload_size_bytes && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Payload Size:</strong> {event.metadata.payload_size_bytes} bytes
                      </Typography>
                    </Grid>
                  )}
                  {event.metadata.execution_time_ms && (
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Execution Time:</strong> {event.metadata.execution_time_ms}ms
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailDialog;