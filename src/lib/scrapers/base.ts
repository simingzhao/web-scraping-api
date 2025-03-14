import { Browser, Page } from 'puppeteer-core';
import { launchBrowser } from '../puppeteer';
import { extractDomain, checkAndIncrementRateLimit } from '../ratelimit';
import { cachedScrape } from '../cache';

/**
 * Base scraper options interface
 */
export interface BaseScraperOptions {
  cacheEnabled?: boolean;
  cacheTtl?: number;
  rateLimit?: boolean;
  maxRetries?: number;
  timeout?: number;
  proxy?: {
    url: string;
    username?: string;
    password?: string;
  };
  userAgent?: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

/**
 * Base scraper result interface
 */
export interface BaseScraperResult {
  url: string;
  title: string;
  content: string;
  html?: string;
  markdown?: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

/**
 * Base scraper class with common functionality
 */
export class BaseScraper {
  protected browser: Browser | null = null;
  protected options: BaseScraperOptions;

  constructor(options: BaseScraperOptions = {}) {
    this.options = {
      cacheEnabled: true,
      cacheTtl: Number(process.env.CACHE_TTL_SECONDS) || 3600,
      rateLimit: true,
      maxRetries: 3,
      timeout: Number(process.env.MAX_SCRAPE_TIMEOUT_MS) || 30000,
      waitUntil: 'networkidle2',
      ...options,
    };
  }

  /**
   * Initialize the browser if not already initialized
   */
  protected async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await launchBrowser({
        proxy: this.options.proxy,
        timeout: this.options.timeout,
        userAgent: this.options.userAgent,
      });
    }
    return this.browser;
  }

  /**
   * Close the browser if it's open
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check rate limits for a URL
   * @param url URL to check rate limits for
   * @returns Whether the request is allowed
   */
  protected async checkRateLimits(url: string): Promise<boolean> {
    if (!this.options.rateLimit) {
      return true;
    }

    const domain = extractDomain(url);
    const rateLimitInfo = await checkAndIncrementRateLimit(domain);

    return !rateLimitInfo.limited;
  }

  /**
   * Scrape a URL with caching and rate limiting
   * @param url URL to scrape
   * @param scrapeFunction Function to perform the actual scraping
   * @param params Additional parameters for the scrape function
   * @returns Scraping result
   */
  protected async scrapeWithCache<T>(
    url: string,
    scrapeFunction: (url: string, params: Record<string, unknown>) => Promise<T>,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    // Check rate limits first
    if (this.options.rateLimit) {
      const allowed = await this.checkRateLimits(url);
      if (!allowed) {
        throw new Error(`Rate limit exceeded for domain: ${extractDomain(url)}`);
      }
    }

    // Use caching if enabled
    if (this.options.cacheEnabled) {
      return cachedScrape(
        url,
        scrapeFunction,
        params,
        {
          ttl: this.options.cacheTtl,
          namespace: 'scrape',
        }
      );
    }

    // Otherwise just call the scrape function directly
    return scrapeFunction(url, params);
  }

  /**
   * Extract text content from a selector
   * @param page Puppeteer Page
   * @param selector CSS selector
   * @returns Text content or empty string if not found
   */
  protected async extractText(page: Page, selector: string): Promise<string> {
    try {
      return await page.$eval(selector, (el) => el.textContent?.trim() || '');
    } catch {
      return '';
    }
  }

  /**
   * Extract HTML content from a selector
   * @param page Puppeteer Page
   * @param selector CSS selector
   * @returns HTML content or empty string if not found
   */
  protected async extractHtml(page: Page, selector: string): Promise<string> {
    try {
      return await page.$eval(selector, (el) => el.outerHTML);
    } catch {
      return '';
    }
  }

  /**
   * Extract an attribute value from a selector
   * @param page Puppeteer Page
   * @param selector CSS selector
   * @param attribute Attribute name
   * @returns Attribute value or empty string if not found
   */
  protected async extractAttribute(
    page: Page,
    selector: string,
    attribute: string
  ): Promise<string> {
    try {
      return await page.$eval(
        selector,
        (el, attr) => el.getAttribute(attr) || '',
        attribute
      );
    } catch {
      return '';
    }
  }

  /**
   * Wait for a selector to be present on the page
   * @param page Puppeteer Page
   * @param selector CSS selector
   * @param timeout Timeout in milliseconds
   * @returns True if the selector was found, false if it timed out
   */
  protected async waitForSelector(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<boolean> {
    try {
      await page.waitForSelector(selector, {
        timeout: timeout || this.options.timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param maxRetries Maximum number of retries
   * @returns Result of the function
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = this.options.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < (maxRetries || 3) + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // If this was the last attempt, don't wait
        if (attempt >= (maxRetries || 3)) {
          break;
        }
        
        // Wait before retrying, with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Basic scrape method to be overridden by subclasses
   * @param url URL to scrape
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async scrape(url: string): Promise<BaseScraperResult> {
    throw new Error('Method not implemented. Must be overridden by subclass');
  }
} 