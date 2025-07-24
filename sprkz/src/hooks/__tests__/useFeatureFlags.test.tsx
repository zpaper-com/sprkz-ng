/**
 * Tests for Feature Flag Hooks
 */

import { FEATURE_FLAGS } from '../../admin/utils/featureFlags';

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/test'
  },
  writable: true
});

// Mock the useAdmin hook to return test data
jest.mock('../../admin/contexts/AdminContext', () => ({
  useAdmin: () => ({
    state: {
      urls: [
        {
          id: 1,
          path: '/test',
          pdfPath: 'test.pdf',
          createdAt: '2024-01-01T00:00:00Z',
          features: {
            1: true,
            2: false,
            3: true,
            4: true,// Features 1,3,4,5,6,8,10,11,13 enabled; others disabled
            5: true,
            6: true,
            7: false,
            8: true,
            9: false,
            10: true,
            11: true,
            12: false,
            13: true,
            14: false
          },
          pdfFields: {}
        }
      ],
      features: [
        {
          id: 1,
          name: 'Fields Toggle Button',
          description: 'Show/hide field names overlay',
          notes: 'Test feature',
          creationDate: '2024-01-01T00:00:00Z'
        }
      ]
    }
  })
}));

describe('Feature Flag Hooks', () => {
  beforeEach(() => {
    window.location.pathname = '/test';
  });

  describe('FEATURE_FLAGS constants', () => {
    it('should have all expected feature flag constants', () => {
      expect(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBe(1);
      expect(FEATURE_FLAGS.PDF_FIT_WIDTH_BUTTON).toBe(2);
      expect(FEATURE_FLAGS.PDF_FIT_HEIGHT_BUTTON).toBe(3);
      expect(FEATURE_FLAGS.WIZARD_BUTTON).toBe(4);
      expect(FEATURE_FLAGS.PDF_TITLE_DISPLAY).toBe(5);
      expect(FEATURE_FLAGS.PDF_FILENAME_DISPLAY).toBe(6);
      expect(FEATURE_FLAGS.THUMBNAIL_NAVIGATION).toBe(7);
      expect(FEATURE_FLAGS.WIZARD_STATUS_INDICATOR).toBe(8);
      expect(FEATURE_FLAGS.MINI_PROGRESS_INDICATOR).toBe(9);
      expect(FEATURE_FLAGS.PROGRESS_TRACKER).toBe(10);
      expect(FEATURE_FLAGS.FIELD_TOOLTIP_SYSTEM).toBe(11);
      expect(FEATURE_FLAGS.SIGNATURE_MODAL).toBe(12);
      expect(FEATURE_FLAGS.FORM_VALIDATION_DISPLAY).toBe(13);
      expect(FEATURE_FLAGS.EXPORT_BUTTON).toBe(14);
    });
  });

  describe('Feature flag system', () => {
    it('should define proper constants', () => {
      expect(typeof FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBe('number');
      expect(FEATURE_FLAGS.FIELDS_TOGGLE_BUTTON).toBeGreaterThan(0);
    });
  });
});