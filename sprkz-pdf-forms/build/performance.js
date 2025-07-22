// Performance monitoring and optimization utilities
(function() {
  'use strict';

  // Performance observer for Core Web Vitals
  function observePerformance() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.startTime < performance.now()) {
          window.__SPRKZ_PERFORMANCE__ = window.__SPRKZ_PERFORMANCE__ || {};
          window.__SPRKZ_PERFORMANCE__.lcp = entry.startTime;
          
          // Report to analytics if available
          if (window.gtag) {
            window.gtag('event', 'web_vital_lcp', {
              value: Math.round(entry.startTime),
              custom_parameter_1: 'pdf_forms'
            });
          }
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__SPRKZ_PERFORMANCE__ = window.__SPRKZ_PERFORMANCE__ || {};
        window.__SPRKZ_PERFORMANCE__.fid = entry.processingStart - entry.startTime;
        
        if (window.gtag) {
          window.gtag('event', 'web_vital_fid', {
            value: Math.round(entry.processingStart - entry.startTime),
            custom_parameter_1: 'pdf_forms'
          });
        }
      }
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let cumulativeLayoutShift = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
        }
      }
      
      window.__SPRKZ_PERFORMANCE__ = window.__SPRKZ_PERFORMANCE__ || {};
      window.__SPRKZ_PERFORMANCE__.cls = cumulativeLayoutShift;
      
      if (window.gtag) {
        window.gtag('event', 'web_vital_cls', {
          value: Math.round(cumulativeLayoutShift * 1000),
          custom_parameter_1: 'pdf_forms'
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }

  // Resource loading optimization
  function optimizeResourceLoading() {
    // Preload critical fonts
    const fontPreloads = [
      '/fonts/roboto-v30-latin-300.woff2',
      '/fonts/roboto-v30-latin-regular.woff2',
      '/fonts/roboto-v30-latin-500.woff2'
    ];

    fontPreloads.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });

    // Preconnect to external domains
    const preconnectDomains = [
      'https://api.sprkz.com',
      'https://unleash.sprkz.com',
      'https://sentry.io'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Image loading optimization
  function optimizeImages() {
    // Lazy load images with Intersection Observer
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    });
  }

  // PDF.js worker optimization
  function optimizePDFWorker() {
    // Preload PDF.js worker
    const workerScript = document.createElement('link');
    workerScript.rel = 'preload';
    workerScript.as = 'script';
    workerScript.href = '/static/js/pdf.worker.min.js';
    document.head.appendChild(workerScript);

    // Set up PDF.js worker path
    window.__PDF_WORKER_SRC__ = '/static/js/pdf.worker.min.js';
  }

  // Memory management for large PDFs
  function setupMemoryManagement() {
    let lastPDFCleanup = Date.now();
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

    setInterval(() => {
      if (Date.now() - lastPDFCleanup > CLEANUP_INTERVAL) {
        // Trigger garbage collection hint
        if (window.gc) {
          window.gc();
        }
        
        // Clean up PDF.js resources
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
          // Force cleanup of PDF documents that are no longer referenced
          performance.mark('pdf-cleanup-start');
        }
        
        lastPDFCleanup = Date.now();
      }
    }, 30000); // Check every 30 seconds
  }

  // Performance budget monitoring
  function monitorPerformanceBudget() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        // Performance budget thresholds
        const budgets = {
          loadTime: 3000, // 3 seconds
          domContentLoaded: 1500, // 1.5 seconds
          firstPaint: 1000, // 1 second
          transferSize: 2 * 1024 * 1024 // 2MB
        };

        const metrics = {
          loadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          transferSize: perfData.transferSize
        };

        // Check budgets and report violations
        Object.keys(budgets).forEach(metric => {
          if (metrics[metric] > budgets[metric]) {
            console.warn(`Performance budget exceeded for ${metric}: ${metrics[metric]} > ${budgets[metric]}`);
            
            // Report to monitoring service
            if (window.Sentry) {
              window.Sentry.captureMessage(`Performance budget exceeded: ${metric}`, {
                level: 'warning',
                tags: {
                  performanceIssue: metric,
                  budgetExceeded: true
                },
                extra: {
                  actual: metrics[metric],
                  budget: budgets[metric],
                  ratio: (metrics[metric] / budgets[metric]).toFixed(2)
                }
              });
            }
          }
        });

        // Store metrics for analytics
        window.__SPRKZ_PERFORMANCE__ = {
          ...window.__SPRKZ_PERFORMANCE__,
          ...metrics,
          budgetViolations: Object.keys(budgets).filter(metric => metrics[metric] > budgets[metric])
        };
      }, 1000);
    });
  }

  // Initialize performance optimizations
  function init() {
    if (typeof window !== 'undefined') {
      // Only run in browsers that support the APIs
      if ('PerformanceObserver' in window) {
        observePerformance();
      }
      
      if ('IntersectionObserver' in window) {
        optimizeImages();
      }
      
      optimizeResourceLoading();
      optimizePDFWorker();
      setupMemoryManagement();
      monitorPerformanceBudget();
      
      // Mark performance script as loaded
      window.__SPRKZ_PERFORMANCE_LOADED__ = true;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();