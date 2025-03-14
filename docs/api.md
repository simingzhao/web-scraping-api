# Web Scraping API Documentation

This document provides comprehensive documentation for the Web Scraping API service.

## Base URL

```
https://your-domain.vercel.app/api
```

## Authentication

Currently, the API uses rate limiting based on IP addresses. Authentication will be added in future versions.

## Rate Limiting

- 100 requests per hour per IP address
- Rate limit headers are included in the response:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Endpoints

### Scrape Content

```http
POST /scrape/{type}
```

Scrapes content from a specified URL and returns it in the requested format.

#### Path Parameters

| Parameter | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| type      | string | Type of content to scrape (news/ecommerce/techdocs) |

#### Request Body

```json
{
  "url": "https://example.com",
  "format": "markdown",
  "force": false
}
```

| Field  | Type    | Required | Default   | Description                                    |
|--------|---------|----------|-----------|------------------------------------------------|
| url    | string  | Yes      | -         | The URL to scrape                             |
| format | string  | No       | markdown  | Output format (html/markdown/text)            |
| force  | boolean | No       | false     | Force fresh scrape instead of using cache     |

#### Response

```json
{
  "data": "Scraped content in requested format",
  "cached": true
}
```

| Field  | Type    | Description                                    |
|--------|---------|------------------------------------------------|
| data   | string  | The scraped content in requested format        |
| cached | boolean | Whether the response was served from cache     |

#### Error Responses

```json
{
  "error": "Error message"
}
```

| Status Code | Description                                    |
|-------------|------------------------------------------------|
| 400         | Invalid request parameters                     |
| 405         | Method not allowed (only POST is supported)    |
| 429         | Rate limit exceeded                           |
| 500         | Server error or scraping failed               |

## Examples

### Scrape a News Article

```bash
curl -X POST https://your-domain.vercel.app/api/scrape/news \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "format": "markdown"
  }'
```

### Force Fresh Scrape of Product Page

```bash
curl -X POST https://your-domain.vercel.app/api/scrape/ecommerce \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/product",
    "format": "html",
    "force": true
  }'
```

## N8N Integration

The API is compatible with N8N workflows. To use it in N8N:

1. Add an HTTP Request node
2. Set method to POST
3. Set URL to your API endpoint
4. Add request body with required parameters
5. Connect to subsequent nodes for processing the scraped content

Example N8N workflow configuration:

```json
{
  "node": "HTTP Request",
  "parameters": {
    "method": "POST",
    "url": "https://your-domain.vercel.app/api/scrape/news",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "url": "{{$node.previous.data.url}}",
      "format": "markdown"
    }
  }
}
```

## Caching

- Scraped content is cached for 24 hours by default
- Use `force: true` to bypass cache and get fresh content
- Cache keys are generated based on URL and format
- Cache can be cleared by deploying a new version of the API

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

```json
{
  "error": "Specific error message"
}
```

Common error scenarios:
- Invalid URL format
- Rate limit exceeded
- Target website blocking scraping
- Network timeout
- Invalid output format

## Best Practices

1. Respect robots.txt of target websites
2. Use appropriate scraping intervals
3. Cache results when possible
4. Handle rate limits gracefully
5. Set reasonable timeouts
6. Use specific scraper types for better results

## Future Enhancements

1. API key authentication
2. Custom scraping rules
3. Webhook notifications
4. Batch scraping
5. Advanced proxy rotation
6. Custom caching duration 