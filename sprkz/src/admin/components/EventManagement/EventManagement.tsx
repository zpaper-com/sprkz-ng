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
  Chip,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { SystemEvent, EventSummary, EventFilters, EventType, EventCategory } from '../../types/event';
import EventDetailDialog from './EventDetailDialog';
import EventAnalyticsDialog from './EventAnalyticsDialog';
import { adminAPI } from '../../services/api';

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({
    limit: 50,
    offset: 0
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - could be replaced with a proper notification system
    if (type === 'success') {
      console.log('Success:', message);
    } else {
      console.error('Error:', message);
    }
  };

  useEffect(() => {
    loadEvents();
    loadSummary();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getEvents(filters);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await adminAPI.getEventSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load event summary:', err);
    }
  };

  const handleRefresh = () => {
    loadEvents();
    loadSummary();
  };

  const handleFilterChange = (field: keyof EventFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, offset: 0 }));
  };

  const handleClearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
  };

  const handleViewEvent = (event: SystemEvent) => {
    setSelectedEvent(event);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleOpenAnalytics = () => {
    setAnalyticsDialogOpen(true);
  };

  const handleCloseAnalytics = () => {
    setAnalyticsDialogOpen(false);
  };

  const getEventTypeColor = (eventType: EventType) => {
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

  const getEventCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'user_interaction': return <ViewIcon />;
      case 'webhook_activity': return <TimelineIcon />;
      case 'automation_activity': return <TimelineIcon />;
      case 'admin_activity': return <WarningIcon />;
      case 'error_tracking': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatEventType = (eventType: EventType) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatEventCategory = (category: EventCategory) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <TimelineIcon color="primary" />
          <Typography variant="h4" component="h1">
            System Events
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<TimelineIcon />}
            onClick={handleOpenAnalytics}
            sx={{ mr: 2 }}
          >
            Analytics
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {summary.total_events.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {summary.events_today.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Events Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {summary.events_this_week.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This Week
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {summary.recent_errors.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recent Errors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Accordion 
        expanded={filtersExpanded}
        onChange={() => setFiltersExpanded(!filtersExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <FilterIcon />
            <Typography>Filters</Typography>
            {Object.keys(filters).filter(key => filters[key as keyof EventFilters] && !['limit', 'offset'].includes(key)).length > 0 && (
              <Badge 
                badgeContent={Object.keys(filters).filter(key => filters[key as keyof EventFilters] && !['limit', 'offset'].includes(key)).length} 
                color="primary"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.event_type || ''}
                  onChange={(e) => handleFilterChange('event_type', e.target.value || undefined)}
                  label="Event Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="form_view">Form View</MenuItem>
                  <MenuItem value="form_submission">Form Submission</MenuItem>
                  <MenuItem value="webhook_triggered">Webhook Triggered</MenuItem>
                  <MenuItem value="webhook_failed">Webhook Failed</MenuItem>
                  <MenuItem value="automation_executed">Automation Executed</MenuItem>
                  <MenuItem value="automation_failed">Automation Failed</MenuItem>
                  <MenuItem value="pdf_viewed">PDF Viewed</MenuItem>
                  <MenuItem value="admin_action">Admin Action</MenuItem>
                  <MenuItem value="error_occurred">Error Occurred</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.event_category || ''}
                  onChange={(e) => handleFilterChange('event_category', e.target.value || undefined)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="user_interaction">User Interaction</MenuItem>
                  <MenuItem value="system_operation">System Operation</MenuItem>
                  <MenuItem value="webhook_activity">Webhook Activity</MenuItem>
                  <MenuItem value="automation_activity">Automation Activity</MenuItem>
                  <MenuItem value="admin_activity">Admin Activity</MenuItem>
                  <MenuItem value="error_tracking">Error Tracking</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                placeholder="Search events..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Session ID"
                value={filters.session_id || ''}
                onChange={(e) => handleFilterChange('session_id', e.target.value || undefined)}
                placeholder="Filter by session..."
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Events Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Session</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No events found. Try adjusting your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(event.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatEventType(event.event_type)}
                        size="small"
                        color={getEventTypeColor(event.event_type) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getEventCategoryIcon(event.event_category)}
                        <Typography variant="body2">
                          {formatEventCategory(event.event_category)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {event.event_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {truncateText(event.description)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {event.session_id ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {event.session_id.substring(0, 8)}...
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewEvent(event)}
                        >
                          <ViewIcon />
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

      <EventDetailDialog
        open={detailDialogOpen}
        event={selectedEvent}
        onClose={handleCloseDetailDialog}
      />

      <EventAnalyticsDialog
        open={analyticsDialogOpen}
        onClose={handleCloseAnalytics}
      />
    </Box>
  );
};

export default EventManagement;