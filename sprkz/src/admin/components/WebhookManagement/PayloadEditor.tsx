import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Alert,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  FormatAlignLeft as FormatIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';

interface PayloadEditorProps {
  payloadType: 'json' | 'pdf' | 'dynamic';
  template: string;
  onChange: (template: string) => void;
  error?: string;
}

const PayloadEditor: React.FC<PayloadEditorProps> = ({
  payloadType,
  template,
  onChange,
  error,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatJson = () => {
    if (payloadType === 'json') {
      try {
        const formatted = JSON.stringify(JSON.parse(template), null, 2);
        onChange(formatted);
      } catch (err) {
        // Invalid JSON, don't format
      }
    }
  };

  const getPlaceholderText = () => {
    switch (payloadType) {
      case 'json':
        return `{
  "event_type": "{{event_type}}",
  "timestamp": "{{timestamp}}",
  "data": {
    "id": "{{id}}",
    "name": "{{name}}",
    "email": "{{email}}"
  }
}`;
      case 'pdf':
        return `<!DOCTYPE html>
<html>
<head>
    <title>{{document_title}}</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{title}}</h1>
        <p>Generated on: {{date}}</p>
    </div>
    <div class="content">
        <p>Customer: {{customer_name}}</p>
        <p>Order ID: {{order_id}}</p>
    </div>
</body>
</html>`;
      case 'dynamic':
        return `{
  "rules": [
    {
      "condition": "{{event_type}} === 'order'",
      "payload_type": "pdf",
      "template_id": 1
    },
    {
      "condition": "{{event_type}} === 'notification'",
      "payload_type": "json",
      "template": {
        "message": "{{message}}",
        "recipient": "{{recipient}}"
      }
    }
  ]
}`;
      default:
        return '';
    }
  };

  const getVariables = () => {
    if (!template) return [];
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const variables = getVariables();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">
          {payloadType === 'json' && 'JSON Template'}
          {payloadType === 'pdf' && 'HTML Template'}
          {payloadType === 'dynamic' && 'Dynamic Rules Configuration'}
        </Typography>
        <Box>
          {payloadType === 'json' && (
            <Button
              size="small"
              startIcon={<FormatIcon />}
              onClick={formatJson}
              sx={{ mr: 1 }}
            >
              Format
            </Button>
          )}
          <Button
            size="small"
            startIcon={<PreviewIcon />}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'} Variables
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={12}
        value={template}
        onChange={(e) => onChange(e.target.value)}
        placeholder={getPlaceholderText()}
        error={!!error}
        helperText={error}
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
            fontSize: '14px',
          },
        }}
      />

      {showPreview && variables.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Variables ({variables.length})
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {variables.map((variable) => (
              <Chip
                key={variable}
                label={`{{${variable}}}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {payloadType === 'json' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Use double curly braces for variables: <code>{`{{variable_name}}`}</code>
        </Alert>
      )}

      {payloadType === 'pdf' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          HTML template will be converted to PDF. Use CSS for styling and <code>{`{{variable_name}}`}</code> for dynamic content.
        </Alert>
      )}

      {payloadType === 'dynamic' && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Dynamic payloads use conditional rules to determine the payload type and template based on the event data.
        </Alert>
      )}
    </Box>
  );
};

export default PayloadEditor;