import { kv } from '@vercel/kv';

// Default cache TTL in seconds
const DEFAULT_CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS) || 3600;

/**
 * Interface for cache options
 */
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Optional namespace for the cache key
}

/**
 * Type for scrape parameters
 */
type ScrapeParams = Record<string, unknown>;

/**
 * Generate a cache key from a URL and optional parameters
 * @param url The URL being scraped
 * @param params Additional parameters that affect the scraping result
 * @param namespace Optional namespace for the cache key
 * @returns A string cache key
 */
export function generateCacheKey(
  url: string,
  params: ScrapeParams = {},
  namespace = 'scrape'
): string {
  // Create a stable representation of the params object
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');

  // Create a hash of the URL and params
  const key = `${namespace}:${url}${paramsString ? `:${paramsString}` : ''}`;
  
  // Return a URL-safe key by encoding it
  return Buffer.from(key).toString('base64').replace(/[+/=]/g, '_');
}

/**
 * Get a value from the cache
 * @param key The cache key
 * @returns The cached value or null if not found
 */
export async function getCachedValue<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key);
  } catch (error) {
    console.error('Error retrieving from cache:', error);
    return null;
  }
}

/**
 * Set a value in the cache
 * @param key The cache key
 * @param value The value to cache
 * @param options Cache options including TTL
 * @returns True if the value was successfully cached
 */
export async function setCachedValue<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const { ttl = DEFAULT_CACHE_TTL } = options;
  
  try {
    await kv.set(key, value, { ex: ttl });
    return true;
  } catch (error) {
    console.error('Error setting cache value:', error);
    return false;
  }
}

/**
 * Delete a value from the cache
 * @param key The cache key
 * @returns True if the value was successfully deleted
 */
export async function deleteCachedValue(key: string): Promise<boolean> {
  try {
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting cache value:', error);
    return false;
  }
}

/**
 * Get or set a value in the cache using a factory function
 * @param key The cache key
 * @param factory A function that produces the value if not in cache
 * @param options Cache options including TTL
 * @returns The cached or newly produced value
 */
export async function getOrSetCachedValue<T>(
  key: string,
  factory: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get the value from cache first
  const cachedValue = await getCachedValue<T>(key);
  
  // If found in cache, return it
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  // Otherwise, generate the value
  const value = await factory();
  
  // Cache the generated value
  await setCachedValue(key, value, options);
  
  return value;
}

/**
 * Wrapper function to cache the result of scraping a URL
 * @param url The URL to scrape
 * @param scrapeFunction The function that performs the scraping
 * @param params Additional parameters that affect the scraping result
 * @param options Cache options
 * @returns The scraped data, either from cache or freshly scraped
 */
export async function cachedScrape<T>(
  url: string,
  scrapeFunction: (url: string, params: ScrapeParams) => Promise<T>,
  params: ScrapeParams = {},
  options: CacheOptions = {}
): Promise<T> {
  const { namespace = 'scrape', ttl = DEFAULT_CACHE_TTL } = options;
  
  // Generate a cache key for this scrape operation
  const cacheKey = generateCacheKey(url, params, namespace);
  
  // Use the getOrSetCachedValue function to handle the caching logic
  return getOrSetCachedValue(
    cacheKey,
    () => scrapeFunction(url, params),
    { ttl }
  );
} 