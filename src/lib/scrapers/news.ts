import { Page } from 'puppeteer-core';
import TurndownService from 'turndown';
import { createPage, navigateToUrl } from '../puppeteer';
import { BaseScraper, BaseScraperOptions, BaseScraperResult } from './base';

// Declare the type for the replacement function
type ReplacementFunction = (content: string, node: Node) => string;

/**
 * News article scraper options
 */
export interface NewsScraperOptions extends BaseScraperOptions {
  extractComments?: boolean;
  extractImages?: boolean;
  extractAuthors?: boolean;
  extractPublishedDate?: boolean;
}

/**
 * News article scraper result
 */
export interface NewsScraperResult extends BaseScraperResult {
  authors: string[];
  publishedDate?: string;
  category?: string;
  summary?: string;
  imageUrls?: string[];
  commentCount?: number;
}

/**
 * Specialized scraper for news articles
 */
export class NewsScraper extends BaseScraper {
  private turndownService: TurndownService;
  private newsOptions: NewsScraperOptions;

  constructor(options: NewsScraperOptions = {}) {
    super(options);
    this.newsOptions = {
      extractComments: false,
      extractImages: true,
      extractAuthors: true,
      extractPublishedDate: true,
      ...options,
    };

    // Initialize Turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Customize Turndown rules
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: ((_content: string, node: Node) => {
        const img = node as HTMLImageElement;
        const alt = img.alt || '';
        const src = img.getAttribute('src') || '';
        return src ? `![${alt}](${src})` : '';
      }) as ReplacementFunction,
    });
  }

  /**
   * Scrape a news article
   * @param url URL of the news article
   * @returns Scraped news article data
   */
  public async scrape(url: string): Promise<NewsScraperResult> {
    return this.scrapeWithCache<NewsScraperResult>(
      url,
      async (targetUrl) => {
        const browser = await this.initBrowser();
        const page = await createPage(browser, {
          userAgent: this.options.userAgent,
          timeout: this.options.timeout,
        });

        try {
          // Navigate to the URL
          await navigateToUrl(page, targetUrl, {
            waitUntil: this.options.waitUntil as 'networkidle2',
            maxRetries: this.options.maxRetries,
          });

          // Extract the article data
          const result = await this.extractArticleData(page, targetUrl);
          return result;
        } finally {
          await page.close();
        }
      },
      {}
    );
  }

  /**
   * Extract article data from the page
   * @param page Puppeteer Page
   * @param url Original URL
   * @returns Extracted article data
   */
  private async extractArticleData(page: Page, url: string): Promise<NewsScraperResult> {
    // Extract basic article information
    const title = await this.extractArticleTitle(page);
    const content = await this.extractArticleContent(page);
    const html = await this.extractArticleHtml(page);
    
    // Convert HTML to Markdown
    const markdown = this.turndownService.turndown(html);

    // Extract additional metadata
    const authors = this.newsOptions.extractAuthors 
      ? await this.extractAuthors(page) 
      : [];
    
    const publishedDate = this.newsOptions.extractPublishedDate 
      ? await this.extractPublishedDate(page) 
      : undefined;
    
    const imageUrls = this.newsOptions.extractImages 
      ? await this.extractImageUrls(page) 
      : undefined;
    
    const category = await this.extractCategory(page);
    const summary = await this.extractSummary(page);
    const commentCount = this.newsOptions.extractComments 
      ? await this.extractCommentCount(page) 
      : undefined;

    // Compile the result
    return {
      url,
      title,
      content,
      html,
      markdown,
      authors,
      publishedDate,
      category,
      summary,
      imageUrls,
      commentCount,
      metadata: {
        authors,
        publishedDate,
        category,
        commentCount,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Extract the article title
   * @param page Puppeteer Page
   * @returns Article title
   */
  private async extractArticleTitle(page: Page): Promise<string> {
    // Try different selectors for article titles
    const selectors = [
      'h1',
      'article h1',
      '.article-title',
      '.post-title',
      '.entry-title',
      '[itemprop="headline"]',
      'header h1',
      'main h1',
    ];

    for (const selector of selectors) {
      const title = await this.extractText(page, selector);
      if (title) {
        return title;
      }
    }

    // Fallback to page title if no article title found
    return page.title();
  }

  /**
   * Extract the article content as plain text
   * @param page Puppeteer Page
   * @returns Article content as plain text
   */
  private async extractArticleContent(page: Page): Promise<string> {
    // Try different selectors for article content
    const selectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '[itemprop="articleBody"]',
      'main',
      '.content',
    ];

    for (const selector of selectors) {
      const content = await this.extractText(page, selector);
      if (content && content.length > 100) {
        return content;
      }
    }

    // Fallback to body text if no article content found
    return this.extractText(page, 'body');
  }

  /**
   * Extract the article content as HTML
   * @param page Puppeteer Page
   * @returns Article content as HTML
   */
  private async extractArticleHtml(page: Page): Promise<string> {
    // Try different selectors for article content
    const selectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '[itemprop="articleBody"]',
      'main',
      '.content',
    ];

    for (const selector of selectors) {
      const html = await this.extractHtml(page, selector);
      if (html && html.length > 100) {
        return html;
      }
    }

    // Fallback to body HTML if no article content found
    return this.extractHtml(page, 'body');
  }

  /**
   * Extract article authors
   * @param page Puppeteer Page
   * @returns Array of author names
   */
  private async extractAuthors(page: Page): Promise<string[]> {
    // Try different selectors for article authors
    const selectors = [
      '[rel="author"]',
      '.author',
      '.byline',
      '[itemprop="author"]',
      '.article-author',
      '.post-author',
    ];

    for (const selector of selectors) {
      try {
        const authors = await page.$$eval(selector, (elements) => 
          elements.map(el => el.textContent?.trim() || '').filter(Boolean)
        );
        
        if (authors.length > 0) {
          return authors;
        }
      } catch {
        // Continue to next selector
      }
    }

    // Try meta tags
    try {
      const metaAuthor = await page.$eval('meta[name="author"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaAuthor) {
        return [metaAuthor];
      }
    } catch {
      // Continue to next method
    }

    return [];
  }

  /**
   * Extract published date
   * @param page Puppeteer Page
   * @returns Published date as string
   */
  private async extractPublishedDate(page: Page): Promise<string | undefined> {
    // Try different selectors for published date
    const selectors = [
      '[itemprop="datePublished"]',
      'time',
      '.published-date',
      '.post-date',
      '.article-date',
      '.date',
    ];

    for (const selector of selectors) {
      // Try to get the datetime attribute first
      const dateAttr = await this.extractAttribute(page, selector, 'datetime');
      if (dateAttr) {
        return dateAttr;
      }

      // Then try the text content
      const dateText = await this.extractText(page, selector);
      if (dateText) {
        return dateText;
      }
    }

    // Try meta tags
    try {
      const metaDate = await page.$eval('meta[property="article:published_time"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaDate) {
        return metaDate;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract image URLs from the article
   * @param page Puppeteer Page
   * @returns Array of image URLs
   */
  private async extractImageUrls(page: Page): Promise<string[] | undefined> {
    // Try to find images in the article content
    const selectors = [
      'article img',
      '.article-content img',
      '.post-content img',
      '.entry-content img',
      '[itemprop="articleBody"] img',
      'main img',
    ];

    for (const selector of selectors) {
      try {
        const imageUrls = await page.$$eval(selector, (images) => 
          images.map(img => img.getAttribute('src') || '')
            .filter(Boolean)
            .filter(src => !src.includes('data:image')) // Filter out data URLs
        );
        
        if (imageUrls.length > 0) {
          return imageUrls;
        }
      } catch {
        // Continue to next selector
      }
    }

    // Try to find the featured image
    try {
      const featuredImage = await page.$eval('meta[property="og:image"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (featuredImage) {
        return [featuredImage];
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract article category
   * @param page Puppeteer Page
   * @returns Article category
   */
  private async extractCategory(page: Page): Promise<string | undefined> {
    // Try different selectors for article category
    const selectors = [
      '.category',
      '[itemprop="articleSection"]',
      '.article-category',
      '.post-category',
    ];

    for (const selector of selectors) {
      const category = await this.extractText(page, selector);
      if (category) {
        return category;
      }
    }

    // Try meta tags
    try {
      const metaCategory = await page.$eval('meta[property="article:section"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaCategory) {
        return metaCategory;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract article summary
   * @param page Puppeteer Page
   * @returns Article summary
   */
  private async extractSummary(page: Page): Promise<string | undefined> {
    // Try different selectors for article summary
    const selectors = [
      '.summary',
      '.article-summary',
      '.post-summary',
      '.excerpt',
      '.description',
    ];

    for (const selector of selectors) {
      const summary = await this.extractText(page, selector);
      if (summary) {
        return summary;
      }
    }

    // Try meta tags
    try {
      const metaDescription = await page.$eval('meta[name="description"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaDescription) {
        return metaDescription;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract comment count
   * @param page Puppeteer Page
   * @returns Comment count
   */
  private async extractCommentCount(page: Page): Promise<number | undefined> {
    // Try different selectors for comment count
    const selectors = [
      '.comment-count',
      '.comments-count',
      '.comment-number',
    ];

    for (const selector of selectors) {
      const countText = await this.extractText(page, selector);
      if (countText) {
        // Try to extract a number from the text
        const match = countText.match(/\d+/);
        if (match) {
          return parseInt(match[0], 10);
        }
      }
    }

    // Try counting comment elements
    try {
      const commentCount = await page.$$eval('.comment, .comments > li', comments => comments.length);
      if (commentCount > 0) {
        return commentCount;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }
} 