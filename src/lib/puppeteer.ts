import puppeteer, { Browser, Page, LaunchOptions, WaitForOptions, HTTPRequest } from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

// Types for browser options
interface BrowserOptions {
  proxy?: {
    url: string;
    username?: string;
    password?: string;
  };
  timeout?: number;
  headless?: boolean;
  userAgent?: string;
}

/**
 * Launch a Puppeteer browser instance optimized for serverless environments
 * @param options Configuration options for the browser
 * @returns A Promise resolving to a Puppeteer Browser instance
 */
export async function launchBrowser(options: BrowserOptions = {}): Promise<Browser> {
  const {
    proxy,
    timeout = Number(process.env.MAX_SCRAPE_TIMEOUT_MS) || 30000,
    headless = true,
  } = options;

  // Determine if we're in a serverless environment
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;

  // Default browser arguments
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
  ];

  // Add proxy settings if provided
  if (proxy?.url) {
    args.push(`--proxy-server=${proxy.url}`);
  }

  // Configure browser launch options
  const launchOptions: LaunchOptions = {
    args,
    headless,
    defaultViewport: {
      width: 1280,
      height: 800,
    },
    timeout,
  };

  // Use chrome-aws-lambda in serverless environments
  if (isServerless) {
    launchOptions.executablePath = await chromium.executablePath;
  } else {
    // For local development, use the locally installed Chrome
    const localChromePaths = {
      win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      linux: '/usr/bin/google-chrome',
    };
    
    launchOptions.executablePath = localChromePaths[process.platform as keyof typeof localChromePaths];
  }

  // Launch the browser
  const browser = await puppeteer.launch(launchOptions);

  // Set up authentication for the proxy if credentials are provided
  if (proxy?.username && proxy?.password) {
    const page = await browser.newPage();
    await page.authenticate({
      username: proxy.username,
      password: proxy.password,
    });
    await page.close();
  }

  return browser;
}

/**
 * Create a new page with common settings
 * @param browser Puppeteer Browser instance
 * @param options Configuration options
 * @returns A Promise resolving to a configured Puppeteer Page
 */
export async function createPage(browser: Browser, options: BrowserOptions = {}): Promise<Page> {
  const {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  } = options;

  const page = await browser.newPage();
  
  // Set user agent
  await page.setUserAgent(userAgent);
  
  // Set default timeout
  const timeout = options.timeout || Number(process.env.MAX_SCRAPE_TIMEOUT_MS) || 30000;
  page.setDefaultTimeout(timeout);
  
  // Block common resource types to speed up scraping
  await page.setRequestInterception(true);
  page.on('request', (req: HTTPRequest) => {
    const resourceType = req.resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
}

/**
 * Navigate to a URL with retry logic
 * @param page Puppeteer Page instance
 * @param url URL to navigate to
 * @param options Navigation options
 * @returns A Promise resolving when navigation is complete
 */
export async function navigateToUrl(
  page: Page,
  url: string,
  options: { maxRetries?: number; waitUntil?: WaitForOptions['waitUntil'] } = {}
): Promise<void> {
  const { maxRetries = 3, waitUntil = 'networkidle2' } = options;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await page.goto(url, { waitUntil });
      return;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
} 