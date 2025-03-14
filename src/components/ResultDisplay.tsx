'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Define types for the different scraper results
interface BaseScraperResult {
  title: string;
  url: string;
}

interface NewsScraperResult extends BaseScraperResult {
  content: string;
  authors?: string[];
  publishedDate?: string;
  imageUrl?: string;
}

interface EcommerceScraperResult extends BaseScraperResult {
  price: number;
  currency: string;
  description?: string;
  brand?: string;
  availability?: string;
  imageUrls?: string[];
  specifications?: Array<{
    name: string;
    value: string;
  }>;
}

interface TechDocsScraperResult extends BaseScraperResult {
  content: string;
  tableOfContents?: Array<{
    text: string;
    children?: Array<{
      text: string;
    }>;
  }>;
}

// Union type for all possible scraper results
type ScraperResult = NewsScraperResult | EcommerceScraperResult | TechDocsScraperResult | Record<string, unknown>;

export interface ResultDisplayProps {
  result: ScraperResult | null;
  error?: string;
}

export default function ResultDisplay({ result, error }: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'preview'>('json');
  const [copied, setCopied] = useState(false);
  
  // Format the result as a pretty-printed JSON string
  const formattedResult = JSON.stringify(result, null, 2);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // If there's an error, display it
  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
        <div className="bg-white p-4 rounded border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // If there's no result, don't display anything
  if (!result) return null;
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Result</h3>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>
      
      {activeTab === 'json' && (
        <div className="relative">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <SyntaxHighlighter
            language="json"
            style={vscDarkPlus}
            customStyle={{
              borderRadius: '0.25rem',
              marginTop: 0,
              marginBottom: 0,
            }}
          >
            {formattedResult}
          </SyntaxHighlighter>
        </div>
      )}
      
      {activeTab === 'preview' && (
        <div className="bg-white p-4 rounded border border-gray-200">
          <PreviewContent result={result} />
        </div>
      )}
    </div>
  );
}

// Helper component to render a preview of the result based on its type
function PreviewContent({ result }: { result: ScraperResult }) {
  // Handle different types of content based on the scraper type
  if (!result) return <p>No content to display</p>;
  
  // If it's a news article
  if ('title' in result && 'content' in result && !('tableOfContents' in result)) {
    const newsResult = result as NewsScraperResult;
    return (
      <div className="news-preview">
        <h1 className="text-2xl font-bold mb-4">{newsResult.title}</h1>
        
        {newsResult.authors && newsResult.authors.length > 0 && (
          <p className="text-gray-600 mb-2">
            By {newsResult.authors.join(', ')}
            {newsResult.publishedDate && ` • ${newsResult.publishedDate}`}
          </p>
        )}
        
        {newsResult.imageUrl && (
          <img 
            src={newsResult.imageUrl} 
            alt={newsResult.title} 
            className="w-full h-auto max-h-96 object-cover rounded mb-4"
          />
        )}
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: newsResult.content }}
        />
      </div>
    );
  }
  
  // If it's an e-commerce product
  if ('title' in result && 'price' in result) {
    const productResult = result as EcommerceScraperResult;
    return (
      <div className="product-preview">
        <div className="flex flex-col md:flex-row gap-6">
          {productResult.imageUrls && productResult.imageUrls.length > 0 && (
            <div className="md:w-1/3">
              <img 
                src={productResult.imageUrls[0]} 
                alt={productResult.title} 
                className="w-full h-auto object-contain rounded"
              />
            </div>
          )}
          
          <div className="md:w-2/3">
            <h1 className="text-2xl font-bold mb-2">{productResult.title}</h1>
            
            {productResult.brand && (
              <p className="text-gray-600 mb-2">Brand: {productResult.brand}</p>
            )}
            
            <p className="text-xl font-bold text-green-600 mb-4">
              {productResult.currency}{productResult.price}
            </p>
            
            {productResult.availability && (
              <p className={`mb-4 ${productResult.availability.toLowerCase().includes('in stock') ? 'text-green-600' : 'text-red-600'}`}>
                {productResult.availability}
              </p>
            )}
            
            {productResult.description && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p>{productResult.description}</p>
              </div>
            )}
            
            {productResult.specifications && productResult.specifications.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Specifications</h2>
                <ul className="list-disc pl-5">
                  {productResult.specifications.map((spec, index) => (
                    <li key={index}>
                      <span className="font-medium">{spec.name}:</span> {spec.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // If it's technical documentation
  if ('title' in result && 'content' in result && 'tableOfContents' in result) {
    const docsResult = result as TechDocsScraperResult;
    return (
      <div className="techdocs-preview">
        <h1 className="text-2xl font-bold mb-4">{docsResult.title}</h1>
        
        {docsResult.tableOfContents && docsResult.tableOfContents.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="text-lg font-semibold mb-2">Table of Contents</h2>
            <ul className="list-disc pl-5">
              {docsResult.tableOfContents.map((item, index) => (
                <li key={index} className="mb-1">
                  <span className="font-medium">{item.text}</span>
                  {item.children && item.children.length > 0 && (
                    <ul className="list-circle pl-5 mt-1">
                      {item.children.map((child, childIndex) => (
                        <li key={childIndex}>{child.text}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: docsResult.content }}
        />
      </div>
    );
  }
  
  // Generic fallback for other types of content
  return (
    <div className="generic-preview">
      <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
} 