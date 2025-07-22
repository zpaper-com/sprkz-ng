/**
 * Extract PDF URL from URL parameters
 * Supports ?f=, ?file=, and ?pdf= parameters
 */
export const getPDFUrlFromParams = (defaultPdf: string = '/pdfs/makana2025.pdf'): string => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for parameters in priority order
  const pdfParam = urlParams.get('f') || 
                  urlParams.get('file') || 
                  urlParams.get('pdf');
  
  if (!pdfParam || pdfParam.trim() === '') {
    return defaultPdf;
  }
  
  // Decode URL if needed
  const decodedParam = decodeURIComponent(pdfParam.trim());
  
  // Extract filename if it's a full URL
  let filename = decodedParam;
  if (decodedParam.includes('://') || decodedParam.startsWith('/')) {
    const parts = decodedParam.split('/');
    filename = parts[parts.length - 1];
  }
  
  // Ensure filename has .pdf extension (if not already)
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }
  
  // Return path to pdfs directory
  return `/pdfs/${filename}`;
};

/**
 * Update URL parameter for PDF file
 */
export const updatePDFUrlParam = (pdfFilename: string): void => {
  const url = new URL(window.location.href);
  
  // Remove path prefix if present
  const filename = pdfFilename.replace('/pdfs/', '').replace('.pdf', '');
  
  url.searchParams.set('f', filename + '.pdf');
  
  // Update URL without page reload
  window.history.replaceState(null, '', url.toString());
};

/**
 * Get list of available PDF files (for development/testing)
 */
export const getAvailablePDFs = (): string[] => {
  return [
    'makana2025.pdf',
    'tremfya.pdf'
  ];
};

/**
 * Validate if PDF filename is in allowed list (security)
 */
export const isValidPDFFilename = (filename: string): boolean => {
  const allowedPDFs = getAvailablePDFs();
  const cleanFilename = filename.replace('/pdfs/', '');
  
  return allowedPDFs.includes(cleanFilename);
};