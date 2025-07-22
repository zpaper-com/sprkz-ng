import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Initialize Sentry
export const initSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || 'https://44ccefc5d4243eeb0b845f4e109db800@o4508654732247040.ingest.us.sentry.io/4509710429061120',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new BrowserTracing({
        // Performance monitoring for PDF operations
        tracingOrigins: ['localhost', /^https:\/\/.*\.zpaper\.com/],
      }) as any,
    ],
  });
};

export default Sentry;