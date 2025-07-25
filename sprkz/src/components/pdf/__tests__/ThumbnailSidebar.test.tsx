import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThumbnailSidebar } from '../ThumbnailSidebar';
import { pdfService } from '../../../services/pdfService';

// Mock PDF service
jest.mock('../../../services/pdfService');
const mockPDFService = pdfService as jest.Mocked<typeof pdfService>;

// Mock PDF document and pages
const mockPDFDocument = {
  numPages: 3,
  getPage: jest.fn(),
};

const createMockPage = (pageNum: number) => ({
  pageNumber: pageNum,
  getViewport: jest.fn().mockReturnValue({
    width: 400,
    height: 300,
  }),
  render: jest.fn().mockResolvedValue(undefined),
});

describe('ThumbnailSidebar', () => {
  const defaultProps = {
    pdfDocument: mockPDFDocument,
    currentPage: 1,
    onPageSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPDFService.getPage.mockImplementation((doc, pageNum) =>
      Promise.resolve(createMockPage(pageNum))
    );
    mockPDFService.renderPage.mockResolvedValue({ width: 100, height: 75 });
  });

  it('should render thumbnail sidebar container', () => {
    render(<ThumbnailSidebar {...defaultProps} />);

    expect(screen.getByTestId('thumbnail-sidebar')).toBeInTheDocument();
  });

  it('should render thumbnail for each page', async () => {
    render(<ThumbnailSidebar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-3')).toBeInTheDocument();
  });

  it('should highlight current page thumbnail', async () => {
    render(<ThumbnailSidebar {...defaultProps} currentPage={2} />);

    await waitFor(() => {
      const currentThumbnail = screen.getByTestId('thumbnail-2');
      expect(currentThumbnail).toHaveClass('selected');
    });
  });

  it('should call onPageSelect when thumbnail is clicked', async () => {
    const onPageSelect = jest.fn();
    render(<ThumbnailSidebar {...defaultProps} onPageSelect={onPageSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('thumbnail-2'));

    expect(onPageSelect).toHaveBeenCalledWith(2);
  });

  it('should display page numbers on thumbnails', async () => {
    render(<ThumbnailSidebar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should handle thumbnail rendering errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockPDFService.renderPage.mockRejectedValue(new Error('Render failed'));

    render(<ThumbnailSidebar {...defaultProps} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should scale thumbnails to fit sidebar width', async () => {
    render(<ThumbnailSidebar {...defaultProps} width={200} />);

    await waitFor(() => {
      const thumbnail = screen.getByTestId('thumbnail-1');
      expect(thumbnail).toBeInTheDocument();
    });

    // Should call renderPage with appropriate scale for 200px width
    expect(mockPDFService.renderPage).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.any(Number) // Scale calculated based on width
    );
  });

  it('should handle empty PDF document', () => {
    const emptyPDFDocument = { numPages: 0, getPage: jest.fn() };

    render(
      <ThumbnailSidebar {...defaultProps} pdfDocument={emptyPDFDocument} />
    );

    expect(screen.getByTestId('thumbnail-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId(/thumbnail-\d+/)).not.toBeInTheDocument();
  });

  describe('Collapse functionality', () => {
    it('should render collapse button', () => {
      render(<ThumbnailSidebar {...defaultProps} />);

      const toggleButton = screen.getByTestId('thumbnail-toggle-button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should start expanded by default', () => {
      render(<ThumbnailSidebar {...defaultProps} />);

      const sidebar = screen.getByTestId('thumbnail-sidebar');
      expect(sidebar).toHaveStyle('width: 150px'); // Default width
    });

    it('should start collapsed when initialCollapsed is true', () => {
      render(<ThumbnailSidebar {...defaultProps} initialCollapsed={true} />);

      const sidebar = screen.getByTestId('thumbnail-sidebar');
      expect(sidebar).toHaveStyle('width: 48px'); // Collapsed width
    });

    it('should toggle collapse state when button is clicked', () => {
      render(<ThumbnailSidebar {...defaultProps} />);

      const toggleButton = screen.getByTestId('thumbnail-toggle-button');
      const sidebar = screen.getByTestId('thumbnail-sidebar');

      // Initially expanded
      expect(sidebar).toHaveStyle('width: 150px');

      // Click to collapse
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveStyle('width: 48px');

      // Click to expand
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveStyle('width: 150px');
    });

    it('should hide thumbnails when collapsed', () => {
      render(<ThumbnailSidebar {...defaultProps} />);

      const toggleButton = screen.getByTestId('thumbnail-toggle-button');

      // Click to collapse
      fireEvent.click(toggleButton);

      // Thumbnails container should be hidden
      const thumbnailsContainer = screen.getByTestId('thumbnail-sidebar').children[1];
      expect(thumbnailsContainer).toHaveStyle('display: none');
    });

    it('should show correct icon based on collapse state', () => {
      render(<ThumbnailSidebar {...defaultProps} />);

      const toggleButton = screen.getByTestId('thumbnail-toggle-button');

      // Initially expanded - should show ChevronLeft
      expect(toggleButton.querySelector('[data-testid="ChevronLeftIcon"]')).toBeInTheDocument();

      // Click to collapse - should show ChevronRight
      fireEvent.click(toggleButton);
      expect(toggleButton.querySelector('[data-testid="ChevronRightIcon"]')).toBeInTheDocument();
    });

    it('should use custom width when specified', () => {
      render(<ThumbnailSidebar {...defaultProps} width={200} />);

      const sidebar = screen.getByTestId('thumbnail-sidebar');
      expect(sidebar).toHaveStyle('width: 200px');
    });

    it('should maintain collapsed width regardless of custom width', () => {
      render(<ThumbnailSidebar {...defaultProps} width={300} initialCollapsed={true} />);

      const sidebar = screen.getByTestId('thumbnail-sidebar');
      expect(sidebar).toHaveStyle('width: 48px'); // Always 48px when collapsed
    });
  });
});
