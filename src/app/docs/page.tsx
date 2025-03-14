import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">API Documentation</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Contents</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#introduction" className="text-blue-600 hover:underline">Introduction</a>
                </li>
                <li>
                  <a href="#authentication" className="text-blue-600 hover:underline">Authentication</a>
                </li>
                <li>
                  <a href="#endpoints" className="text-blue-600 hover:underline">Endpoints</a>
                </li>
                <li>
                  <a href="#scraper-types" className="text-blue-600 hover:underline">Scraper Types</a>
                  <ul className="pl-4 mt-2 space-y-2">
                    <li>
                      <a href="#news" className="text-blue-600 hover:underline">News</a>
                    </li>
                    <li>
                      <a href="#ecommerce" className="text-blue-600 hover:underline">E-commerce</a>
                    </li>
                    <li>
                      <a href="#techdocs" className="text-blue-600 hover:underline">Technical Documentation</a>
                    </li>
                    <li>
                      <a href="#generic" className="text-blue-600 hover:underline">Generic</a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a href="#options" className="text-blue-600 hover:underline">Options</a>
                </li>
                <li>
                  <a href="#rate-limits" className="text-blue-600 hover:underline">Rate Limits</a>
                </li>
                <li>
                  <a href="#errors" className="text-blue-600 hover:underline">Errors</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <section id="introduction" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <div className="card">
              <p className="mb-4">
                The Web Scraping API allows you to extract structured data from websites. 
                It supports various types of content including news articles, e-commerce products, 
                and technical documentation.
              </p>
              <p>
                Before using this API, please ensure you have the right to scrape the target website 
                and that you comply with the website&apos;s terms of service and robots.txt file.
              </p>
            </div>
          </section>
          
          <section id="authentication" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Authentication</h2>
            <div className="card">
              <p className="mb-4">
                To use the API, you need to include your API key in the request headers:
              </p>
              <pre className="code-block mb-4">
{`// Include your API key in the request headers
const headers = {
  &apos;Content-Type&apos;: &apos;application/json&apos;,
  &apos;X-API-Key&apos;: &apos;your-api-key&apos;
};`}
              </pre>
              <p>
                You can obtain an API key by <Link href="/contact" className="text-blue-600 hover:underline">contacting us</Link>.
              </p>
            </div>
          </section>
          
          <section id="endpoints" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Endpoints</h2>
            <div className="card">
              <h3 className="text-xl font-bold mb-4">POST /api/scrape</h3>
              <p className="mb-4">
                This endpoint allows you to scrape a website and extract structured data.
              </p>
              <h4 className="font-bold mb-2">Request Body</h4>
              <pre className="code-block mb-4">
{`{
  "url": "https://example.com/article",
  "type": "news",
  "options": {
    "extractImages": true,
    "extractAuthors": true,
    "timeout": 30000
  }
}`}
              </pre>
              <h4 className="font-bold mb-2">Response</h4>
              <pre className="code-block">
{`{
  "title": "Example Article Title",
  "url": "https://example.com/article",
  "content": "The article content in HTML or Markdown format...",
  "authors": ["John Doe", "Jane Smith"],
  "publishedDate": "2023-03-15T12:00:00Z",
  "imageUrl": "https://example.com/image.jpg"
}`}
              </pre>
            </div>
          </section>
          
          <section id="scraper-types" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Scraper Types</h2>
            
            <section id="news" className="mb-8">
              <h3 className="text-xl font-bold mb-4">News</h3>
              <div className="card">
                <p className="mb-4">
                  The news scraper is designed to extract content from news articles and blog posts.
                </p>
                <h4 className="font-bold mb-2">Options</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><code>extractComments</code> (boolean): Extract user comments if available</li>
                  <li><code>extractImages</code> (boolean): Extract images from the article</li>
                  <li><code>extractAuthors</code> (boolean): Extract author information</li>
                  <li><code>extractPublishedDate</code> (boolean): Extract the publication date</li>
                </ul>
                <h4 className="font-bold mb-2">Response Format</h4>
                <pre className="code-block">
{`{
  "title": "Article Title",
  "url": "https://example.com/article",
  "content": "Article content in HTML format...",
  "authors": ["Author Name"],
  "publishedDate": "2023-03-15T12:00:00Z",
  "imageUrl": "https://example.com/image.jpg",
  "comments": [
    {
      "author": "Commenter Name",
      "content": "Comment content...",
      "date": "2023-03-15T14:30:00Z"
    }
  ]
}`}
                </pre>
              </div>
            </section>
            
            <section id="ecommerce" className="mb-8">
              <h3 className="text-xl font-bold mb-4">E-commerce</h3>
              <div className="card">
                <p className="mb-4">
                  The e-commerce scraper is designed to extract product information from online stores.
                </p>
                <h4 className="font-bold mb-2">Options</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><code>extractReviews</code> (boolean): Extract product reviews</li>
                  <li><code>extractVariants</code> (boolean): Extract product variants</li>
                  <li><code>extractRelatedProducts</code> (boolean): Extract related products</li>
                  <li><code>extractSpecifications</code> (boolean): Extract product specifications</li>
                </ul>
                <h4 className="font-bold mb-2">Response Format</h4>
                <pre className="code-block">
{`{
  "title": "Product Name",
  "url": "https://example.com/product",
  "price": 99.99,
  "currency": "$",
  "description": "Product description...",
  "brand": "Brand Name",
  "availability": "In Stock",
  "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "specifications": [
    { "name": "Color", "value": "Black" },
    { "name": "Weight", "value": "2.5 kg" }
  ],
  "variants": [
    { "name": "Size", "options": ["S", "M", "L"] },
    { "name": "Color", "options": ["Red", "Blue", "Green"] }
  ],
  "reviews": [
    {
      "author": "Reviewer Name",
      "rating": 4.5,
      "content": "Review content...",
      "date": "2023-02-10"
    }
  ],
  "relatedProducts": [
    {
      "title": "Related Product",
      "url": "https://example.com/related-product",
      "price": 79.99,
      "imageUrl": "https://example.com/related-image.jpg"
    }
  ]
}`}
                </pre>
              </div>
            </section>
            
            <section id="techdocs" className="mb-8">
              <h3 className="text-xl font-bold mb-4">Technical Documentation</h3>
              <div className="card">
                <p className="mb-4">
                  The technical documentation scraper is designed to extract structured content from documentation sites.
                </p>
                <h4 className="font-bold mb-2">Options</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><code>extractTableOfContents</code> (boolean): Extract the table of contents</li>
                  <li><code>extractCodeBlocks</code> (boolean): Extract code blocks</li>
                  <li><code>extractHeadings</code> (boolean): Extract headings and subheadings</li>
                  <li><code>extractLinks</code> (boolean): Extract links to other documentation pages</li>
                  <li><code>preserveCodeFormatting</code> (boolean): Preserve code formatting in the output</li>
                </ul>
                <h4 className="font-bold mb-2">Response Format</h4>
                <pre className="code-block">
{`{
  "title": "Documentation Title",
  "url": "https://example.com/docs",
  "content": "Documentation content in HTML or Markdown format...",
  "tableOfContents": [
    {
      "text": "Section 1",
      "id": "section-1",
      "children": [
        { "text": "Subsection 1.1", "id": "subsection-1-1" }
      ]
    },
    {
      "text": "Section 2",
      "id": "section-2"
    }
  ],
  "codeBlocks": [
    {
      "language": "javascript",
      "code": "const example = &apos;Hello World&apos;;"
    }
  ],
  "headings": [
    {
      "text": "Section 1",
      "level": 2,
      "id": "section-1"
    }
  ],
  "links": [
    {
      "text": "Related Documentation",
      "url": "https://example.com/related-docs"
    }
  ]
}`}
                </pre>
              </div>
            </section>
            
            <section id="generic" className="mb-8">
              <h3 className="text-xl font-bold mb-4">Generic</h3>
              <div className="card">
                <p className="mb-4">
                  The generic scraper is a flexible option for extracting content from any website.
                </p>
                <h4 className="font-bold mb-2">Options</h4>
                <ul className="list-disc pl-5 mb-4">
                  <li><code>selectors</code> (object): Custom CSS selectors for extracting specific elements</li>
                  <li><code>includeHtml</code> (boolean): Include the raw HTML in the response</li>
                  <li><code>includeText</code> (boolean): Include the plain text in the response</li>
                  <li><code>includeMeta</code> (boolean): Include meta tags in the response</li>
                </ul>
                <h4 className="font-bold mb-2">Response Format</h4>
                <pre className="code-block">
{`{
  "title": "Page Title",
  "url": "https://example.com",
  "html": "Raw HTML content...",
  "text": "Plain text content...",
  "meta": {
    "description": "Page description",
    "keywords": "keyword1, keyword2"
  },
  "customSelectors": {
    "heading": "Extracted heading content",
    "price": "Extracted price content"
  }
}`}
                </pre>
              </div>
            </section>
          </section>
          
          <section id="options" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Common Options</h2>
            <div className="card">
              <p className="mb-4">
                These options can be used with any scraper type:
              </p>
              <ul className="list-disc pl-5">
                <li><code>timeout</code> (number): Maximum time in milliseconds to wait for the page to load (default: 30000)</li>
                <li><code>waitUntil</code> (string): When to consider navigation successful (options: &apos;load&apos;, &apos;domcontentloaded&apos;, &apos;networkidle0&apos;, &apos;networkidle2&apos;)</li>
                <li><code>userAgent</code> (string): Custom user agent string</li>
                <li><code>proxy</code> (string): Proxy server to use for the request</li>
                <li><code>cookies</code> (array): Cookies to set for the request</li>
              </ul>
            </div>
          </section>
          
          <section id="rate-limits" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
            <div className="card">
              <p className="mb-4">
                The API has the following rate limits:
              </p>
              <ul className="list-disc pl-5">
                <li>Free tier: 100 requests per day</li>
                <li>Basic tier: 1,000 requests per day</li>
                <li>Premium tier: 10,000 requests per day</li>
                <li>Enterprise tier: Custom limits</li>
              </ul>
              <p className="mt-4">
                If you exceed your rate limit, you will receive a 429 Too Many Requests response.
              </p>
            </div>
          </section>
          
          <section id="errors" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Errors</h2>
            <div className="card">
              <p className="mb-4">
                The API returns standard HTTP status codes to indicate success or failure:
              </p>
              <ul className="list-disc pl-5">
                <li><code>200 OK</code>: The request was successful</li>
                <li><code>400 Bad Request</code>: The request was invalid</li>
                <li><code>401 Unauthorized</code>: Authentication failed</li>
                <li><code>403 Forbidden</code>: You don&apos;t have permission to access the resource</li>
                <li><code>404 Not Found</code>: The requested resource was not found</li>
                <li><code>429 Too Many Requests</code>: You have exceeded your rate limit</li>
                <li><code>500 Internal Server Error</code>: An error occurred on the server</li>
              </ul>
              <p className="mt-4">
                Error responses include a JSON object with an <code>error</code> field that provides more information about the error.
              </p>
              <pre className="code-block mt-4">
{`{
  "error": "Invalid URL provided",
  "status": 400
}`}
              </pre>
            </div>
          </section>
          
          <div className="card bg-blue-50 border border-blue-200">
            <h2 className="text-xl font-bold mb-4">Need Help?</h2>
            <p className="mb-4">
              If you have any questions or need assistance, please don&apos;t hesitate to contact our support team.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 