import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Web Scraping API',
  description: 'A powerful API for scraping web content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-sm">
          <div className="container mx-auto py-4">
            <nav className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  Web Scraping API
                </Link>
                <div className="ml-8 hidden md:flex space-x-4">
                  <Link href="/" className="hover:text-blue-600">
                    Home
                  </Link>
                  <Link href="/scraper" className="hover:text-blue-600">
                    Try Scraper
                  </Link>
                  <Link href="/docs" className="hover:text-blue-600">
                    Documentation
                  </Link>
                </div>
              </div>
              <div>
                <Link
                  href="/api/scrape"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  API
                </Link>
              </div>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-gray-100 mt-12">
          <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Web Scraping API</h3>
                <p className="text-gray-600">
                  A powerful API for extracting structured data from websites.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-gray-600 hover:text-blue-600">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/scraper" className="text-gray-600 hover:text-blue-600">
                      Try Scraper
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="text-gray-600 hover:text-blue-600">
                      Documentation
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-gray-600 hover:text-blue-600">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-600 hover:text-blue-600">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
              <p>&copy; {new Date().getFullYear()} Web Scraping API. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
