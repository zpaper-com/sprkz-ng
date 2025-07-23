import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldValue?: string;
  options?: string[];
  required?: boolean;
  page: number;
}

interface MobileFieldNavigatorProps {
  fields: FormField[];
  currentFieldIndex: number;
  onFieldChange: (fieldId: string, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFieldComplete: (fieldId: string) => void;
  onSignatureRequest?: (fieldId: string) => void;
  completedFields: Set<string>;
}

const MobileFieldNavigator: React.FC<MobileFieldNavigatorProps> = ({
  fields,
  currentFieldIndex,
  onFieldChange,
  onNext,
  onPrevious,
  onFieldComplete,
  onSignatureRequest,
  completedFields,
}) => {
  const theme = useTheme();
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const currentField = fields[currentFieldIndex];
  const isFirst = currentFieldIndex === 0;
  const isLast = currentFieldIndex === fields.length - 1;
  const isCompleted = currentField ? completedFields.has(currentField.id) : false;

  if (!currentField) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Typography variant="h6" align="center">
            No fields to fill
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleValueChange = (value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [currentField.id]: value,
    }));
    onFieldChange(currentField.id, value);
  };

  const handleMarkComplete = () => {
    const value = fieldValues[currentField.id] || '';
    if (value.trim()) {
      onFieldComplete(currentField.id);
      if (!isLast) {
        setTimeout(onNext, 300); // Auto-advance after marking complete
      }
    }
  };

  const renderFieldInput = () => {
    const value = fieldValues[currentField.id] || currentField.fieldValue || '';

    switch (currentField.fieldType) {
      case 'text':
      case 'Tx':
        return (
          <TextField
            fullWidth
            label={currentField.fieldName}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            variant="outlined"
            multiline={value.length > 50}
            rows={value.length > 50 ? 3 : 1}
            required={currentField.required}
            sx={{ mb: 2 }}
          />
        );

      case 'checkbox':
      case 'Btn':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value === 'true' || value === 'Yes'}
                onChange={(e) => handleValueChange(e.target.checked ? 'true' : 'false')}
              />
            }
            label={currentField.fieldName}
            sx={{ mb: 2 }}
          />
        );

      case 'radio':
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {currentField.fieldName}
            </Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
            >
              {currentField.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'select':
      case 'Ch':
        return (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{currentField.fieldName}</InputLabel>
            <Select
              value={value}
              label={currentField.fieldName}
              onChange={(e) => handleValueChange(e.target.value)}
            >
              {currentField.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'signature':
      case 'Sig':
        return (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {currentField.fieldName}
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (onSignatureRequest) {
                  onSignatureRequest(currentField.id);
                } else {
                  handleValueChange('signature_placeholder');
                }
              }}
              sx={{ height: 60 }}
            >
              {value ? 'Update Signature' : 'Add Signature'}
            </Button>
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            label={currentField.fieldName}
            value={value}
            onChange={(e) => handleValueChange(e.target.value)}
            variant="outlined"
            required={currentField.required}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const getFieldProgress = () => {
    const completed = fields.filter(field => completedFields.has(field.id)).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Progress Indicator */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Field {currentFieldIndex + 1} of {fields.length}
          </Typography>
          <Chip
            label={`${getFieldProgress()}% Complete`}
            color="primary"
            size="small"
          />
        </Stack>
      </Box>

      {/* Current Field Card */}
      <Card
        sx={{
          mb: 2,
          border: isCompleted ? `2px solid ${theme.palette.success.main}` : undefined,
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {currentField.fieldName}
            </Typography>
            {isCompleted && (
              <CheckCircleIcon color="success" />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Page {currentField.page}
            {currentField.required && (
              <Chip label="Required" size="small" color="secondary" sx={{ ml: 1 }} />
            )}
          </Typography>

          {renderFieldInput()}

          {/* Field Actions */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {fieldValues[currentField.id] && !isCompleted && (
              <Button
                variant="contained"
                color="success"
                onClick={handleMarkComplete}
                sx={{ flexGrow: 1 }}
              >
                Mark Complete
              </Button>
            )}
            {isCompleted && (
              <Button
                variant="outlined"
                onClick={() => onFieldComplete(currentField.id)} // Toggle completion
                sx={{ flexGrow: 1 }}
              >
                Modify
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<NavigateBeforeIcon />}
          onClick={onPrevious}
          disabled={isFirst}
          sx={{ flex: 1 }}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          endIcon={<NavigateNextIcon />}
          onClick={onNext}
          disabled={isLast}
          sx={{ flex: 1 }}
        >
          {isLast ? 'Review' : 'Next'}
        </Button>
      </Stack>
    </Box>
  );
};

export default MobileFieldNavigator;