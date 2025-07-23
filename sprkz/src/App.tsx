import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from './config/theme';
import { PDFFormContainer } from './components/pdf/PDFFormContainer';
import MobileInterface from './components/mobile/MobileInterface';
import { redirectToMobileIfNeeded } from './utils/mobileDetection';

const App: React.FC = () => {
  useEffect(() => {
    // Check for mobile browser and redirect if needed
    redirectToMobileIfNeeded();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/mobile" 
            element={<MobileInterface />} 
          />
          <Route 
            path="/" 
            element={
              <Box
                data-testid="app-container"
                sx={{
                  minHeight: '100vh',
                  backgroundColor: 'background.default',
                }}
              >
                <PDFFormContainer />
              </Box>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
