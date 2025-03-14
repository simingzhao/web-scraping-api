import { Page } from 'puppeteer-core';
import TurndownService from 'turndown';
import { createPage, navigateToUrl } from '../puppeteer';
import { BaseScraper, BaseScraperOptions, BaseScraperResult } from './base';

// Declare the type for the replacement function
type ReplacementFunction = (content: string, node: Node) => string;

/**
 * Technical documentation scraper options
 */
export interface TechDocsScraperOptions extends BaseScraperOptions {
  extractTableOfContents?: boolean;
  extractCodeBlocks?: boolean;
  extractHeadings?: boolean;
  extractLinks?: boolean;
  preserveCodeFormatting?: boolean;
}

/**
 * Code block interface
 */
export interface CodeBlock {
  language?: string;
  code: string;
}

/**
 * Heading interface
 */
export interface Heading {
  level: number;
  text: string;
  id?: string;
}

/**
 * Link interface
 */
export interface Link {
  text: string;
  url: string;
  isExternal: boolean;
}

/**
 * Technical documentation scraper result
 */
export interface TechDocsScraperResult extends BaseScraperResult {
  tableOfContents?: Heading[];
  codeBlocks?: CodeBlock[];
  headings?: Heading[];
  links?: Link[];
}

/**
 * Specialized scraper for technical documentation
 */
export class TechDocsScraper extends BaseScraper {
  private turndownService: TurndownService;
  private techDocsOptions: TechDocsScraperOptions;

  constructor(options: TechDocsScraperOptions = {}) {
    super(options);
    this.techDocsOptions = {
      extractTableOfContents: true,
      extractCodeBlocks: true,
      extractHeadings: true,
      extractLinks: true,
      preserveCodeFormatting: true,
      ...options,
    };

    // Initialize Turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
    });

    // Customize Turndown rules for technical documentation
    this.turndownService.addRule('codeBlocks', {
      filter: ['pre', 'code'],
      replacement: ((content: string, node: Node) => {
        const element = node as HTMLElement;
        const isPreTag = element.nodeName.toLowerCase() === 'pre';
        const isCodeBlock = isPreTag || (element.parentNode && element.parentNode.nodeName.toLowerCase() === 'pre');
        
        if (isCodeBlock) {
          // Try to determine the language
          let language = '';
          const classList = element.className.split(' ');
          
          for (const className of classList) {
            if (className.startsWith('language-') || className.startsWith('lang-')) {
              language = className.replace(/^(language-|lang-)/, '');
              break;
            }
          }
          
          // Format as a code block
          const code = content.replace(/\n$/, '');
          return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
        }
        
        // Inline code
        return `\`${content}\``;
      }) as ReplacementFunction,
    });

    // Add rule for tables
    this.turndownService.addRule('tables', {
      filter: 'table',
      replacement: ((content: string, node: Node) => {
        const element = node as HTMLTableElement;
        const rows = element.rows;
        const headerRow = rows[0];
        
        if (!headerRow) return content;
        
        // Build the markdown table
        let markdownTable = '\n';
        
        // Header row
        const headers = Array.from(headerRow.cells).map(cell => cell.textContent?.trim() || '');
        markdownTable += `| ${headers.join(' | ')} |\n`;
        
        // Separator row
        markdownTable += `| ${headers.map(() => '---').join(' | ')} |\n`;
        
        // Data rows
        for (let i = 1; i < rows.length; i++) {
          const cells = Array.from(rows[i].cells).map(cell => cell.textContent?.trim() || '');
          markdownTable += `| ${cells.join(' | ')} |\n`;
        }
        
        return markdownTable + '\n';
      }) as ReplacementFunction,
    });
  }

  /**
   * Scrape technical documentation
   * @param url URL of the documentation
   * @returns Scraped documentation data
   */
  public async scrape(url: string): Promise<TechDocsScraperResult> {
    return this.scrapeWithCache<TechDocsScraperResult>(
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

          // Extract the documentation data
          const result = await this.extractDocumentationData(page, targetUrl);
          return result;
        } finally {
          await page.close();
        }
      },
      {}
    );
  }

  /**
   * Extract documentation data from the page
   * @param page Puppeteer Page
   * @param url Original URL
   * @returns Extracted documentation data
   */
  private async extractDocumentationData(page: Page, url: string): Promise<TechDocsScraperResult> {
    // Extract basic documentation information
    const title = await this.extractDocumentationTitle(page);
    const content = await this.extractDocumentationContent(page);
    const html = await this.extractDocumentationHtml(page);
    
    // Convert HTML to Markdown
    const markdown = this.turndownService.turndown(html);

    // Extract additional documentation information
    const tableOfContents = this.techDocsOptions.extractTableOfContents 
      ? await this.extractTableOfContents(page) 
      : undefined;
    
    const codeBlocks = this.techDocsOptions.extractCodeBlocks 
      ? await this.extractCodeBlocks(page) 
      : undefined;
    
    const headings = this.techDocsOptions.extractHeadings 
      ? await this.extractHeadings(page) 
      : undefined;
    
    const links = this.techDocsOptions.extractLinks 
      ? await this.extractLinks(page, url) 
      : undefined;

    // Compile the result
    return {
      url,
      title,
      content,
      html,
      markdown,
      tableOfContents,
      codeBlocks,
      headings,
      links,
      metadata: {
        headingCount: headings?.length || 0,
        codeBlockCount: codeBlocks?.length || 0,
        linkCount: links?.length || 0,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Extract the documentation title
   * @param page Puppeteer Page
   * @returns Documentation title
   */
  private async extractDocumentationTitle(page: Page): Promise<string> {
    // Try different selectors for documentation titles
    const selectors = [
      'h1',
      '.documentation-title',
      '.doc-title',
      '.page-title',
      'header h1',
      'main h1',
      '.content h1',
    ];

    for (const selector of selectors) {
      const title = await this.extractText(page, selector);
      if (title) {
        return title;
      }
    }

    // Fallback to page title if no documentation title found
    return page.title();
  }

  /**
   * Extract the documentation content as plain text
   * @param page Puppeteer Page
   * @returns Documentation content as plain text
   */
  private async extractDocumentationContent(page: Page): Promise<string> {
    // Try different selectors for documentation content
    const selectors = [
      '.documentation-content',
      '.doc-content',
      '.content',
      'article',
      'main',
      '.markdown-body',
    ];

    for (const selector of selectors) {
      const content = await this.extractText(page, selector);
      if (content && content.length > 100) {
        return content;
      }
    }

    // Fallback to body text if no documentation content found
    return this.extractText(page, 'body');
  }

  /**
   * Extract the documentation content as HTML
   * @param page Puppeteer Page
   * @returns Documentation content as HTML
   */
  private async extractDocumentationHtml(page: Page): Promise<string> {
    // Try different selectors for documentation content
    const selectors = [
      '.documentation-content',
      '.doc-content',
      '.content',
      'article',
      'main',
      '.markdown-body',
    ];

    for (const selector of selectors) {
      const html = await this.extractHtml(page, selector);
      if (html && html.length > 100) {
        return html;
      }
    }

    // Fallback to body HTML if no documentation content found
    return this.extractHtml(page, 'body');
  }

  /**
   * Extract table of contents
   * @param page Puppeteer Page
   * @returns Array of headings in the table of contents
   */
  private async extractTableOfContents(page: Page): Promise<Heading[] | undefined> {
    // Try different selectors for table of contents
    const selectors = [
      '.table-of-contents',
      '.toc',
      'nav.toc',
      '.documentation-toc',
      '.sidebar-menu',
    ];

    for (const selector of selectors) {
      try {
        // Check if the table of contents exists
        const tocExists = await this.waitForSelector(page, selector, 100);
        if (!tocExists) continue;

        // Extract headings from the table of contents
        const tocHeadings = await page.$$eval(`${selector} a`, (links) => {
          return links.map(link => {
            const text = link.textContent?.trim() || '';
            const href = link.getAttribute('href') || '';
            const id = href.startsWith('#') ? href.substring(1) : undefined;
            
            // Try to determine the heading level
            let level = 1;
            const parentElement = link.parentElement;
            
            if (parentElement) {
              // Check if the parent has a class indicating level
              const classList = parentElement.className.split(' ');
              for (const className of classList) {
                if (className.includes('level-')) {
                  const levelMatch = className.match(/level-(\d+)/);
                  if (levelMatch) {
                    level = parseInt(levelMatch[1], 10);
                    break;
                  }
                }
              }
              
              // Check nesting depth
              if (level === 1) {
                let parent: HTMLElement | null = parentElement;
                let depth = 0;
                
                while (parent && depth < 5) {
                  if (parent.tagName === 'UL' || parent.tagName === 'OL') {
                    depth++;
                  }
                  parent = parent.parentElement;
                }
                
                level = Math.max(1, depth);
              }
            }
            
            return { text, id, level };
          }).filter(heading => heading.text);
        });

        if (tocHeadings.length > 0) {
          return tocHeadings;
        }
      } catch {
        // Continue to next selector
      }
    }

    // If no table of contents found, try to generate one from the headings
    const headings = await this.extractHeadings(page);
    return headings;
  }

  /**
   * Extract code blocks
   * @param page Puppeteer Page
   * @returns Array of code blocks
   */
  private async extractCodeBlocks(page: Page): Promise<CodeBlock[] | undefined> {
    // Try different selectors for code blocks
    const selectors = [
      'pre code',
      'pre.code',
      '.code-block',
      '.highlight',
    ];

    for (const selector of selectors) {
      try {
        const codeBlocks = await page.$$eval(selector, (blocks) => {
          return blocks.map(block => {
            const code = block.textContent?.trim() || '';
            
            // Try to determine the language
            let language: string | undefined;
            const classList = block.className.split(' ');
            
            for (const className of classList) {
              if (className.startsWith('language-') || className.startsWith('lang-')) {
                language = className.replace(/^(language-|lang-)/, '');
                break;
              }
            }
            
            return { code, language };
          }).filter(block => block.code);
        });

        if (codeBlocks.length > 0) {
          return codeBlocks;
        }
      } catch {
        // Continue to next selector
      }
    }

    return undefined;
  }

  /**
   * Extract headings
   * @param page Puppeteer Page
   * @returns Array of headings
   */
  private async extractHeadings(page: Page): Promise<Heading[] | undefined> {
    try {
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => {
        return elements.map(el => {
          const level = parseInt(el.tagName.substring(1), 10);
          const text = el.textContent?.trim() || '';
          const id = el.id || undefined;
          
          return { level, text, id };
        }).filter(heading => heading.text);
      });

      if (headings.length > 0) {
        return headings;
      }
    } catch {
      // Return undefined if extraction fails
    }

    return undefined;
  }

  /**
   * Extract links
   * @param page Puppeteer Page
   * @param baseUrl Base URL for resolving relative links
   * @returns Array of links
   */
  private async extractLinks(page: Page, baseUrl: string): Promise<Link[] | undefined> {
    try {
      const links = await page.$$eval('a[href]', (elements, baseUrl) => {
        return elements.map(el => {
          const text = el.textContent?.trim() || '';
          const href = el.getAttribute('href') || '';
          
          // Resolve relative URLs
          let url = href;
          if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#')) {
            try {
              url = new URL(href, baseUrl).href;
            } catch {
              // Keep the original URL if resolution fails
            }
          }
          
          // Determine if the link is external
          const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
          
          return { text, url, isExternal };
        }).filter(link => link.text && link.url);
      }, baseUrl);

      if (links.length > 0) {
        return links;
      }
    } catch {
      // Return undefined if extraction fails
    }

    return undefined;
  }
} 