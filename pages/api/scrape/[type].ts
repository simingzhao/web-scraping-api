import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '../../../lib/mock-kv';
import { getPage, closeBrowser } from '../../../lib/puppeteer';
import { z } from 'zod';
import TurndownService from 'turndown';
import { createHash } from 'crypto';

// Input validation schema
const requestSchema = z.object({
  url: z.string().url(),
  format: z.enum(['html', 'markdown', 'text']).default('markdown'),
  force: z.boolean().default(false),
});

// Cache TTL in seconds (24 hours)
const CACHE_TTL = 24 * 60 * 60;

// Generate cache key from request parameters
function generateCacheKey(url: string, format: string): string {
  return createHash('sha256').update(`${url}:${format}`).digest('hex');
}

// Simple rate limiting
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds

async function checkRateLimit(req: NextApiRequest): Promise<boolean> {
  const ipHeader = req.headers['x-forwarded-for'];
  const ip = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader || req.socket.remoteAddress || 'unknown';
  const now = Math.floor(Date.now() / 1000); // Convert to seconds
  const rateLimitKey = `ratelimit:${ip}`;

  const rateLimit = await kv.get<{ count: number; timestamp: number }>(rateLimitKey);

  if (!rateLimit || (now - rateLimit.timestamp) > RATE_LIMIT_WINDOW) {
    await kv.set(rateLimitKey, { count: 1, timestamp: now }, { ex: RATE_LIMIT_WINDOW });
    return true;
  }

  if (rateLimit.count >= RATE_LIMIT) {
    return false;
  }

  await kv.set(rateLimitKey, { count: rateLimit.count + 1, timestamp: rateLimit.timestamp }, { ex: RATE_LIMIT_WINDOW });
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API Route Hit:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
    body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
  });

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check rate limit
    if (!await checkRateLimit(req)) {
      console.log('Rate limit exceeded');
      return res.status(429).json({ error: 'Too many requests' });
    }

    // Parse request body if it's a string
    let parsedBody = req.body;
    if (typeof req.body === 'string') {
      try {
        parsedBody = JSON.parse(req.body);
      } catch (e) {
        console.error('Failed to parse request body:', e);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }

    console.log('Parsed body:', parsedBody);

    // Validate request body
    const result = requestSchema.safeParse(parsedBody);
    if (!result.success) {
      console.error('Validation error:', result.error);
      return res.status(400).json({ error: result.error.errors });
    }

    const { url, format, force } = result.data;
    console.log('Processing request:', { url, format, force });

    const cacheKey = generateCacheKey(url, format);

    // Check cache if force refresh is not requested
    if (!force) {
      const cachedData = await kv.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached data');
        return res.status(200).json({ data: cachedData, cached: true });
      }
    }

    // Get page content
    console.log('Fetching page content...');
    const page = await getPage(url);
    let content = '';

    try {
      // Wait for content to load
      await page.waitForSelector('body');

      // Helper function for content extraction
      const extractContent = () => {
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        const main = document.querySelector('main') || document.querySelector('article') || document.body;
        return main.innerHTML;
      };

      const extractText = () => {
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        const main = document.querySelector('main') || document.querySelector('article') || document.body;
        return main.innerText;
      };

      // Get page content based on format
      if (format === 'html') {
        content = await page.evaluate(extractContent);
      } else if (format === 'markdown') {
        content = await page.evaluate(extractContent);
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          bulletListMarker: '-'
        });
        content = turndownService.turndown(content);
      } else {
        content = await page.evaluate(extractText);
      }

      console.log('Content fetched successfully');

      // Cache the result
      await kv.set(cacheKey, content, { ex: CACHE_TTL });

      return res.status(200).json({ data: content, cached: false });
    } finally {
      await closeBrowser(page);
    }
  } catch (error) {
    console.error('Scraping error:', error);
    // Ensure we're sending a proper error response
    return res.status(500).json({ 
      error: 'Failed to scrape content',
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
} 