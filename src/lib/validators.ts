/**
 * URL validation options
 */
export interface UrlValidationOptions {
  allowedProtocols?: string[];
  allowedDomains?: string[];
  blockedDomains?: string[];
  requireHttps?: boolean;
}

/**
 * Default URL validation options
 */
const DEFAULT_URL_VALIDATION_OPTIONS: UrlValidationOptions = {
  allowedProtocols: ['http', 'https'],
  allowedDomains: [],
  blockedDomains: [],
  requireHttps: false,
};

/**
 * Validate a URL
 * @param url URL to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateUrl(
  url: string,
  options: UrlValidationOptions = {}
): { valid: boolean; reason?: string } {
  // Merge default options with provided options
  const mergedOptions = { ...DEFAULT_URL_VALIDATION_OPTIONS, ...options };

  try {
    // Parse the URL
    const parsedUrl = new URL(url);

    // Check protocol
    const protocol = parsedUrl.protocol.replace(':', '');
    if (
      mergedOptions.allowedProtocols &&
      mergedOptions.allowedProtocols.length > 0 &&
      !mergedOptions.allowedProtocols.includes(protocol)
    ) {
      return {
        valid: false,
        reason: `Protocol "${protocol}" is not allowed. Allowed protocols: ${mergedOptions.allowedProtocols.join(
          ', '
        )}`,
      };
    }

    // Check if HTTPS is required
    if (mergedOptions.requireHttps && protocol !== 'https') {
      return {
        valid: false,
        reason: 'HTTPS is required',
      };
    }

    // Extract domain
    const domain = parsedUrl.hostname;

    // Check allowed domains
    if (
      mergedOptions.allowedDomains &&
      mergedOptions.allowedDomains.length > 0 &&
      !mergedOptions.allowedDomains.some((allowedDomain) =>
        domain.endsWith(allowedDomain)
      )
    ) {
      return {
        valid: false,
        reason: `Domain "${domain}" is not allowed`,
      };
    }

    // Check blocked domains
    if (
      mergedOptions.blockedDomains &&
      mergedOptions.blockedDomains.length > 0 &&
      mergedOptions.blockedDomains.some((blockedDomain) =>
        domain.endsWith(blockedDomain)
      )
    ) {
      return {
        valid: false,
        reason: `Domain "${domain}" is blocked`,
      };
    }

    return { valid: true };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return {
      valid: false,
      reason: 'Invalid URL format',
    };
  }
}

/**
 * Scraper request validation options
 */
export interface ScraperRequestValidationOptions {
  urlValidationOptions?: UrlValidationOptions;
  maxTimeout?: number;
  allowedScraperTypes?: string[];
}

/**
 * Default scraper request validation options
 */
const DEFAULT_SCRAPER_REQUEST_VALIDATION_OPTIONS: ScraperRequestValidationOptions = {
  urlValidationOptions: DEFAULT_URL_VALIDATION_OPTIONS,
  maxTimeout: 60000, // 60 seconds
  allowedScraperTypes: ['news', 'ecommerce', 'techdocs', 'generic'],
};

/**
 * Validate a scraper request
 * @param request Scraper request to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateScraperRequest(
  request: {
    url: string;
    type: string;
    options?: {
      timeout?: number;
      [key: string]: unknown;
    };
  },
  options: ScraperRequestValidationOptions = {}
): { valid: boolean; reason?: string } {
  // Merge default options with provided options
  const mergedOptions = {
    ...DEFAULT_SCRAPER_REQUEST_VALIDATION_OPTIONS,
    ...options,
  };

  // Validate URL
  const urlValidation = validateUrl(
    request.url,
    mergedOptions.urlValidationOptions
  );
  if (!urlValidation.valid) {
    return urlValidation;
  }

  // Validate scraper type
  if (
    mergedOptions.allowedScraperTypes &&
    mergedOptions.allowedScraperTypes.length > 0 &&
    !mergedOptions.allowedScraperTypes.includes(request.type)
  ) {
    return {
      valid: false,
      reason: `Scraper type "${request.type}" is not allowed. Allowed types: ${mergedOptions.allowedScraperTypes.join(
        ', '
      )}`,
    };
  }

  // Validate timeout
  if (
    request.options?.timeout &&
    mergedOptions.maxTimeout &&
    request.options.timeout > mergedOptions.maxTimeout
  ) {
    return {
      valid: false,
      reason: `Timeout value ${request.options.timeout} exceeds maximum allowed timeout of ${mergedOptions.maxTimeout}`,
    };
  }

  return { valid: true };
} 