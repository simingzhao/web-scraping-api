import { kv } from '@vercel/kv';

/**
 * Extract domain from URL
 * @param url URL to extract domain from
 * @returns Domain name
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
}

/**
 * Interface for rate limit information
 */
export interface RateLimitInfo {
  limited: boolean;
  remaining: number;
  reset: number;
  current: number;
  max: number;
  resetInSeconds: number;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT = {
  maxRequests: 60, // Maximum number of requests per window
  windowMs: 60000, // Window size in milliseconds (1 minute)
};

/**
 * Check if a domain is rate limited
 * @param domain Domain to check
 * @param maxRequests Maximum number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns Rate limit information
 */
export async function checkRateLimit(
  domain: string,
  maxRequests = DEFAULT_RATE_LIMIT.maxRequests,
  windowMs = DEFAULT_RATE_LIMIT.windowMs
): Promise<RateLimitInfo> {
  try {
    // Get the current rate limit information from KV
    const key = `ratelimit:${domain}`;
    const rateLimitData = await kv.get<{ count: number; reset: number }>(key);

    // If no rate limit data exists or the reset time has passed, return not limited
    if (!rateLimitData || Date.now() > rateLimitData.reset) {
      return {
        limited: false,
        remaining: maxRequests,
        reset: Date.now() + windowMs,
        current: 0,
        max: maxRequests,
        resetInSeconds: Math.ceil(windowMs / 1000),
      };
    }

    // Check if the rate limit has been exceeded
    const remaining = maxRequests - rateLimitData.count;
    const resetInSeconds = Math.ceil((rateLimitData.reset - Date.now()) / 1000);

    return {
      limited: remaining <= 0,
      remaining,
      reset: rateLimitData.reset,
      current: rateLimitData.count,
      max: maxRequests,
      resetInSeconds,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    
    // If there's an error, default to not limited
    return {
      limited: false,
      remaining: maxRequests,
      reset: Date.now() + windowMs,
      current: 0,
      max: maxRequests,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }
}

/**
 * Increment the rate limit counter for a domain
 * @param domain Domain to increment counter for
 * @param maxRequests Maximum number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns Rate limit information after incrementing
 */
export async function incrementRateLimit(
  domain: string,
  maxRequests = DEFAULT_RATE_LIMIT.maxRequests,
  windowMs = DEFAULT_RATE_LIMIT.windowMs
): Promise<RateLimitInfo> {
  try {
    const key = `ratelimit:${domain}`;
    const now = Date.now();
    
    // Get the current rate limit information
    const rateLimitData = await kv.get<{ count: number; reset: number }>(key);
    
    // If no rate limit data exists or the reset time has passed, create a new entry
    if (!rateLimitData || now > rateLimitData.reset) {
      const reset = now + windowMs;
      await kv.set(key, { count: 1, reset }, { ex: Math.ceil(windowMs / 1000) });
      
      return {
        limited: false,
        remaining: maxRequests - 1,
        reset,
        current: 1,
        max: maxRequests,
        resetInSeconds: Math.ceil(windowMs / 1000),
      };
    }
    
    // Increment the counter
    const count = rateLimitData.count + 1;
    const reset = rateLimitData.reset;
    const remaining = maxRequests - count;
    const resetInSeconds = Math.ceil((reset - now) / 1000);
    
    // Update the rate limit data in KV
    await kv.set(key, { count, reset }, { ex: resetInSeconds });
    
    return {
      limited: remaining <= 0,
      remaining,
      reset,
      current: count,
      max: maxRequests,
      resetInSeconds,
    };
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
    
    // If there's an error, default to not limited
    return {
      limited: false,
      remaining: maxRequests,
      reset: Date.now() + windowMs,
      current: 0,
      max: maxRequests,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }
}

/**
 * Check and increment rate limit in one operation
 * @param domain Domain to check and increment
 * @param maxRequests Maximum number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns Rate limit information after checking and incrementing
 */
export async function checkAndIncrementRateLimit(
  domain: string,
  maxRequests = DEFAULT_RATE_LIMIT.maxRequests,
  windowMs = DEFAULT_RATE_LIMIT.windowMs
): Promise<RateLimitInfo> {
  // First check if already rate limited
  const rateLimitInfo = await checkRateLimit(domain, maxRequests, windowMs);
  
  // If already limited, return without incrementing
  if (rateLimitInfo.limited) {
    return rateLimitInfo;
  }
  
  // Otherwise, increment and return the updated info
  return incrementRateLimit(domain, maxRequests, windowMs);
}

/**
 * Reset the rate limit for a specific identifier
 * @param identifier Domain or IP to reset
 * @param namespace Optional namespace for the rate limit key
 * @returns True if the rate limit was successfully reset
 */
export async function resetRateLimit(
  identifier: string,
  namespace = 'ratelimit'
): Promise<boolean> {
  const key = `${namespace}:${identifier}`;
  
  try {
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
} 