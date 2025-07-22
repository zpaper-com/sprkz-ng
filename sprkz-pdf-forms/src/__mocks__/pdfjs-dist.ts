// Mock implementation of pdfjs-dist for testing
export const GlobalWorkerOptions = {
  workerSrc: ''
};

export const getDocument = jest.fn().mockImplementation(() => ({
  promise: Promise.resolve({
    numPages: 1,
    fingerprints: ['mock-fingerprint'],
    getPage: jest.fn().mockImplementation(() => Promise.resolve({
      pageNumber: 1,
      getViewport: jest.fn().mockReturnValue({
        width: 800,
        height: 600,
        scale: 1
      }),
      render: jest.fn().mockReturnValue({
        promise: Promise.resolve()
      }),
      getTextContent: jest.fn().mockResolvedValue({
        items: []
      }),
      getAnnotations: jest.fn().mockResolvedValue([])
    }))
  })
}));

export const TextLayer = jest.fn();
export const AnnotationLayer = jest.fn();