import { Page } from 'puppeteer-core';
import { createPage, navigateToUrl } from '../puppeteer';
import { BaseScraper, BaseScraperOptions, BaseScraperResult } from './base';

/**
 * E-commerce product scraper options
 */
export interface EcommerceScraperOptions extends BaseScraperOptions {
  extractReviews?: boolean;
  extractVariants?: boolean;
  extractRelatedProducts?: boolean;
  extractSpecifications?: boolean;
}

/**
 * Product variant interface
 */
export interface ProductVariant {
  name: string;
  value: string;
  price?: string;
  available?: boolean;
}

/**
 * Product review interface
 */
export interface ProductReview {
  author?: string;
  rating: number;
  date?: string;
  title?: string;
  content: string;
}

/**
 * Product specification interface
 */
export interface ProductSpecification {
  name: string;
  value: string;
}

/**
 * E-commerce product scraper result
 */
export interface EcommerceScraperResult extends BaseScraperResult {
  price: string;
  currency?: string;
  availability: boolean;
  brand?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  imageUrls: string[];
  variants?: ProductVariant[];
  specifications?: ProductSpecification[];
  reviews?: ProductReview[];
  relatedProducts?: Array<{
    title: string;
    url: string;
    price?: string;
    imageUrl?: string;
  }>;
}

/**
 * Specialized scraper for e-commerce products
 */
export class EcommerceScraper extends BaseScraper {
  private ecommerceOptions: EcommerceScraperOptions;

  constructor(options: EcommerceScraperOptions = {}) {
    super(options);
    this.ecommerceOptions = {
      extractReviews: false,
      extractVariants: true,
      extractRelatedProducts: false,
      extractSpecifications: true,
      ...options,
    };
  }

  /**
   * Scrape an e-commerce product
   * @param url URL of the product
   * @returns Scraped product data
   */
  public async scrape(url: string): Promise<EcommerceScraperResult> {
    return this.scrapeWithCache<EcommerceScraperResult>(
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

          // Extract the product data
          const result = await this.extractProductData(page, targetUrl);
          return result;
        } finally {
          await page.close();
        }
      },
      {}
    );
  }

  /**
   * Extract product data from the page
   * @param page Puppeteer Page
   * @param url Original URL
   * @returns Extracted product data
   */
  private async extractProductData(page: Page, url: string): Promise<EcommerceScraperResult> {
    // Extract basic product information
    const title = await this.extractProductTitle(page);
    const content = await this.extractProductDescription(page);
    const html = await this.extractProductDescriptionHtml(page);
    const price = await this.extractPrice(page);
    const currency = await this.extractCurrency(page);
    const availability = await this.extractAvailability(page);
    const brand = await this.extractBrand(page);
    const sku = await this.extractSku(page);
    const imageUrls = await this.extractImageUrls(page);
    
    // Extract additional product information
    const { rating, reviewCount } = await this.extractRatingInfo(page);
    
    // Extract optional product information
    const variants = this.ecommerceOptions.extractVariants 
      ? await this.extractVariants(page) 
      : undefined;
    
    const specifications = this.ecommerceOptions.extractSpecifications 
      ? await this.extractSpecifications(page) 
      : undefined;
    
    const reviews = this.ecommerceOptions.extractReviews 
      ? await this.extractReviews(page) 
      : undefined;
    
    const relatedProducts = this.ecommerceOptions.extractRelatedProducts 
      ? await this.extractRelatedProducts(page) 
      : undefined;

    // Compile the result
    return {
      url,
      title,
      content,
      html,
      price,
      currency,
      availability,
      brand,
      sku,
      rating,
      reviewCount,
      imageUrls,
      variants,
      specifications,
      reviews,
      relatedProducts,
      markdown: '', // We don't convert to markdown for e-commerce products
      metadata: {
        price,
        currency,
        availability,
        brand,
        sku,
        rating,
        reviewCount,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Extract the product title
   * @param page Puppeteer Page
   * @returns Product title
   */
  private async extractProductTitle(page: Page): Promise<string> {
    // Try different selectors for product titles
    const selectors = [
      'h1',
      '.product-title',
      '.product-name',
      '[itemprop="name"]',
      '#productTitle',
      '.product-single__title',
    ];

    for (const selector of selectors) {
      const title = await this.extractText(page, selector);
      if (title) {
        return title;
      }
    }

    // Fallback to page title if no product title found
    return page.title();
  }

  /**
   * Extract the product description as plain text
   * @param page Puppeteer Page
   * @returns Product description as plain text
   */
  private async extractProductDescription(page: Page): Promise<string> {
    // Try different selectors for product descriptions
    const selectors = [
      '.product-description',
      '.description',
      '[itemprop="description"]',
      '#productDescription',
      '.product__description',
      '.product-single__description',
    ];

    for (const selector of selectors) {
      const description = await this.extractText(page, selector);
      if (description) {
        return description;
      }
    }

    // Fallback to meta description
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

    return '';
  }

  /**
   * Extract the product description as HTML
   * @param page Puppeteer Page
   * @returns Product description as HTML
   */
  private async extractProductDescriptionHtml(page: Page): Promise<string> {
    // Try different selectors for product descriptions
    const selectors = [
      '.product-description',
      '.description',
      '[itemprop="description"]',
      '#productDescription',
      '.product__description',
      '.product-single__description',
    ];

    for (const selector of selectors) {
      const html = await this.extractHtml(page, selector);
      if (html) {
        return html;
      }
    }

    return '';
  }

  /**
   * Extract the product price
   * @param page Puppeteer Page
   * @returns Product price as string
   */
  private async extractPrice(page: Page): Promise<string> {
    // Try different selectors for product prices
    const selectors = [
      '.price',
      '.product-price',
      '[itemprop="price"]',
      '#priceblock_ourprice',
      '.price__current',
      '.product-single__price',
      '.current-price',
      '.sale-price',
    ];

    for (const selector of selectors) {
      const price = await this.extractText(page, selector);
      if (price) {
        return price.trim();
      }
    }

    // Try to get price from meta tag
    try {
      const metaPrice = await page.$eval('meta[property="product:price:amount"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaPrice) {
        return metaPrice;
      }
    } catch {
      // Continue to next method
    }

    return 'N/A';
  }

  /**
   * Extract the currency
   * @param page Puppeteer Page
   * @returns Currency code or symbol
   */
  private async extractCurrency(page: Page): Promise<string | undefined> {
    // Try to get currency from meta tag
    try {
      const metaCurrency = await page.$eval('meta[property="product:price:currency"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaCurrency) {
        return metaCurrency;
      }
    } catch {
      // Continue to next method
    }

    // Try to extract currency symbol from price
    const price = await this.extractPrice(page);
    const currencySymbol = price.match(/[£$€¥]/);
    
    if (currencySymbol) {
      return currencySymbol[0];
    }

    return undefined;
  }

  /**
   * Check if the product is available
   * @param page Puppeteer Page
   * @returns Whether the product is available
   */
  private async extractAvailability(page: Page): Promise<boolean> {
    // Try different selectors for availability
    const availableSelectors = [
      '.in-stock',
      '[itemprop="availability"][content="InStock"]',
      '.product-available',
    ];

    const unavailableSelectors = [
      '.out-of-stock',
      '[itemprop="availability"][content="OutOfStock"]',
      '.product-unavailable',
    ];

    // Check for available indicators
    for (const selector of availableSelectors) {
      const exists = await this.waitForSelector(page, selector, 100);
      if (exists) {
        return true;
      }
    }

    // Check for unavailable indicators
    for (const selector of unavailableSelectors) {
      const exists = await this.waitForSelector(page, selector, 100);
      if (exists) {
        return false;
      }
    }

    // Try to get availability from meta tag
    try {
      const metaAvailability = await page.$eval('meta[property="product:availability"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaAvailability) {
        return metaAvailability.toLowerCase().includes('instock');
      }
    } catch {
      // Continue to next method
    }

    // Default to true if we can't determine availability
    return true;
  }

  /**
   * Extract the product brand
   * @param page Puppeteer Page
   * @returns Brand name
   */
  private async extractBrand(page: Page): Promise<string | undefined> {
    // Try different selectors for brand
    const selectors = [
      '.brand',
      '[itemprop="brand"]',
      '.product-brand',
      '.product-meta__vendor',
    ];

    for (const selector of selectors) {
      const brand = await this.extractText(page, selector);
      if (brand) {
        return brand;
      }
    }

    // Try to get brand from meta tag
    try {
      const metaBrand = await page.$eval('meta[property="product:brand"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaBrand) {
        return metaBrand;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract the product SKU
   * @param page Puppeteer Page
   * @returns SKU
   */
  private async extractSku(page: Page): Promise<string | undefined> {
    // Try different selectors for SKU
    const selectors = [
      '[itemprop="sku"]',
      '.sku',
      '.product-sku',
      '#product-sku',
    ];

    for (const selector of selectors) {
      const sku = await this.extractText(page, selector);
      if (sku) {
        return sku;
      }
    }

    // Try to get SKU from meta tag
    try {
      const metaSku = await page.$eval('meta[property="product:retailer_item_id"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (metaSku) {
        return metaSku;
      }
    } catch {
      // Continue to next method
    }

    return undefined;
  }

  /**
   * Extract product image URLs
   * @param page Puppeteer Page
   * @returns Array of image URLs
   */
  private async extractImageUrls(page: Page): Promise<string[]> {
    // Try different selectors for product images
    const selectors = [
      '.product-image img',
      '.product-gallery img',
      '[itemprop="image"]',
      '.product__photo img',
      '.product-single__photo',
    ];

    for (const selector of selectors) {
      try {
        const imageUrls = await page.$$eval(selector, (images) => 
          images.map(img => img.getAttribute('src') || img.getAttribute('data-src') || '')
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

    // Try to find the main image
    try {
      const mainImage = await page.$eval('meta[property="og:image"]', el => 
        el.getAttribute('content') || ''
      );
      
      if (mainImage) {
        return [mainImage];
      }
    } catch {
      // Continue to next method
    }

    return [];
  }

  /**
   * Extract product rating information
   * @param page Puppeteer Page
   * @returns Rating and review count
   */
  private async extractRatingInfo(page: Page): Promise<{ rating?: number; reviewCount?: number }> {
    let rating: number | undefined;
    let reviewCount: number | undefined;

    // Try different selectors for rating
    const ratingSelectors = [
      '[itemprop="ratingValue"]',
      '.rating',
      '.product-rating',
      '.star-rating',
    ];

    for (const selector of ratingSelectors) {
      const ratingText = await this.extractText(page, selector);
      if (ratingText) {
        const ratingValue = parseFloat(ratingText);
        if (!isNaN(ratingValue)) {
          rating = ratingValue;
          break;
        }
      }
    }

    // Try different selectors for review count
    const reviewCountSelectors = [
      '[itemprop="reviewCount"]',
      '.review-count',
      '.rating-count',
    ];

    for (const selector of reviewCountSelectors) {
      const countText = await this.extractText(page, selector);
      if (countText) {
        // Try to extract a number from the text
        const match = countText.match(/\d+/);
        if (match) {
          reviewCount = parseInt(match[0], 10);
          break;
        }
      }
    }

    return { rating, reviewCount };
  }

  /**
   * Extract product variants
   * @param page Puppeteer Page
   * @returns Array of product variants
   */
  private async extractVariants(page: Page): Promise<ProductVariant[] | undefined> {
    const variants: ProductVariant[] = [];

    // Try different selectors for variant containers
    const variantContainerSelectors = [
      '.product-variants',
      '.product-options',
      '.swatch',
      '.selector-wrapper',
    ];

    for (const containerSelector of variantContainerSelectors) {
      try {
        // Check if the container exists
        const containerExists = await this.waitForSelector(page, containerSelector, 100);
        if (!containerExists) continue;

        // Extract variant information
        const variantData = await page.$$eval(`${containerSelector}`, (containers) => {
          return containers.map(container => {
            // Try to find the variant name
            const nameEl = container.querySelector('.option-name, .option-title, label');
            const name = nameEl ? nameEl.textContent?.trim() || '' : '';

            // Try to find the variant values
            const valueEls = container.querySelectorAll('.option-value, option, .swatch-element');
            const values = Array.from(valueEls).map(el => {
              const value = el.textContent?.trim() || '';
              const available = !el.classList.contains('soldout') && !el.hasAttribute('disabled');
              
              // Try to find price for this variant
              const priceEl = el.querySelector('.price, .money');
              const price = priceEl ? priceEl.textContent?.trim() || '' : '';
              
              return { value, available, price };
            });

            return { name, values };
          });
        });

        // Format the variant data
        for (const variant of variantData) {
          if (variant.name && variant.values.length > 0) {
            for (const value of variant.values) {
              variants.push({
                name: variant.name,
                value: value.value,
                price: value.price || undefined,
                available: value.available,
              });
            }
          }
        }

        if (variants.length > 0) {
          return variants;
        }
      } catch {
        // Continue to next selector
      }
    }

    return variants.length > 0 ? variants : undefined;
  }

  /**
   * Extract product specifications
   * @param page Puppeteer Page
   * @returns Array of product specifications
   */
  private async extractSpecifications(page: Page): Promise<ProductSpecification[] | undefined> {
    const specifications: ProductSpecification[] = [];

    // Try different selectors for specification tables
    const tableSelectors = [
      '.product-specs',
      '.specifications',
      '.tech-specs',
      '.product-attributes',
    ];

    for (const tableSelector of tableSelectors) {
      try {
        // Check if the table exists
        const tableExists = await this.waitForSelector(page, tableSelector, 100);
        if (!tableExists) continue;

        // Extract specification rows
        const specRows = await page.$$eval(`${tableSelector} tr, ${tableSelector} .spec-row`, (rows) => {
          return rows.map(row => {
            const nameEl = row.querySelector('th, .spec-name, .name');
            const valueEl = row.querySelector('td, .spec-value, .value');
            
            const name = nameEl ? nameEl.textContent?.trim() || '' : '';
            const value = valueEl ? valueEl.textContent?.trim() || '' : '';
            
            return { name, value };
          });
        });

        // Add valid specifications
        for (const spec of specRows) {
          if (spec.name && spec.value) {
            specifications.push({
              name: spec.name,
              value: spec.value,
            });
          }
        }

        if (specifications.length > 0) {
          return specifications;
        }
      } catch {
        // Continue to next selector
      }
    }

    // Try to extract specifications from definition lists
    const dlSelectors = [
      '.product-specs dl',
      '.specifications dl',
      '.tech-specs dl',
    ];

    for (const dlSelector of dlSelectors) {
      try {
        // Check if the definition list exists
        const dlExists = await this.waitForSelector(page, dlSelector, 100);
        if (!dlExists) continue;

        // Extract specification pairs
        const specPairs = await page.$$eval(`${dlSelector} dt, ${dlSelector} dd`, (elements) => {
          const pairs = [];
          
          for (let i = 0; i < elements.length - 1; i += 2) {
            const dt = elements[i];
            const dd = elements[i + 1];
            
            if (dt.tagName === 'DT' && dd.tagName === 'DD') {
              pairs.push({
                name: dt.textContent?.trim() || '',
                value: dd.textContent?.trim() || '',
              });
            }
          }
          
          return pairs;
        });

        // Add valid specifications
        for (const spec of specPairs) {
          if (spec.name && spec.value) {
            specifications.push({
              name: spec.name,
              value: spec.value,
            });
          }
        }

        if (specifications.length > 0) {
          return specifications;
        }
      } catch {
        // Continue to next selector
      }
    }

    return specifications.length > 0 ? specifications : undefined;
  }

  /**
   * Extract product reviews
   * @param page Puppeteer Page
   * @returns Array of product reviews
   */
  private async extractReviews(page: Page): Promise<ProductReview[] | undefined> {
    const reviews: ProductReview[] = [];

    // Try different selectors for review containers
    const reviewContainerSelectors = [
      '.product-reviews',
      '.reviews',
      '#reviews',
      '.review-list',
    ];

    for (const containerSelector of reviewContainerSelectors) {
      try {
        // Check if the container exists
        const containerExists = await this.waitForSelector(page, containerSelector, 100);
        if (!containerExists) continue;

        // Extract review information
        const reviewData = await page.$$eval(`${containerSelector} .review, ${containerSelector} .review-item`, (reviewEls) => {
          return reviewEls.map(reviewEl => {
            // Extract author
            const authorEl = reviewEl.querySelector('.review-author, .author, [itemprop="author"]');
            const author = authorEl ? authorEl.textContent?.trim() || '' : '';
            
            // Extract rating
            const ratingEl = reviewEl.querySelector('.review-rating, .rating, [itemprop="ratingValue"]');
            let rating = 0;
            
            if (ratingEl) {
              // Try to extract rating from text
              const ratingText = ratingEl.textContent?.trim() || '';
              const ratingValue = parseFloat(ratingText);
              
              if (!isNaN(ratingValue)) {
                rating = ratingValue;
              } else {
                // Try to count stars
                const stars = ratingEl.querySelectorAll('.star.filled, .star.active, .fa-star');
                rating = stars.length;
              }
            }
            
            // Extract date
            const dateEl = reviewEl.querySelector('.review-date, .date, [itemprop="datePublished"]');
            const date = dateEl ? dateEl.textContent?.trim() || '' : '';
            
            // Extract title
            const titleEl = reviewEl.querySelector('.review-title, .title, [itemprop="name"]');
            const title = titleEl ? titleEl.textContent?.trim() || '' : '';
            
            // Extract content
            const contentEl = reviewEl.querySelector('.review-content, .content, [itemprop="reviewBody"]');
            const content = contentEl ? contentEl.textContent?.trim() || '' : '';
            
            return { author, rating, date, title, content };
          });
        });

        // Add valid reviews
        for (const review of reviewData) {
          if (review.content && review.rating > 0) {
            reviews.push({
              author: review.author || undefined,
              rating: review.rating,
              date: review.date || undefined,
              title: review.title || undefined,
              content: review.content,
            });
          }
        }

        if (reviews.length > 0) {
          return reviews;
        }
      } catch {
        // Continue to next selector
      }
    }

    return reviews.length > 0 ? reviews : undefined;
  }

  /**
   * Extract related products
   * @param page Puppeteer Page
   * @returns Array of related products
   */
  private async extractRelatedProducts(page: Page): Promise<Array<{
    title: string;
    url: string;
    price?: string;
    imageUrl?: string;
  }> | undefined> {
    const relatedProducts: Array<{
      title: string;
      url: string;
      price?: string;
      imageUrl?: string;
    }> = [];

    // Try different selectors for related product containers
    const containerSelectors = [
      '.related-products',
      '.product-recommendations',
      '.similar-products',
      '#related-products',
    ];

    for (const containerSelector of containerSelectors) {
      try {
        // Check if the container exists
        const containerExists = await this.waitForSelector(page, containerSelector, 100);
        if (!containerExists) continue;

        // Extract related product information
        const productData = await page.$$eval(`${containerSelector} .product, ${containerSelector} .product-item`, (productEls) => {
          return productEls.map(productEl => {
            // Extract title and URL
            const linkEl = productEl.querySelector('a.product-title, a.product-name, a.product-link, a');
            const title = linkEl ? linkEl.textContent?.trim() || '' : '';
            const url = linkEl ? linkEl.getAttribute('href') || '' : '';
            
            // Extract price
            const priceEl = productEl.querySelector('.price, .product-price, .money');
            const price = priceEl ? priceEl.textContent?.trim() || '' : '';
            
            // Extract image URL
            const imageEl = productEl.querySelector('img');
            const imageUrl = imageEl ? imageEl.getAttribute('src') || imageEl.getAttribute('data-src') || '' : '';
            
            return { title, url, price, imageUrl };
          });
        });

        // Add valid related products
        for (const product of productData) {
          if (product.title && product.url) {
            relatedProducts.push({
              title: product.title,
              url: product.url.startsWith('http') ? product.url : new URL(product.url, page.url()).href,
              price: product.price || undefined,
              imageUrl: product.imageUrl || undefined,
            });
          }
        }

        if (relatedProducts.length > 0) {
          return relatedProducts;
        }
      } catch {
        // Continue to next selector
      }
    }

    return relatedProducts.length > 0 ? relatedProducts : undefined;
  }
} 