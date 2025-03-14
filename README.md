# Serverless Web Scraping API

A powerful, serverless web scraping API built with Next.js, Puppeteer, and Vercel KV for caching. This service provides endpoints for scraping various types of content including news articles, e-commerce products, and technical documentation.

## Features

- **Serverless Architecture**: Runs on Vercel's serverless functions
- **Multiple Scraper Types**: Specialized scrapers for different content types
- **Caching**: Results cached in Vercel KV for improved performance
- **Rate Limiting**: Prevents abuse and respects target websites
- **Markdown Conversion**: Returns content in clean, portable markdown format
- **Proxy Support**: Optional proxy rotation for avoiding IP blocks
- **N8N Compatible**: Designed to work with N8N workflows

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Vercel account (for KV database and deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web-scraping-api.git
cd web-scraping-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Create a Vercel KV database through the Vercel dashboard
   - Add the KV connection strings to your `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the UI.

## API Usage

### Basic Endpoint Structure

```
/api/scrape/[type]?url=[target-url]&options=[options]
```

Where:
- `[type]` is one of: `news`, `ecommerce`, `techdocs`, or `generic`
- `[target-url]` is the URL you want to scrape
- `[options]` are additional scraping options (JSON encoded)

### Example Request

```bash
curl -X GET "http://localhost:3000/api/scrape/news?url=https://example.com/article"
```

## Deployment

Deploy to Vercel using the Vercel CLI or by connecting your GitHub repository to Vercel for automatic deployments.

```bash
vercel
```

## License

MIT
