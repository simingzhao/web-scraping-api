import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Web Scraping API</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Extract structured data from any website with our powerful and flexible API.
          Perfect for news articles, e-commerce products, and technical documentation.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Extract Data From</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">News Articles</h3>
            <p className="mb-4">
              Extract article content, authors, publication dates, and images from news websites.
            </p>
            <Link href="/scraper?type=news" className="text-blue-600 hover:underline">
              Learn more →
            </Link>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold mb-4">E-commerce Products</h3>
            <p className="mb-4">
              Extract product details, prices, images, specifications, and reviews from online stores.
            </p>
            <Link href="/scraper?type=ecommerce" className="text-blue-600 hover:underline">
              Learn more →
            </Link>
          </div>
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Technical Documentation</h3>
            <p className="mb-4">
              Extract structured content, code blocks, and table of contents from documentation sites.
            </p>
            <Link href="/scraper?type=techdocs" className="text-blue-600 hover:underline">
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
        <div className="card">
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Choose a scraper type</strong> - Select the type of content you want to extract
              (news, e-commerce, technical documentation, or generic).
            </li>
            <li>
              <strong>Enter a URL</strong> - Provide the URL of the page you want to scrape.
            </li>
            <li>
              <strong>Configure options</strong> - Customize the extraction process with various options.
            </li>
            <li>
              <strong>Get results</strong> - Receive structured data in JSON format.
            </li>
          </ol>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">API Example</h2>
        <div className="card">
          <pre className="code-block">
{`fetch('https://your-domain.com/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/article',
    type: 'news',
    options: {
      extractImages: true,
      extractAuthors: true
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
          </pre>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/scraper" 
            className="btn btn-primary px-8 py-3 text-lg"
          >
            Try the Scraper
          </Link>
          <Link 
            href="/docs" 
            className="btn btn-secondary px-8 py-3 text-lg"
          >
            Read the Docs
          </Link>
        </div>
      </section>
    </div>
  );
}
