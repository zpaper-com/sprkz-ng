import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import type { SignatureData } from '../components/signature/SignatureModal';
import type { FormField } from '../types/pdf';

export interface SignatureEmbedOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface SignatureProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  trimWhitespace?: boolean;
}

export class SignatureService {
  /**
   * Convert signature data URL to image bytes
   */
  static async dataURLToBytes(dataURL: string): Promise<Uint8Array> {
    // Remove data URL prefix (data:image/png;base64,)
    const base64Data = dataURL.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL format');
    }

    // Convert base64 to binary
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  }

  /**
   * Process signature data to optimize for PDF embedding
   */
  static async processSignatureData(
    signatureData: SignatureData,
    options: SignatureProcessingOptions = {}
  ): Promise<SignatureData> {
    const {
      maxWidth = 300,
      maxHeight = 100,
      quality = 0.9,
      trimWhitespace = true
    } = options;

    try {
      // Create a temporary canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Load the image
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load signature image'));
        img.src = signatureData.data;
      });

      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Trim whitespace if requested
      if (trimWhitespace && signatureData.type === 'canvas') {
        const trimmedCanvas = this.trimCanvasWhitespace(canvas);
        if (trimmedCanvas) {
          canvas.width = trimmedCanvas.width;
          canvas.height = trimmedCanvas.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(trimmedCanvas, 0, 0);
        }
      }

      // Generate optimized data URL
      const optimizedDataURL = canvas.toDataURL('image/png', quality);

      return {
        ...signatureData,
        data: optimizedDataURL,
        metadata: {
          ...signatureData.metadata,
          width: canvas.width,
          height: canvas.height,
          optimized: true,
          originalWidth: img.width,
          originalHeight: img.height
        }
      };

    } catch (error) {
      console.warn('Failed to process signature data, using original:', error);
      return signatureData;
    }
  }

  /**
   * Trim whitespace from canvas signature
   */
  private static trimCanvasWhitespace(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Find the bounds of non-white pixels
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];

        // Check if pixel is not white/transparent
        if (a > 0 && (r < 250 || g < 250 || b < 250)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // If no content found, return null
    if (minX >= maxX || minY >= maxY) {
      return null;
    }

    // Add small padding
    const padding = 5;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);

    // Create trimmed canvas
    const trimmedCanvas = document.createElement('canvas');
    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (!trimmedCtx) return null;

    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;

    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;

    // Fill with white background
    trimmedCtx.fillStyle = 'white';
    trimmedCtx.fillRect(0, 0, trimmedWidth, trimmedHeight);

    // Copy trimmed content
    trimmedCtx.drawImage(
      canvas,
      minX, minY, trimmedWidth, trimmedHeight,
      0, 0, trimmedWidth, trimmedHeight
    );

    return trimmedCanvas;
  }

  /**
   * Embed signature into PDF document
   */
  static async embedSignatureInPDF(
    pdfBytes: Uint8Array,
    signatureData: SignatureData,
    embedOptions: SignatureEmbedOptions
  ): Promise<Uint8Array> {
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      if (embedOptions.page < 1 || embedOptions.page > pages.length) {
        throw new Error(`Invalid page number: ${embedOptions.page}`);
      }

      const page = pages[embedOptions.page - 1];

      // Process signature data
      const processedSignature = await this.processSignatureData(signatureData, {
        maxWidth: embedOptions.width,
        maxHeight: embedOptions.height
      });

      // Convert signature to bytes
      const signatureBytes = await this.dataURLToBytes(processedSignature.data);

      // Embed image in PDF
      const signatureImage = await pdfDoc.embedPng(signatureBytes);

      // Calculate scaled dimensions to maintain aspect ratio
      const signatureDims = signatureImage.scale(1);
      const scaleX = embedOptions.width / signatureDims.width;
      const scaleY = embedOptions.height / signatureDims.height;
      const scale = Math.min(scaleX, scaleY);

      const scaledWidth = signatureDims.width * scale;
      const scaledHeight = signatureDims.height * scale;

      // Center the signature in the field area
      const offsetX = (embedOptions.width - scaledWidth) / 2;
      const offsetY = (embedOptions.height - scaledHeight) / 2;

      // Draw signature on page
      page.drawImage(signatureImage, {
        x: embedOptions.x + offsetX,
        y: embedOptions.y + offsetY,
        width: scaledWidth,
        height: scaledHeight
      });

      // Save and return modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      return modifiedPdfBytes;

    } catch (error) {
      console.error('Failed to embed signature in PDF:', error);
      throw new Error(`Signature embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate signature data
   */
  static validateSignatureData(signatureData: SignatureData): string[] {
    const errors: string[] = [];

    if (!signatureData.data) {
      errors.push('Signature data is missing');
    } else if (!signatureData.data.startsWith('data:image/')) {
      errors.push('Invalid signature data format');
    }

    if (!signatureData.type || !['canvas', 'typed'].includes(signatureData.type)) {
      errors.push('Invalid signature type');
    }

    if (!signatureData.metadata) {
      errors.push('Signature metadata is missing');
    } else {
      if (signatureData.metadata.width <= 0 || signatureData.metadata.height <= 0) {
        errors.push('Invalid signature dimensions');
      }

      if (signatureData.type === 'typed') {
        if (!signatureData.metadata.text?.trim()) {
          errors.push('Typed signature text is required');
        }
        if (!signatureData.metadata.font) {
          errors.push('Signature font is required');
        }
      }
    }

    return errors;
  }

  /**
   * Get signature field dimensions from form field
   */
  static getSignatureFieldDimensions(field: FormField): SignatureEmbedOptions {
    // PDF coordinates are bottom-left origin, convert to top-left for consistency
    return {
      x: field.rect[0],
      y: field.rect[1],
      width: field.rect[2] - field.rect[0],
      height: field.rect[3] - field.rect[1],
      page: field.page
    };
  }

  /**
   * Create a preview of signature embedded in field
   */
  static async createSignaturePreview(
    signatureData: SignatureData,
    fieldDimensions: SignatureEmbedOptions
  ): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas to field dimensions
      canvas.width = fieldDimensions.width;
      canvas.height = fieldDimensions.height;

      // Fill with light background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Load and draw signature
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load signature'));
        img.src = signatureData.data;
      });

      // Calculate scaling to fit within field
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      const scale = Math.min(scaleX, scaleY) * 0.8; // 80% to leave some margin

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the signature
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      return canvas.toDataURL('image/png');

    } catch (error) {
      console.error('Failed to create signature preview:', error);
      throw error;
    }
  }

  /**
   * Get optimal signature dimensions for field
   */
  static getOptimalSignatureDimensions(field: FormField): { width: number; height: number } {
    const fieldWidth = field.rect[2] - field.rect[0];
    const fieldHeight = field.rect[3] - field.rect[1];

    // Standard signature aspect ratios
    const aspectRatio = 3; // Width:Height ratio for signatures
    
    let optimalWidth = Math.min(fieldWidth, 300); // Max 300px wide
    let optimalHeight = Math.min(fieldHeight, 100); // Max 100px high

    // Adjust to maintain aspect ratio
    if (optimalWidth / optimalHeight > aspectRatio) {
      optimalWidth = optimalHeight * aspectRatio;
    } else {
      optimalHeight = optimalWidth / aspectRatio;
    }

    return {
      width: Math.max(optimalWidth, 150), // Minimum 150px wide
      height: Math.max(optimalHeight, 50)  // Minimum 50px high
    };
  }
}