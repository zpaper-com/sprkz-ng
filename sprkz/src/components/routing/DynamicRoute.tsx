import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Typography,
} from '@mui/material';
import { PDFFormContainer } from '../pdf/PDFFormContainer';
import { dynamicRoutingService, URLConfig } from '../../utils/dynamicRouting';
import { isMobileBrowser } from '../../utils/mobileDetection';

interface DynamicRouteProps {
  children?: React.ReactNode;
}

export const DynamicRoute: React.FC<DynamicRouteProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlConfig, setUrlConfig] = useState<URLConfig | null>(null);
  const [pdfError, setPdfError] = useState<boolean>(false);

  // Check if PDF exists by attempting to fetch it
  const checkPDFExists = async (pdfPath: string): Promise<boolean> => {
    try {
      const response = await fetch(pdfPath, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadAndCheckRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ensure URL configurations are loaded
        await dynamicRoutingService.loadURLConfigs();

        const currentPath = location.pathname;

        // Check if current path matches a dynamic route
        const config = dynamicRoutingService.findURLConfig(currentPath);

        if (config) {
          // Check if the associated PDF exists
          const pdfPath = dynamicRoutingService.getPDFPath(currentPath);
          const pdfExists = await checkPDFExists(pdfPath);

          if (pdfExists) {
            setUrlConfig(config);
            setPdfError(false);
            console.log(
              `Dynamic route matched: ${currentPath} → ${config.pdfPath || 'default PDF'}`
            );
          } else {
            setError(`PDF file not found: ${config.pdfPath || 'default PDF'}`);
            setPdfError(true);
          }
        } else {
          // Path not found in dynamic routes
          setUrlConfig(null);

          // Only show error for non-reserved paths
          const reservedPaths = ['/mobile', '/admin', '/', '/health'];
          const isReservedPath = reservedPaths.some(
            (path) => currentPath === path || currentPath.startsWith(path + '/')
          );

          if (!isReservedPath) {
            setError(`Route not found: ${currentPath}`);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic routes:', err);
        setError('Failed to load route configurations');
      } finally {
        setLoading(false);
      }
    };

    loadAndCheckRoute();
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} maxWidth={600} mx="auto" mt={4}>
        <Alert severity={pdfError ? 'warning' : 'error'} sx={{ mb: 2 }}>
          {error}
        </Alert>

        {pdfError && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              The route exists but the associated PDF file could not be found.
              This might be a temporary issue or the PDF may have been moved or
              deleted.
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
              <Button variant="text" onClick={() => navigate('/')}>
                Go to Home
              </Button>
            </Box>
          </Box>
        )}

        {!pdfError && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              The requested route was not found. Available routes are configured
              in the admin interface.
            </Typography>
            <Button variant="text" onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  if (urlConfig) {
    // Detect device type and get appropriate features
    const isMobile = isMobileBrowser();
    const features = dynamicRoutingService.getFeatures(location.pathname, isMobile);
    const layoutId = dynamicRoutingService.getLayoutId(location.pathname, isMobile);
    
    // Render PDF form with the configured PDF and settings
    return (
      <Box
        data-testid="dynamic-route-container"
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <PDFFormContainer
          dynamicConfig={{
            pdfPath: dynamicRoutingService.getPDFPath(location.pathname),
            features,
            pdfFields: urlConfig.pdfFields,
            layoutId,
            deviceType: isMobile ? 'mobile' : 'desktop',
          }}
        />
      </Box>
    );
  }

  // Render children for non-dynamic routes (fallback)
  return <>{children}</>;
};

export default DynamicRoute;
