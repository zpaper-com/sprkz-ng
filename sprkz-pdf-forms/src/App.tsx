import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ErrorBoundary } from '@sentry/react';
import { Container, Typography, Box, Button } from '@mui/material';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { FormProvider } from './contexts/FormContext';
import { WizardProvider } from './contexts/WizardContext';
import { PDFFormContainer } from './components/pdf/PDFFormContainer';
import theme from './theme/theme';

// Temporary Sentry validation component (REMOVE after testing)
const SentryTestComponent: React.FC = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const button = document.createElement('button');
      button.innerHTML = 'Test Sentry Error';
      button.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:10px;border:none;border-radius:4px;cursor:pointer;';
      button.onclick = () => { throw new Error("My first Sentry error!"); };
      document.body.appendChild(button);
      
      return () => {
        if (document.body.contains(button)) {
          document.body.removeChild(button);
        }
      };
    }
  }, []);
  return null;
};

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" gutterBottom>
            An error occurred while processing your PDF form.
          </Typography>
          <Box component="details" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
            <Typography component="summary" sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details
            </Typography>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', mt: 1 }}>
              {String(error)}
            </Typography>
          </Box>
          <Button variant="contained" onClick={resetError}>
            Try Again
          </Button>
        </Container>
      )}
      beforeCapture={(scope, error, errorInfo) => {
        scope.setTag('errorBoundary', 'AppErrorBoundary');
        scope.setContext('errorInfo', errorInfo as any);
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FeatureFlagsProvider>
          <FormProvider>
            <WizardProvider>
              <PDFFormContainer />
              <SentryTestComponent />
            </WizardProvider>
          </FormProvider>
        </FeatureFlagsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
