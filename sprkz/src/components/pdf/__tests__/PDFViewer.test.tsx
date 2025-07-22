import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PDFViewer } from '../PDFViewer';
import { pdfService } from '../../../services/pdfService';

// Mock PDF service
jest.mock('../../../services/pdfService');
const mockPDFService = pdfService as jest.Mocked<typeof pdfService>;

// Mock PDF document and page
const mockPDFDocument = {
  numPages: 2,
  getPage: jest.fn(),
};

const mockPage = {
  getViewport: jest.fn().mockReturnValue({
    width: 800,
    height: 600,
  }),
  render: jest.fn().mockResolvedValue(undefined),
  getAnnotations: jest.fn().mockResolvedValue([]),
};

describe('PDFViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPDFService.loadPDF.mockResolvedValue(mockPDFDocument);
    mockPDFService.getPage.mockResolvedValue(mockPage);
    mockPDFService.renderPage.mockResolvedValue({ width: 800, height: 600 });
    mockPDFService.getFormFields.mockResolvedValue([]);
    mockPDFDocument.getPage.mockResolvedValue(mockPage);
  });

  it('should render PDF viewer container', () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });

  it('should load PDF document on mount', async () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    await waitFor(() => {
      expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/test.pdf');
    });
  });

  it('should render canvas for PDF page', async () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-canvas')).toBeInTheDocument();
    });
  });

  it('should render text layer for text selection', async () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-text-layer')).toBeInTheDocument();
    });
  });

  it('should render annotation layer for form fields', async () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    await waitFor(() => {
      expect(screen.getByTestId('pdf-annotation-layer')).toBeInTheDocument();
    });
  });

  it('should handle PDF loading errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockPDFService.loadPDF.mockRejectedValue(new Error('Failed to load PDF'));

    render(<PDFViewer pdfUrl="/invalid.pdf" />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading PDF/)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display loading state while PDF is loading', () => {
    render(<PDFViewer pdfUrl="/pdfs/test.pdf" />);

    expect(screen.getByText(/Loading PDF/)).toBeInTheDocument();
  });

  it('should update when pdfUrl prop changes', async () => {
    const { rerender } = render(<PDFViewer pdfUrl="/pdfs/test1.pdf" />);

    await waitFor(() => {
      expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/test1.pdf');
    });

    mockPDFService.loadPDF.mockClear();

    rerender(<PDFViewer pdfUrl="/pdfs/test2.pdf" />);

    await waitFor(() => {
      expect(mockPDFService.loadPDF).toHaveBeenCalledWith('/pdfs/test2.pdf');
    });
  });
});
