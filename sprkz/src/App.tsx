import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { theme } from './config/theme';
import { PDFFormContainer } from './components/pdf/PDFFormContainer';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        data-testid="app-container"
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <PDFFormContainer />
      </Box>
    </ThemeProvider>
  );
};

export default App;
