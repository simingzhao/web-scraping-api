import TurndownService from 'turndown';

/**
 * Options for HTML to Markdown conversion
 */
export interface MarkdownConversionOptions {
  headingStyle?: 'setext' | 'atx';
  hr?: string;
  bulletListMarker?: '-' | '+' | '*';
  codeBlockStyle?: 'indented' | 'fenced';
  fence?: '```' | '~~~';
  emDelimiter?: '_' | '*';
  strongDelimiter?: '__' | '**';
  linkStyle?: 'inlined' | 'referenced';
  linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
  preserveImageSize?: boolean;
  preserveCodeFormatting?: boolean;
  preserveTableFormat?: boolean;
  preserveLinks?: boolean;
}

/**
 * Default options for HTML to Markdown conversion
 */
const DEFAULT_OPTIONS: MarkdownConversionOptions = {
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
  linkReferenceStyle: 'full',
  preserveImageSize: true,
  preserveCodeFormatting: true,
  preserveTableFormat: true,
  preserveLinks: true,
};

// Declare the type for the replacement function
type ReplacementFunction = (content: string, node: Node) => string;

/**
 * Create a configured TurndownService instance
 * @param options Markdown conversion options
 * @returns Configured TurndownService instance
 */
export function createTurndownService(options: MarkdownConversionOptions = {}): TurndownService {
  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a new TurndownService instance with the merged options
  const turndownService = new TurndownService({
    headingStyle: mergedOptions.headingStyle,
    hr: mergedOptions.hr,
    bulletListMarker: mergedOptions.bulletListMarker,
    codeBlockStyle: mergedOptions.codeBlockStyle,
    fence: mergedOptions.fence,
    emDelimiter: mergedOptions.emDelimiter,
    strongDelimiter: mergedOptions.strongDelimiter,
    linkStyle: mergedOptions.linkStyle,
    linkReferenceStyle: mergedOptions.linkReferenceStyle,
  });

  // Add custom rules based on options
  if (mergedOptions.preserveImageSize) {
    addImageSizePreservationRule(turndownService);
  }

  if (mergedOptions.preserveCodeFormatting) {
    addCodeFormattingRule(turndownService);
  }

  if (mergedOptions.preserveTableFormat) {
    addTableFormattingRule(turndownService);
  }

  return turndownService;
}

/**
 * Convert HTML to Markdown
 * @param html HTML content to convert
 * @param options Markdown conversion options
 * @returns Markdown content
 */
export function htmlToMarkdown(html: string, options: MarkdownConversionOptions = {}): string {
  const turndownService = createTurndownService(options);
  return turndownService.turndown(html);
}

/**
 * Add rule to preserve image sizes in markdown
 * @param turndownService TurndownService instance
 */
function addImageSizePreservationRule(turndownService: TurndownService): void {
  turndownService.addRule('images', {
    filter: 'img',
    replacement: ((content: string, node: Node) => {
      const img = node as HTMLImageElement;
      const alt = img.alt || '';
      const src = img.getAttribute('src') || '';
      
      if (!src) return '';
      
      // Check if image has width and height attributes
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      
      // If both width and height are specified, add them to the markdown
      if (width && height) {
        return `![${alt}](${src} =${width}x${height})`;
      }
      
      // If only width is specified, add it to the markdown
      if (width) {
        return `![${alt}](${src} =${width}x)`;
      }
      
      // If only height is specified, add it to the markdown
      if (height) {
        return `![${alt}](${src} =x${height})`;
      }
      
      // Otherwise, just return the standard markdown image
      return `![${alt}](${src})`;
    }) as ReplacementFunction,
  });
}

/**
 * Add rule to preserve code formatting in markdown
 * @param turndownService TurndownService instance
 */
function addCodeFormattingRule(turndownService: TurndownService): void {
  turndownService.addRule('codeBlocks', {
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
}

/**
 * Add rule to preserve table formatting in markdown
 * @param turndownService TurndownService instance
 */
function addTableFormattingRule(turndownService: TurndownService): void {
  turndownService.addRule('tables', {
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
 * Extract plain text from HTML
 * @param html HTML content
 * @returns Plain text content
 */
export function htmlToText(html: string): string {
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Extract text content
  return tempElement.textContent || '';
}

/**
 * Extract metadata from HTML
 * @param html HTML content
 * @returns Metadata object
 */
export function extractMetadataFromHtml(html: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Extract metadata from meta tags
  const metaTags = tempElement.querySelectorAll('meta');
  metaTags.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    
    if (name && content) {
      metadata[name] = content;
    }
  });
  
  return metadata;
}

/**
 * Clean HTML content before conversion
 * @param html HTML content
 * @returns Cleaned HTML content
 */
export function cleanHtml(html: string): string {
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Remove script and style tags
  const scriptsAndStyles = tempElement.querySelectorAll('script, style');
  scriptsAndStyles.forEach(element => {
    element.remove();
  });
  
  // Remove comments
  const commentNodes = [];
  const walker = document.createTreeWalker(
    tempElement,
    NodeFilter.SHOW_COMMENT,
    null
  );
  
  let currentNode;
  while (currentNode = walker.nextNode()) {
    commentNodes.push(currentNode);
  }
  
  commentNodes.forEach(comment => {
    comment.parentNode?.removeChild(comment);
  });
  
  return tempElement.innerHTML;
}

/**
 * Convert HTML to Markdown with cleaning
 * @param html HTML content
 * @param options Markdown conversion options
 * @returns Markdown content
 */
export function cleanHtmlToMarkdown(html: string, options: MarkdownConversionOptions = {}): string {
  const cleanedHtml = cleanHtml(html);
  return htmlToMarkdown(cleanedHtml, options);
} 