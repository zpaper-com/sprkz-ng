import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';

import MobilePDFViewer from './MobilePDFViewer';
import MobileFieldNavigator from './MobileFieldNavigator';
import MobileSignature from './MobileSignature';
import { getPDFUrlFromParams } from '../../utils/urlParams';

interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
  fieldValue?: string;
  options?: string[];
  required?: boolean;
  page: number;
}

const MobileFormContainer: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = getPDFUrlFromParams();
    console.log('PDF URL determined:', url);
    setPdfUrl(url);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('PDF loading timeout reached');
        setLoading(false);
        setError('PDF loading timed out. Please refresh the page.');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const handleFieldsDetected = useCallback((detectedFields: any[]) => {
    console.log('Processing detected fields:', detectedFields);
    
    const processedFields: FormField[] = detectedFields.map((field, index) => ({
      id: field.id || `field_${index}`,
      fieldName: field.fieldName || field.alternativeText || `Field ${index + 1}`,
      fieldType: field.fieldType || field.subtype || 'text',
      fieldValue: field.fieldValue || '',
      options: field.options || [],
      required: !field.readOnly && field.required !== false,
      page: field.page || 1,
    }));

    console.log('Processed fields:', processedFields);
    setFields(processedFields);
    setLoading(false);
  }, []);

  // Also handle when PDF loads but no fields are detected
  const handlePDFLoadComplete = useCallback(() => {
    console.log('PDF load completed, setting loading to false');
    setLoading(false);
  }, []);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleFieldComplete = (fieldId: string) => {
    setCompletedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId); // Toggle off if already completed
      } else {
        newSet.add(fieldId); // Add if not completed
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (currentFieldIndex < fields.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      const nextField = fields[currentFieldIndex + 1];
      if (nextField && nextField.page !== currentPage) {
        setCurrentPage(nextField.page);
      }
    }
  };

  const handlePrevious = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
      const prevField = fields[currentFieldIndex - 1];
      if (prevField && prevField.page !== currentPage) {
        setCurrentPage(prevField.page);
      }
    }
  };

  const handleSignatureRequest = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signatureData: string) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, signatureData);
      handleFieldComplete(currentSignatureField);
    }
    setSignatureDialogOpen(false);
    setCurrentSignatureField(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Prepare form data
      const formData = {
        pdfUrl,
        fields: fieldValues,
        completedFields: Array.from(completedFields),
        timestamp: new Date().toISOString(),
      };

      // TODO: Implement actual submission logic
      console.log('Submitting form data:', formData);
      
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Form submitted successfully!');
      
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToDesktop = () => {
    window.location.href = '/';
  };

  const getCompletionProgress = () => {
    if (fields.length === 0) return 0;
    return Math.round((completedFields.size / fields.length) * 100);
  };

  const requiredFieldsCompleted = fields
    .filter(field => field.required)
    .every(field => completedFields.has(field.id));

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
        sx={{ p: 3 }}
      >
        <CircularProgress size={48} />
        <Typography>Loading form...</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ wordBreak: 'break-all' }}>
          Loading PDF from: {pdfUrl || 'Determining URL...'}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center">
          This may take a few moments
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Mobile App Bar */}
      <AppBar position="sticky">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={goToDesktop}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Sprkz Mobile
          </Typography>
          <Typography variant="body2">
            {getCompletionProgress()}%
          </Typography>
        </Toolbar>
        
        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab icon={<DescriptionIcon />} label="PDF" />
          <Tab icon={<EditIcon />} label="Form" />
        </Tabs>
      </AppBar>

      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tab Content */}
      <Box sx={{ pb: 8 }}>
        {activeTab === 0 ? (
          // PDF View Tab
          <Box sx={{ p: 1 }}>
            <MobilePDFViewer
              pdfUrl={pdfUrl}
              onFieldsDetected={handleFieldsDetected}
              onLoadComplete={handlePDFLoadComplete}
              _onPageChange={setCurrentPage}
              currentPage={currentPage}
            />
          </Box>
        ) : (
          // Form Tab
          <Box>
            {fields.length > 0 ? (
              <MobileFieldNavigator
                fields={fields}
                currentFieldIndex={currentFieldIndex}
                onFieldChange={handleFieldChange}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onFieldComplete={handleFieldComplete}
                onSignatureRequest={handleSignatureRequest}
                completedFields={completedFields}
              />
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  No form fields detected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This PDF may not contain interactive form fields.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Submit FAB - only show when form is ready */}
      {fields.length > 0 && completedFields.size > 0 && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            backgroundColor: requiredFieldsCompleted 
              ? theme.palette.success.main 
              : theme.palette.primary.main,
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {requiredFieldsCompleted ? <CheckCircleIcon /> : <SendIcon />}
        </Fab>
      )}

      {/* Signature Dialog */}
      <MobileSignature
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSave={handleSignatureSave}
        fieldName={
          currentSignatureField 
            ? fields.find(f => f.id === currentSignatureField)?.fieldName 
            : 'Signature'
        }
      />
    </Box>
  );
};

export default MobileFormContainer;