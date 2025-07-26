import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface HeaderEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

interface HeaderPair {
  key: string;
  value: string;
  id: string;
}

const HeaderEditor: React.FC<HeaderEditorProps> = ({ headers, onChange }) => {
  const [headerPairs, setHeaderPairs] = useState<HeaderPair[]>(() => {
    return Object.entries(headers).map(([key, value], index) => ({
      key,
      value,
      id: `header-${index}`,
    }));
  });

  const updateHeaders = (pairs: HeaderPair[]) => {
    const newHeaders: Record<string, string> = {};
    pairs.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        newHeaders[key.trim()] = value.trim();
      }
    });
    onChange(newHeaders);
  };

  const addHeader = () => {
    const newPairs = [
      ...headerPairs,
      { key: '', value: '', id: `header-${Date.now()}` },
    ];
    setHeaderPairs(newPairs);
  };

  const removeHeader = (id: string) => {
    const newPairs = headerPairs.filter(pair => pair.id !== id);
    setHeaderPairs(newPairs);
    updateHeaders(newPairs);
  };

  const updateHeaderPair = (id: string, field: 'key' | 'value', newValue: string) => {
    const newPairs = headerPairs.map(pair =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    );
    setHeaderPairs(newPairs);
    updateHeaders(newPairs);
  };

  const addCommonHeader = (key: string, value: string) => {
    const existingIndex = headerPairs.findIndex(pair => pair.key === key);
    if (existingIndex >= 0) {
      // Update existing header
      updateHeaderPair(headerPairs[existingIndex].id, 'value', value);
    } else {
      // Add new header
      const newPairs = [
        ...headerPairs,
        { key, value, id: `header-${Date.now()}` },
      ];
      setHeaderPairs(newPairs);
      updateHeaders(newPairs);
    }
  };

  const commonHeaders = [
    { label: 'Authorization Bearer', key: 'Authorization', value: 'Bearer your-token-here' },
    { label: 'API Key', key: 'X-API-Key', value: 'your-api-key' },
    { label: 'Content-Type JSON', key: 'Content-Type', value: 'application/json' },
    { label: 'User-Agent', key: 'User-Agent', value: 'Sprkz-Webhook/1.0' },
    { label: 'Accept', key: 'Accept', value: 'application/json' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">
          Custom HTTP Headers
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addHeader}
          variant="outlined"
        >
          Add Header
        </Button>
      </Box>

      {headerPairs.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No custom headers configured. Click "Add Header" to add one.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {headerPairs.map((pair) => (
            <Paper key={pair.id} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Header Name"
                    value={pair.key}
                    onChange={(e) => updateHeaderPair(pair.id, 'key', e.target.value)}
                    placeholder="e.g., Authorization"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Header Value"
                    value={pair.value}
                    onChange={(e) => updateHeaderPair(pair.id, 'value', e.target.value)}
                    placeholder="e.g., Bearer token123"
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    size="small"
                    onClick={() => removeHeader(pair.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      )}

      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Common Headers
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Click to add common headers quickly
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {commonHeaders.map((header) => (
            <Chip
              key={header.key}
              label={header.label}
              size="small"
              clickable
              variant="outlined"
              icon={<CopyIcon />}
              onClick={() => addCommonHeader(header.key, header.value)}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </Box>

      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          <strong>Security Note:</strong> Sensitive values like API keys and tokens will be stored securely. 
          Avoid using production credentials in development environments.
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderEditor;