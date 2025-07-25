import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export interface DateTimeStampDialogProps {
  open: boolean;
  onClose: () => void;
  onDateTimeSelect: (
    dateTime: Date,
    format: string,
    timezone?: string,
    autoUpdate?: boolean
  ) => void;
  initialDateTime?: Date;
  initialFormat?: string;
  initialTimezone?: string;
  initialAutoUpdate?: boolean;
}

// Predefined date/time formats
const DATE_TIME_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY', example: '12/31/2024' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY', example: '31/12/2024' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD', example: '2024-12-31' },
  { value: 'MMM dd, yyyy', label: 'MMM DD, YYYY', example: 'Dec 31, 2024' },
  { value: 'MMMM dd, yyyy', label: 'MMMM DD, YYYY', example: 'December 31, 2024' },
  { value: 'HH:mm:ss', label: 'HH:MM:SS', example: '14:30:45' },
  { value: 'hh:mm:ss a', label: 'HH:MM:SS AM/PM', example: '2:30:45 PM' },
  { value: 'MM/dd/yyyy HH:mm', label: 'MM/DD/YYYY HH:MM', example: '12/31/2024 14:30' },
  { value: 'yyyy-MM-dd HH:mm:ss', label: 'YYYY-MM-DD HH:MM:SS', example: '2024-12-31 14:30:45' },
  { value: 'MMM dd, yyyy hh:mm a', label: 'MMM DD, YYYY HH:MM AM/PM', example: 'Dec 31, 2024 2:30 PM' },
  { value: 'EEEE, MMMM dd, yyyy', label: 'Day, MMMM DD, YYYY', example: 'Tuesday, December 31, 2024' },
];

// Common timezones
const TIMEZONES = [
  { value: 'local', label: 'Local Time' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

export const DateTimeStampDialog: React.FC<DateTimeStampDialogProps> = ({
  open,
  onClose,
  onDateTimeSelect,
  initialDateTime,
  initialFormat = 'MM/dd/yyyy HH:mm:ss',
  initialTimezone = 'local',
  initialAutoUpdate = false,
}) => {
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(initialDateTime || new Date());
  const [selectedFormat, setSelectedFormat] = useState<string>(initialFormat);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(initialTimezone);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(initialAutoUpdate);
  const [customFormat, setCustomFormat] = useState<string>('');
  const [useCustomFormat, setUseCustomFormat] = useState<boolean>(false);
  const [previewText, setPreviewText] = useState<string>('');

  // Update state when initial values change (for edit mode)
  useEffect(() => {
    if (initialDateTime) setSelectedDateTime(initialDateTime);
    setSelectedFormat(initialFormat);
    setSelectedTimezone(initialTimezone);
    setAutoUpdate(initialAutoUpdate);
  }, [initialDateTime, initialFormat, initialTimezone, initialAutoUpdate]);

  // Update preview when settings change
  useEffect(() => {
    updatePreview();
  }, [selectedDateTime, selectedFormat, customFormat, useCustomFormat, selectedTimezone]);

  // Format date according to selected format
  const formatDateTime = (date: Date, format: string): string => {
    // Simple date formatting implementation
    // In a real application, you might use a library like date-fns or moment.js
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours24 = String(date.getHours()).padStart(2, '0');
    const hours12 = String(date.getHours() % 12 || 12).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const dayNames = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    const result = format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours24)
      .replace('hh', hours12)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace(' a', ` ${ampm}`)
      .replace('MMMM', monthNames[date.getMonth()])
      .replace('MMM', monthNamesShort[date.getMonth()])
      .replace('EEEE', dayNames[date.getDay()]);

    return result;
  };

  // Update preview text
  const updatePreview = () => {
    const format = useCustomFormat ? customFormat : selectedFormat;
    if (format) {
      const formatted = formatDateTime(selectedDateTime, format);
      setPreviewText(formatted);
    } else {
      setPreviewText('');
    }
  };

  // Handle date/time input change
  const handleDateTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTime = new Date(event.target.value);
    if (!isNaN(newDateTime.getTime())) {
      setSelectedDateTime(newDateTime);
    }
  };

  // Handle "Use Current Time" button
  const handleUseCurrentTime = () => {
    setSelectedDateTime(new Date());
  };

  // Handle format selection
  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
    setUseCustomFormat(false);
  };

  // Handle custom format toggle
  const handleCustomFormatToggle = (enabled: boolean) => {
    setUseCustomFormat(enabled);
    if (enabled && !customFormat) {
      setCustomFormat(selectedFormat);
    }
  };

  // Handle apply stamp
  const handleApplyStamp = () => {
    const format = useCustomFormat ? customFormat : selectedFormat;
    const timezone = selectedTimezone === 'local' ? undefined : selectedTimezone;
    onDateTimeSelect(selectedDateTime, format, timezone, autoUpdate);
    handleClose();
  };

  // Handle dialog close
  const handleClose = () => {
    // Reset to defaults
    setSelectedDateTime(new Date());
    setSelectedFormat('MM/dd/yyyy HH:mm:ss');
    setSelectedTimezone('local');
    setAutoUpdate(false);
    setCustomFormat('');
    setUseCustomFormat(false);
    onClose();
  };

  // Get datetime-local input value
  const getDateTimeInputValue = () => {
    const date = selectedDateTime;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimeIcon />
          Date/Time Stamp Settings
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Date/Time Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Date & Time
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Select Date & Time"
                type="datetime-local"
                value={getDateTimeInputValue()}
                onChange={handleDateTimeChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleUseCurrentTime}
              fullWidth
            >
              Use Current Time
            </Button>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                  />
                }
                label="Auto-update when document opens"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                When enabled, this timestamp will show the current time each time the document is opened
              </Typography>
            </Box>
          </Grid>

          {/* Format Selection */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Format
            </Typography>

            {!useCustomFormat && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Date/Time Format</InputLabel>
                <Select
                  value={selectedFormat}
                  label="Date/Time Format"
                  onChange={(e) => handleFormatChange(e.target.value)}
                >
                  {DATE_TIME_FORMATS.map((format) => (
                    <MenuItem key={format.value} value={format.value}>
                      <Box>
                        <Typography variant="body2">{format.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format.example}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={useCustomFormat}
                  onChange={(e) => handleCustomFormatToggle(e.target.checked)}
                />
              }
              label="Use custom format"
            />

            {useCustomFormat && (
              <TextField
                label="Custom Format"
                value={customFormat}
                onChange={(e) => setCustomFormat(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
                placeholder="yyyy-MM-dd HH:mm:ss"
                helperText="Use: yyyy (year), MM (month), dd (day), HH (24h), hh (12h), mm (minutes), ss (seconds), a (AM/PM)"
              />
            )}
          </Grid>

          {/* Timezone Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Timezone
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={selectedTimezone}
                label="Timezone"
                onChange={(e) => setSelectedTimezone(e.target.value)}
              >
                {TIMEZONES.map((timezone) => (
                  <MenuItem key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed',
                borderColor: 'divider',
              }}
            >
              {previewText ? (
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'monospace',
                      color: 'text.primary',
                      border: '1px solid',
                      borderColor: 'divider',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                    }}
                  >
                    {previewText}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    This is how the timestamp will appear on your document
                    {autoUpdate && ' (will update automatically when document opens)'}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Preview will appear here
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Format Reference */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Format Reference:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { code: 'yyyy', desc: 'Year (4 digits)' },
                { code: 'MM', desc: 'Month (01-12)' },
                { code: 'dd', desc: 'Day (01-31)' },
                { code: 'HH', desc: 'Hour (00-23)' },
                { code: 'hh', desc: 'Hour (01-12)' },
                { code: 'mm', desc: 'Minutes (00-59)' },
                { code: 'ss', desc: 'Seconds (00-59)' },
                { code: 'a', desc: 'AM/PM' },
              ].map((item) => (
                <Box
                  key={item.code}
                  sx={{
                    px: 1,
                    py: 0.5,
                    backgroundColor: 'grey.100',
                    borderRadius: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {item.code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {' = ' + item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleApplyStamp}
          variant="contained"
          startIcon={<DateIcon />}
          disabled={!previewText}
        >
          Add Timestamp
        </Button>
      </DialogActions>
    </Dialog>
  );
};