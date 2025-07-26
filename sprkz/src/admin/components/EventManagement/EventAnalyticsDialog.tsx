import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { EventAnalytics } from '../../types/event';
import { adminAPI } from '../../services/api';

interface EventAnalyticsDialogProps {
  open: boolean;
  onClose: () => void;
}

const EventAnalyticsDialog: React.FC<EventAnalyticsDialogProps> = ({
  open,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (open) {
      loadAnalytics();
    }
  }, [open, timePeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getEventAnalytics(timePeriod);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timePeriod) {
      case 'hour':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
      case 'month':
        return date.toLocaleDateString();
      default:
        return date.toLocaleString();
    }
  };

  const getMaxCount = () => {
    if (!analytics?.event_timeline) return 0;
    return Math.max(...analytics.event_timeline.map(item => item.event_count));
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      form_view: '#2196f3',
      form_submission: '#4caf50',
      webhook_triggered: '#ff9800',
      webhook_failed: '#f44336',
      automation_executed: '#9c27b0',
      automation_failed: '#e91e63',
      pdf_viewed: '#00bcd4',
      admin_action: '#ffeb3b',
      error_occurred: '#f44336',
    };
    return colors[eventType] || '#9e9e9e';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <TimelineIcon />
            <Typography variant="h6">
              Event Analytics
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as any)}
              label="Time Period"
            >
              <MenuItem value="hour">Last 24 Hours</MenuItem>
              <MenuItem value="day">Last 24 Hours (Hourly)</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : analytics ? (
          <Grid container spacing={3}>
            {/* Timeline Chart */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Event Timeline
                  </Typography>
                  <Box sx={{ height: 300, overflowX: 'auto' }}>
                    {analytics.event_timeline.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No events found for the selected time period
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'end', gap: 1, minWidth: analytics.event_timeline.length * 60, height: 250, p: 2 }}>
                        {analytics.event_timeline.map((item, index) => {
                          const maxCount = getMaxCount();
                          const height = maxCount > 0 ? (item.event_count / maxCount) * 200 : 0;
                          
                          return (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: 50,
                              }}
                            >
                              <Typography variant="caption" sx={{ mb: 1, height: 20 }}>
                                {item.event_count}
                              </Typography>
                              <Box
                                sx={{
                                  width: 30,
                                  height: Math.max(height, 2),
                                  backgroundColor: 'primary.main',
                                  borderRadius: 1,
                                  mb: 1,
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  transform: 'rotate(-45deg)',
                                  fontSize: '0.7rem',
                                  height: 40,
                                  display: 'flex',
                                  alignItems: 'end',
                                }}
                              >
                                {formatTimestamp(item.timestamp)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Event Type Breakdown */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Event Types Distribution
                  </Typography>
                  {analytics.event_timeline.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  ) : (
                    <Box>
                      {/* Calculate totals by event type */}
                      {(() => {
                        const totals: Record<string, number> = {};
                        analytics.event_timeline.forEach(item => {
                          Object.entries(item.event_type_breakdown).forEach(([type, count]) => {
                            totals[type] = (totals[type] || 0) + count;
                          });
                        });
                        
                        const totalEvents = Object.values(totals).reduce((sum, count) => sum + count, 0);
                        
                        return Object.entries(totals)
                          .sort(([,a], [,b]) => b - a)
                          .map(([eventType, count]) => {
                            const percentage = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                            
                            return (
                              <Box key={eventType} sx={{ mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                  <Typography variant="body2">
                                    {eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {count} ({percentage.toFixed(1)}%)
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 8,
                                    backgroundColor: 'grey.200',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: `${percentage}%`,
                                      height: '100%',
                                      backgroundColor: getEventTypeColor(eventType),
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </Box>
                              </Box>
                            );
                          });
                      })()}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Summary Stats */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary Statistics
                  </Typography>
                  {(() => {
                    const totalEvents = analytics.event_timeline.reduce((sum, item) => sum + item.event_count, 0);
                    const avgEventsPerPeriod = analytics.event_timeline.length > 0 
                      ? totalEvents / analytics.event_timeline.length 
                      : 0;
                    const peakEvents = Math.max(...analytics.event_timeline.map(item => item.event_count));
                    
                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TrendingUpIcon color="primary" />
                            <Typography variant="body2">
                              <strong>Total Events:</strong> {totalEvents.toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Average per {timePeriod === 'hour' || timePeriod === 'day' ? 'hour' : 'day'}:</strong> {avgEventsPerPeriod.toFixed(1)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Peak Events:</strong> {peakEvents.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Data Points:</strong> {analytics.event_timeline.length}
                          </Typography>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={loadAnalytics} disabled={loading}>
          Refresh
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventAnalyticsDialog;