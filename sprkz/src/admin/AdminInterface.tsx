import React, { useState } from 'react';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  AppBar,
  Toolbar,
  Switch,
  FormControlLabel,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { AdminProvider } from './contexts/AdminContext';
import FeatureManagement from './components/FeatureManagement/FeatureManagement';
import URLConfiguration from './components/URLConfiguration/URLConfiguration';
import PDFManagement from './components/PDFManagement/PDFManagement';
import LayoutManagement from './components/LayoutManagement/LayoutManagement';
import WebhookManagement from './components/WebhookManagement/WebhookManagement';
import AutomationManagement from './components/AutomationManagement/AutomationManagement';
import EventManagement from './components/EventManagement/EventManagement';
import { useTheme } from './hooks/useTheme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminInterface: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { isDarkMode, toggleTheme } = useTheme();

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AdminProvider>
        <Box
          sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        >
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Sprkz Admin Interface
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    color="default"
                  />
                }
                label="Dark Mode"
              />
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="admin tabs"
              >
                <Tab label="URL Configuration" {...a11yProps(0)} />
                <Tab label="PDF Management" {...a11yProps(1)} />
                <Tab label="Features" {...a11yProps(2)} />
                <Tab label="Layouts" {...a11yProps(3)} />
                <Tab label="Webhooks" {...a11yProps(4)} />
                <Tab label="Automations" {...a11yProps(5)} />
                <Tab label="Events" {...a11yProps(6)} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <URLConfiguration />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <PDFManagement />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <FeatureManagement />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <LayoutManagement />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <WebhookManagement />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
              <AutomationManagement />
            </TabPanel>
            <TabPanel value={tabValue} index={6}>
              <EventManagement />
            </TabPanel>
          </Container>
        </Box>
      </AdminProvider>
    </ThemeProvider>
  );
};

export default AdminInterface;
