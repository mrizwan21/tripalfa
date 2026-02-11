/**
 * PDF Generator Service
 * Handles HTML to PDF conversion using Puppeteer
 */

import puppeteer, { Browser, Page, PDFOptions as PuppeteerPDFOptions } from 'puppeteer';
import { PDFOptions } from '../models/types';

// PDF Generation error class
class PDFGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFGenerationError';
  }
}

/**
 * PDF generation service using headless Chrome (Puppeteer)
 */
export class PDFGenerator {
  private browser: Browser | null = null;
  private readonly timeoutMs: number;
  private readonly maxConcurrent: number;
  private activeOperations: number = 0;

  constructor(
    timeoutMs: number = 30000,
    maxConcurrent: number = 5,
  ) {
    this.timeoutMs = timeoutMs;
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--single-process=false',
          ],
        });
        console.log('[PDFGenerator] Browser initialized');
      }
    } catch (error) {
      throw new PDFGenerationError(`Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Close the browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        console.log('[PDFGenerator] Browser closed');
      } catch (error) {
        console.error('[PDFGenerator] Error closing browser:', error);
      }
    }
  }

  /**
   * Wait for concurrent operations limit
   */
  private async waitForSlot(): Promise<void> {
    while (this.activeOperations >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Generate PDF from HTML content
   * @param htmlContent HTML content to convert to PDF
   * @param options PDF generation options
   * @returns Buffer containing PDF data
   */
  async generatePDF(htmlContent: string, options: PDFOptions = {}): Promise<Buffer> {
    // Ensure browser is initialized
    if (!this.browser) {
      await this.initialize();
    }

    // Wait for available slot
    await this.waitForSlot();
    this.activeOperations++;

    let page: Page | null = null;

    try {
      // Create new page
      page = await this.browser!.newPage();

      // Set viewport
      await page.setViewport({
        width: 1920,
        height: 1080,
      });

      // Set content with timeout
      await Promise.race([
        page.setContent(htmlContent, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Content load timeout')), this.timeoutMs),
        ),
      ]);

      // Generate PDF with options
      const pdfOptions: PuppeteerPDFOptions = {
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: {
          top: options.margin?.top || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm',
          right: options.margin?.right || '1cm',
        },
        scale: options.scale || 1,
        preferCSSPageSize: options.preferCSSPageSize !== undefined ? options.preferCSSPageSize : true,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      console.log(`[PDFGenerator] PDF generated successfully (${Buffer.byteLength(pdfBuffer)} bytes)`);
      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[PDFGenerator] PDF generation failed:', errorMessage);
      throw new PDFGenerationError(errorMessage);
    } finally {
      // Clean up page
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error('[PDFGenerator] Error closing page:', error);
        }
      }

      this.activeOperations--;
    }
  }

  /**
   * Generate PDF with custom CSS for printing (internal optimization)
   */
  async generatePDFWithPrintStyles(
    htmlContent: string,
    printCSS: string = '',
    options: PDFOptions = {},
  ): Promise<Buffer> {
    // Inject print-specific CSS and media queries
    const enhancedHTML = this.injectPrintStyles(htmlContent, printCSS);
    return this.generatePDF(enhancedHTML, options);
  }

  /**
   * Inject print styles into HTML
   */
  private injectPrintStyles(htmlContent: string, customCSS: string = ''): string {
    const printStyles = `
      <style>
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: white;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          a {
            text-decoration: none;
            color: #000;
          }
          
          .no-print {
            display: none !important;
          }
          
          page-break-before: always {
            page-break-before: always;
          }
          
          page-break-after: always {
            page-break-after: always;
          }
        }
        
        ${customCSS}
      </style>
    `;

    // Insert styles into head
    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', `${printStyles}</head>`);
    }

    // If no head tag, prepend styles to body
    return printStyles + htmlContent;
  }

  /**
   * Batch generate PDFs
   */
  async batchGeneratePDF(
    htmlContents: string[],
    options: PDFOptions = {},
  ): Promise<Buffer[]> {
    console.log(`[PDFGenerator] Starting batch generation of ${htmlContents.length} PDFs`);

    const results: Buffer[] = [];

    for (const html of htmlContents) {
      try {
        const pdf = await this.generatePDF(html, options);
        results.push(pdf);
      } catch (error) {
        console.error('[PDFGenerator] Batch generation error:', error);
        // Continue with next document rather than failing entire batch
        results.push(Buffer.alloc(0));
      }
    }

    console.log(`[PDFGenerator] Batch generation complete. Success: ${results.filter(b => b.length > 0).length}/${htmlContents.length}`);
    return results;
  }

  /**
   * Get generator statistics
   */
  getStats(): {
    isInitialized: boolean;
    activeOperations: number;
    maxConcurrent: number;
  } {
    return {
      isInitialized: !!this.browser,
      activeOperations: this.activeOperations,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

/**
 * Global singleton instance
 */
let globalPDFGenerator: PDFGenerator | null = null;

/**
 * Get or create global PDF generator instance
 */
export function getPDFGenerator(timeoutMs?: number, maxConcurrent?: number): PDFGenerator {
  if (!globalPDFGenerator) {
    globalPDFGenerator = new PDFGenerator(timeoutMs, maxConcurrent);
  }
  return globalPDFGenerator;
}

/**
 * Initialize the global PDF generator
 */
export async function initializePDFGenerator(timeoutMs?: number, maxConcurrent?: number): Promise<PDFGenerator> {
  const generator = getPDFGenerator(timeoutMs, maxConcurrent);
  await generator.initialize();
  return generator;
}

/**
 * Cleanup global PDF generator
 */
export async function cleanupPDFGenerator(): Promise<void> {
  if (globalPDFGenerator) {
    await globalPDFGenerator.close();
    globalPDFGenerator = null;
  }
}
