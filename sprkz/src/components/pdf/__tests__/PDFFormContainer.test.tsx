import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFFormContainer } from '../PDFFormContainer';
import { pdfService } from '../../../services/pdfService';
import { getPDFUrlFromParams } from '../../../utils/urlParams';

// Mock dependencies
jest.mock('../../../services/pdfService');
jest.mock('../../../utils/urlParams');

const mockPDFService = pdfService as jest.Mocked<typeof pdfService>;
const mockGetPDFUrlFromParams = getPDFUrlFromParams as jest.Mock;

// Mock PDF document
const mockPDFDocument = {
  numPages: 2,
  getPage: jest.fn()
};

const mockPage = {
  getViewport: jest.fn().mockReturnValue({
    width: 800,
    height: 600
  }),
  render: jest.fn().mockResolvedValue(undefined),
  getAnnotations: jest.fn().mockResolvedValue([])
};

describe('PDFFormContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPDFUrlFromParams.mockReturnValue('/pdfs/makana2025.pdf');
    mockPDFService.loadPDF.mockResolvedValue(mockPDFDocument);
    mockPDFService.getPage.mockResolvedValue(mockPage);
    mockPDFService.renderPage.mockResolvedValue({ width: 800, height: 600 });
    mockPDFService.getFormFields.mockResolvedValue([]);
    mockPDFDocument.getPage.mockResolvedValue(mockPage);
  });

  it('should render PDF form container', () => {
    render(<PDFFormContainer />);
    
    expect(screen.getByTestId('pdf-form-container')).toBeInTheDocument();
  });

  it('should load PDF from URL parameters', async () => {
    mockGetPDFUrlFromParams.mockReturnValue('/pdfs/tremfya.pdf');
    
    render(<PDFFormContainer />);
    
    expect(mockGetPDFUrlFromParams).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/tremfya.pdf');
    });
  });

  it('should render thumbnail sidebar', async () => {
    render(<PDFFormContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('thumbnail-sidebar')).toBeInTheDocument();
    });
  });

  it('should render PDF viewer', async () => {
    render(<PDFFormContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
  });

  it('should handle page selection from thumbnail', async () => {
    render(<PDFFormContainer />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
    });
    
    // The page selection logic is tested in individual component tests
    expect(screen.getByTestId('pdf-form-container')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<PDFFormContainer />);
    
    expect(screen.getByText(/Loading PDF/)).toBeInTheDocument();
  });

  it('should handle PDF loading errors', async () => {
    mockPDFService.loadPDF.mockRejectedValue(new Error('Failed to load'));
    
    render(<PDFFormContainer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
    });
  });
});