import * as Sentry from '@sentry/react';
import { FormSubmissionData, GeneratedPDFResult } from './pdfGenerationService';

export interface SubmissionConfig {
  endpoint: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface SubmissionPayload {
  formData: Record<string, any>;
  pdfUrl?: string;
  timestamp: string;
  completedPdf?: string; // Base64 encoded PDF
  metadata?: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
    sessionId?: string;
    formVersion?: string;
  };
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  message?: string;
  errors: string[];
  warnings: string[];
  responseData?: any;
  submittedAt: number;
  duration: number;
}

export interface SubmissionProgress {
  stage: 'validating' | 'generating_pdf' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: string;
}

export type SubmissionProgressCallback = (progress: SubmissionProgress) => void;

export class SubmissionService {
  private static readonly DEFAULT_CONFIG: SubmissionConfig = {
    endpoint: process.env.REACT_APP_SUBMISSION_ENDPOINT || '/api/forms/submit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  };

  private static submissionCount = 0;
  private static lastSubmissionTime = 0;

  /**
   * Submit form data with optional PDF generation
   */
  static async submitForm(
    submissionData: FormSubmissionData,
    generatedPdf?: GeneratedPDFResult,
    config: Partial<SubmissionConfig> = {},
    progressCallback?: SubmissionProgressCallback
  ): Promise<SubmissionResult> {
    const startTime = performance.now();
    const submissionConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    try {
      // Increment submission counter
      this.submissionCount++;
      this.lastSubmissionTime = Date.now();

      // Report progress - Validation
      progressCallback?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating form data...',
        details: 'Checking form completeness and data integrity'
      });

      // Validate submission data
      const validationErrors = this.validateSubmissionData(submissionData);
      if (validationErrors.length > 0) {
        progressCallback?.({
          stage: 'error',
          progress: 0,
          message: 'Validation failed',
          details: validationErrors.join(', ')
        });

        return {
          success: false,
          errors: validationErrors,
          warnings: [],
          submittedAt: Date.now(),
          duration: performance.now() - startTime
        };
      }

      // Report progress - PDF Generation
      if (generatedPdf) {
        progressCallback?.({
          stage: 'generating_pdf',
          progress: 30,
          message: 'Preparing PDF for submission...',
          details: `PDF size: ${(generatedPdf.pdfBytes.length / 1024 / 1024).toFixed(2)} MB`
        });
      }

      // Create submission payload
      const payload = this.createSubmissionPayload(submissionData, generatedPdf);

      // Report progress - Upload
      progressCallback?.({
        stage: 'uploading',
        progress: 50,
        message: 'Uploading form data...',
        details: `Sending to ${submissionConfig.endpoint}`
      });

      // Submit with retry logic
      const result = await this.submitWithRetry(payload, submissionConfig, progressCallback);

      const duration = performance.now() - startTime;

      // Report success
      if (result.success) {
        progressCallback?.({
          stage: 'complete',
          progress: 100,
          message: 'Form submitted successfully!',
          details: result.submissionId ? `Submission ID: ${result.submissionId}` : undefined
        });

        // Track successful submissions
        this.trackSubmissionMetrics(duration, payload);
      } else {
        progressCallback?.({
          stage: 'error',
          progress: 0,
          message: 'Submission failed',
          details: result.errors.join(', ')
        });
      }

      return {
        ...result,
        submittedAt: Date.now(),
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      console.error('Form submission failed:', error);

      progressCallback?.({
        stage: 'error',
        progress: 0,
        message: 'Submission failed due to an unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });

      // Report error to Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'SubmissionService',
          operation: 'submitForm'
        },
        contexts: {
          submission: {
            endpoint: submissionConfig.endpoint,
            fieldsCount: Object.keys(submissionData.formData).length,
            signaturesCount: Object.keys(submissionData.signatures).length,
            hasPdf: !!generatedPdf
          }
        }
      });

      return {
        success: false,
        errors: [`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        submittedAt: Date.now(),
        duration
      };
    }
  }

  /**
   * Submit with retry logic
   */
  private static async submitWithRetry(
    payload: SubmissionPayload,
    config: SubmissionConfig,
    progressCallback?: SubmissionProgressCallback
  ): Promise<SubmissionResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.retryAttempts!; attempt++) {
      try {
        const result = await this.performSubmission(payload, config);
        
        if (result.success) {
          return result;
        }

        // If not successful but no exception, return the result
        if (attempt === config.retryAttempts) {
          return result;
        }

        // Log retry attempt
        console.warn(`Submission attempt ${attempt} failed, retrying...`, result.errors);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === config.retryAttempts) {
          throw lastError;
        }

        console.warn(`Submission attempt ${attempt} failed with error, retrying...`, error);
      }

      // Wait before retry
      if (attempt < config.retryAttempts!) {
        progressCallback?.({
          stage: 'uploading',
          progress: 50 + (attempt * 10),
          message: `Retrying submission (attempt ${attempt + 1}/${config.retryAttempts})...`,
          details: lastError?.message || 'Previous attempt failed'
        });

        await new Promise(resolve => setTimeout(resolve, config.retryDelay! * attempt));
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Perform the actual HTTP submission
   */
  private static async performSubmission(
    payload: SubmissionPayload,
    config: SubmissionConfig
  ): Promise<SubmissionResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: config.headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await this.parseResponse(response);

      if (response.ok) {
        return {
          success: true,
          submissionId: responseData.id || responseData.submissionId || this.generateSubmissionId(),
          message: responseData.message || 'Form submitted successfully',
          errors: [],
          warnings: responseData.warnings || [],
          responseData,
          submittedAt: Date.now(),
          duration: 0 // Will be set by caller
        };
      } else {
        return {
          success: false,
          message: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
          errors: responseData.errors || [`HTTP ${response.status}: ${response.statusText}`],
          warnings: responseData.warnings || [],
          responseData,
          submittedAt: Date.now(),
          duration: 0
        };
      }

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Parse response handling different content types
   */
  private static async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else if (contentType?.includes('text/')) {
        const text = await response.text();
        return { message: text };
      } else {
        return { message: `Response received with status ${response.status}` };
      }
    } catch (parseError) {
      console.warn('Failed to parse response:', parseError);
      return { message: `Response received but could not be parsed (${response.status})` };
    }
  }

  /**
   * Validate submission data
   */
  private static validateSubmissionData(submissionData: FormSubmissionData): string[] {
    const errors: string[] = [];

    if (!submissionData) {
      errors.push('Submission data is missing');
      return errors;
    }

    if (!submissionData.formData || typeof submissionData.formData !== 'object') {
      errors.push('Form data is missing or invalid');
    }

    if (!submissionData.metadata || typeof submissionData.metadata !== 'object') {
      errors.push('Form metadata is missing or invalid');
    } else {
      if (!submissionData.metadata.completedAt || !submissionData.metadata.totalFields) {
        errors.push('Form metadata is incomplete');
      }
    }

    // Validate signatures if present
    if (submissionData.signatures) {
      Object.entries(submissionData.signatures).forEach(([fieldName, signature]) => {
        if (!signature.type || !signature.data) {
          errors.push(`Invalid signature data for field "${fieldName}"`);
        }
      });
    }

    return errors;
  }

  /**
   * Create submission payload
   */
  private static createSubmissionPayload(
    submissionData: FormSubmissionData,
    generatedPdf?: GeneratedPDFResult
  ): SubmissionPayload {
    const payload: SubmissionPayload = {
      formData: submissionData.formData,
      timestamp: new Date().toISOString(),
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        sessionId: this.getSessionId(),
        formVersion: process.env.REACT_APP_VERSION || '1.0.0'
      }
    };

    // Add PDF if available
    if (generatedPdf?.success && generatedPdf.pdfBytes.length > 0) {
      payload.completedPdf = this.arrayBufferToBase64(generatedPdf.pdfBytes);
    }

    // Add original PDF URL if available
    const pdfUrl = process.env.REACT_APP_PDF_URL;
    if (pdfUrl) {
      payload.pdfUrl = pdfUrl;
    }

    return payload;
  }

  /**
   * Convert Uint8Array to base64 string
   */
  private static arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get or create session ID
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('sprkz-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sprkz-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Generate unique submission ID
   */
  private static generateSubmissionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track submission metrics
   */
  private static trackSubmissionMetrics(duration: number, payload: SubmissionPayload): void {
    const metrics = {
      duration,
      fieldsCount: Object.keys(payload.formData).length,
      payloadSize: JSON.stringify(payload).length,
      hasPdf: !!payload.completedPdf,
      timestamp: Date.now()
    };

    // Log metrics for monitoring
    console.log('Submission metrics:', metrics);

    // Add breadcrumb for Sentry
    Sentry.addBreadcrumb({
      message: 'Form submitted successfully',
      data: metrics,
      level: 'info'
    });

    // Store metrics in local storage for analytics
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('sprkz-submission-metrics') || '[]');
      existingMetrics.push(metrics);
      
      // Keep only last 10 submissions
      if (existingMetrics.length > 10) {
        existingMetrics.splice(0, existingMetrics.length - 10);
      }
      
      localStorage.setItem('sprkz-submission-metrics', JSON.stringify(existingMetrics));
    } catch (storageError) {
      console.warn('Failed to store submission metrics:', storageError);
    }
  }

  /**
   * Get submission configuration
   */
  static getSubmissionConfig(): SubmissionConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Update submission configuration
   */
  static updateSubmissionConfig(updates: Partial<SubmissionConfig>): void {
    Object.assign(this.DEFAULT_CONFIG, updates);
  }

  /**
   * Get submission statistics
   */
  static getSubmissionStats(): {
    totalSubmissions: number;
    lastSubmissionTime: number;
    averageSubmissionTime: number;
  } {
    try {
      const metrics = JSON.parse(localStorage.getItem('sprkz-submission-metrics') || '[]');
      const averageTime = metrics.length > 0 
        ? metrics.reduce((sum: number, m: any) => sum + (m.duration || 0), 0) / metrics.length 
        : 0;

      return {
        totalSubmissions: this.submissionCount,
        lastSubmissionTime: this.lastSubmissionTime,
        averageSubmissionTime: Math.round(averageTime)
      };
    } catch (error) {
      console.warn('Failed to get submission stats:', error);
      return {
        totalSubmissions: this.submissionCount,
        lastSubmissionTime: this.lastSubmissionTime,
        averageSubmissionTime: 0
      };
    }
  }

  /**
   * Test submission endpoint connectivity
   */
  static async testConnection(endpoint?: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const testEndpoint = endpoint || this.DEFAULT_CONFIG.endpoint;
    const startTime = performance.now();

    try {
      const response = await fetch(testEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return {
        success: response.ok,
        responseTime: performance.now() - startTime,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      return {
        success: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}