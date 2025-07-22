import { getPDFUrlFromParams } from '../urlParams';

// Mock window.location
const mockLocation = (search: string) => {
  delete (window as any).location;
  (window as any).location = { search };
};

describe('getPDFUrlFromParams', () => {
  const originalLocation = window.location;

  afterEach(() => {
    window.location = originalLocation;
  });

  it('should return default PDF when no parameters are provided', () => {
    mockLocation('');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/makana2025.pdf');
  });

  it('should return PDF URL from "f" parameter', () => {
    mockLocation('?f=tremfya.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/tremfya.pdf');
  });

  it('should return PDF URL from "file" parameter', () => {
    mockLocation('?file=tremfya.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/tremfya.pdf');
  });

  it('should return PDF URL from "pdf" parameter', () => {
    mockLocation('?pdf=tremfya.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/tremfya.pdf');
  });

  it('should prioritize "f" parameter over others', () => {
    mockLocation('?f=test1.pdf&file=test2.pdf&pdf=test3.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/test1.pdf');
  });

  it('should handle full URLs by extracting filename', () => {
    mockLocation('?f=https://example.com/docs/report.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/report.pdf');
  });

  it('should handle URLs with paths', () => {
    mockLocation('?f=/documents/annual-report.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/annual-report.pdf');
  });

  it('should preserve filenames with special characters', () => {
    mockLocation('?f=form_2024-Q1.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/form_2024-Q1.pdf');
  });

  it('should handle encoded URLs', () => {
    mockLocation('?f=my%20form.pdf');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/my form.pdf');
  });

  it('should return default PDF for invalid parameters', () => {
    mockLocation('?f=');
    
    const result = getPDFUrlFromParams();
    
    expect(result).toBe('/pdfs/makana2025.pdf');
  });

  it('should allow custom default PDF', () => {
    mockLocation('');
    
    const result = getPDFUrlFromParams('/pdfs/custom-default.pdf');
    
    expect(result).toBe('/pdfs/custom-default.pdf');
  });
});