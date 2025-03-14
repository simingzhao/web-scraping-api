/**
 * Custom error types for the scraping API
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SCRAPING_ERROR = 'SCRAPING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
}

/**
 * Custom error class for the scraping API
 */
export class ScrapingError extends Error {
  type: ErrorType;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_ERROR,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ScrapingError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Convert the error to a JSON object
   */
  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: this.message,
      type: this.type,
      details: this.details,
      timestamp: Date.now(),
    };
  }
}

/**
 * Create a validation error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createValidationError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.VALIDATION_ERROR, 400, details);
}

/**
 * Create a rate limit error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createRateLimitError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.RATE_LIMIT_ERROR, 429, details);
}

/**
 * Create a timeout error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createTimeoutError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.TIMEOUT_ERROR, 408, details);
}

/**
 * Create a scraping error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createScrapingError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.SCRAPING_ERROR, 500, details);
}

/**
 * Create a network error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createNetworkError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.NETWORK_ERROR, 503, details);
}

/**
 * Create a browser error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createBrowserError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.BROWSER_ERROR, 500, details);
}

/**
 * Create a not found error
 * @param message Error message
 * @param details Additional error details
 * @returns ScrapingError instance
 */
export function createNotFoundError(
  message: string,
  details?: Record<string, unknown>
): ScrapingError {
  return new ScrapingError(message, ErrorType.NOT_FOUND_ERROR, 404, details);
}

/**
 * Handle an error and convert it to a ScrapingError
 * @param error Error to handle
 * @returns ScrapingError instance
 */
export function handleError(error: unknown): ScrapingError {
  if (error instanceof ScrapingError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types based on message or name
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return createTimeoutError(`Operation timed out: ${error.message}`);
    }

    if (error.message.includes('net::') || error.message.includes('network')) {
      return createNetworkError(`Network error: ${error.message}`);
    }

    if (error.message.includes('browser') || error.message.includes('puppeteer')) {
      return createBrowserError(`Browser error: ${error.message}`);
    }

    // Default to internal error
    return new ScrapingError(
      `Internal error: ${error.message}`,
      ErrorType.INTERNAL_ERROR,
      500
    );
  }

  // Handle unknown errors
  return new ScrapingError(
    'An unknown error occurred',
    ErrorType.INTERNAL_ERROR,
    500
  );
}

/**
 * Execute a function with a timeout
 * @param fn Function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Message for timeout error
 * @returns Promise that resolves with the function result or rejects with a timeout error
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(createTimeoutError(timeoutMessage, { timeoutMs }));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(handleError(error));
      });
  });
} 