import { createTheme } from '@mui/material/styles';
import { theme } from '../theme';

describe('Material-UI Theme Configuration', () => {
  test('should create a valid Material-UI theme', () => {
    expect(theme).toBeDefined();
    expect(theme.palette).toBeDefined();
    expect(theme.typography).toBeDefined();
  });

  test('should have primary color configured', () => {
    expect(theme.palette.primary.main).toBeDefined();
  });

  test('should have secondary color configured', () => {
    expect(theme.palette.secondary.main).toBeDefined();
  });

  test('should have consistent typography', () => {
    expect(theme.typography.fontFamily).toBeDefined();
  });

  test('should be a valid MUI theme object', () => {
    // Should not throw when creating theme
    expect(() => createTheme(theme)).not.toThrow();
  });
});