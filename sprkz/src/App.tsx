import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from './config/theme';
import { PDFFormContainer } from './components/pdf/PDFFormContainer';
import MobileInterface from './components/mobile/MobileInterface';
import { redirectToMobileIfNeeded } from './utils/mobileDetection';
import AdminInterface from './admin/AdminInterface';
import { DynamicRoute } from './components/routing/DynamicRoute';

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
            path="/admin/*" 
            element={<AdminInterface />} 
          />
          <Route 
            path="/" 
            element={
              <DynamicRoute>
                <Box
                  data-testid="app-container"
                  sx={{
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                  }}
                >
                  <PDFFormContainer />
                </Box>
              </DynamicRoute>
            } 
          />
          <Route 
            path="*" 
            element={<DynamicRoute />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
