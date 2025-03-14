import { NextApiRequest, NextApiResponse } from 'next';
import { NewsScraper, NewsScraperResult } from '@/lib/scrapers/news';
import { EcommerceScraper, EcommerceScraperResult } from '@/lib/scrapers/ecommerce';
import { TechDocsScraper, TechDocsScraperResult } from '@/lib/scrapers/techdocs';
import { extractDomain, checkAndIncrementRateLimit } from '@/lib/ratelimit';
import { validateScraperRequest } from '@/lib/validators';
import { handleError, withTimeout } from '@/lib/errors';
import { BaseScraperResult } from '@/lib/scrapers/base';

// Define the supported scraper types
type ScraperType = 'news' | 'ecommerce' | 'techdocs' | 'generic';

// Define the response data structure
interface ScraperResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  timestamp: number;
  processingTime?: number;
}

// Extend the RateLimitInfo interface to include resetInSeconds
interface ExtendedRateLimitInfo {
  limited: boolean;
  current: number;
  max: number;
  resetInSeconds: number;
}

/**
 * Dynamic API route handler for scraping requests
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScraperResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
      timestamp: Date.now(),
    });
  }

  const startTime = Date.now();
  
  try {
    // Get the scraper type from the URL
    const { type } = req.query as { type: ScraperType };
    
    // Get the URL and options from the request body
    const { url, options = {} } = req.body as { url: string; options?: Record<string, unknown> };
    
    // Validate the URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing URL parameter',
        timestamp: Date.now(),
      });
    }

    // Validate the request
    const validation = validateScraperRequest({
      url,
      type,
      options,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.reason || 'Invalid request',
        timestamp: Date.now(),
      });
    }

    // Check rate limits
    const domain = extractDomain(url);
    const rateLimitInfo = await checkAndIncrementRateLimit(domain) as ExtendedRateLimitInfo;
    
    if (rateLimitInfo.limited) {
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded for domain: ${domain}. Try again in ${rateLimitInfo.resetInSeconds} seconds.`,
        timestamp: Date.now(),
      });
    }

    // Initialize the appropriate scraper based on the type and perform scraping
    const timeout = typeof options.timeout === 'number' ? options.timeout : 30000;
    let result: BaseScraperResult;

    switch (type) {
      case 'news': {
        const scraper = new NewsScraper(options);
        try {
          result = await withTimeout<NewsScraperResult>(
            () => scraper.scrape(url),
            timeout,
            `Scraping operation timed out after ${timeout}ms`
          );
          await scraper.close();
        } catch (error) {
          await scraper.close();
          throw error;
        }
        break;
      }
      case 'ecommerce': {
        const scraper = new EcommerceScraper(options);
        try {
          result = await withTimeout<EcommerceScraperResult>(
            () => scraper.scrape(url),
            timeout,
            `Scraping operation timed out after ${timeout}ms`
          );
          await scraper.close();
        } catch (error) {
          await scraper.close();
          throw error;
        }
        break;
      }
      case 'techdocs':
      case 'generic': {
        const scraperOptions = type === 'generic' 
          ? {
              ...options,
              extractTableOfContents: false,
              extractCodeBlocks: false,
              extractHeadings: false,
              extractLinks: false,
            }
          : options;
        
        const scraper = new TechDocsScraper(scraperOptions);
        try {
          result = await withTimeout<TechDocsScraperResult>(
            () => scraper.scrape(url),
            timeout,
            `Scraping operation timed out after ${timeout}ms`
          );
          await scraper.close();
        } catch (error) {
          await scraper.close();
          throw error;
        }
        break;
      }
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported scraper type: ${type}. Supported types are: news, ecommerce, techdocs, generic`,
          timestamp: Date.now(),
        });
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return the result
    return res.status(200).json({
      success: true,
      data: result as unknown as Record<string, unknown>,
      timestamp: Date.now(),
      processingTime,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Handle the error
    const scrapingError = handleError(error);
    
    // Calculate processing time even for errors
    const processingTime = Date.now() - startTime;
    
    return res.status(scrapingError.statusCode).json({
      success: false,
      error: scrapingError.message,
      timestamp: Date.now(),
      processingTime,
    });
  }
}

// Configure the API route to increase the body size limit for larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: '8mb',
  },
}; 