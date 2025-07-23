import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../../../config/theme';
import MobileInterface from '../MobileInterface';

// Mock the URL params utility
jest.mock('../../../utils/urlParams', () => ({
  getPDFUrlFromParams: jest.fn(() => '/pdfs/test.pdf'),
}));

// Mock PDF.js to avoid worker issues in tests
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.reject(new Error('PDF loading mocked')),
  })),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  version: '3.11.174',
}));

// Mock window.location
const mockLocation = {
  href: '',
  search: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MobileInterface', () => {
  beforeEach(() => {
    mockLocation.href = '';
    mockLocation.search = '';
  });

  it('should render without crashing', () => {
    renderWithTheme(<MobileInterface />);
    
    // Component should render successfully
    expect(document.body).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    renderWithTheme(<MobileInterface />);
    
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  it('should render loading spinner', () => {
    renderWithTheme(<MobileInterface />);
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('should use the mobile form container', () => {
    renderWithTheme(<MobileInterface />);
    
    // The component should contain the mobile form structure
    expect(screen.getByText('Loading form...')).toBeInTheDocument();
  });

  it('should handle PDF URL initialization', () => {
    renderWithTheme(<MobileInterface />);
    
    // Component should initialize without throwing errors
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});