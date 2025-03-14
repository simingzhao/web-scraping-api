'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import InputForm from '@/components/InputForm';
import LoadingIndicator from '@/components/LoadingIndicator';
import ResultDisplay from '@/components/ResultDisplay';
import ErrorDisplay from '@/components/ErrorDisplay';

// Import the ScraperResult type from ResultDisplay
import type { ResultDisplayProps } from '@/components/ResultDisplay';
type ScraperResult = ResultDisplayProps['result'];

export default function ScraperPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScraperResult | null>(null);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [initialUrl, setInitialUrl] = useState('');
  const [initialType, setInitialType] = useState('');
  
  // Initialize form values from URL parameters
  useEffect(() => {
    if (searchParams) {
      const url = searchParams.get('url');
      const type = searchParams.get('type');
      
      if (url) setInitialUrl(url);
      if (type && ['news', 'ecommerce', 'techdocs', 'generic'].includes(type)) {
        setInitialType(type);
      }
    }
  }, [searchParams]);
  
  const handleSubmit = async (data: {
    url: string;
    type: string;
    options: Record<string, unknown>;
  }) => {
    // Update URL with the form parameters
    const params = new URLSearchParams();
    params.set('url', data.url);
    params.set('type', data.type);
    router.push(`/scraper?${params.toString()}`);
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Validate URL
      if (!data.url.trim()) {
        throw new Error('URL is required');
      }
      
      try {
        new URL(data.url); // This will throw if URL is invalid
      } catch {
        throw new Error('Invalid URL format');
      }
      
      // Call the API endpoint
      const response = await fetch(`/api/scrape/${data.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: data.url,
          format: 'markdown',
          force: false,
          ...data.options
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, get the text content for better error reporting
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to scrape the URL');
      }
      
      setResult(responseData);
    } catch (err) {
      console.error('Scraping error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      let errorDetails;
      
      if (errorMessage.includes('TIMEOUT')) {
        errorDetails = 'The request timed out. The website might be too slow or blocking our scraper.';
      } else if (errorMessage.includes('BLOCKED')) {
        errorDetails = 'The website appears to be blocking web scrapers. Try a different URL or contact us for help.';
      } else if (errorMessage.includes('NOT_FOUND')) {
        errorDetails = 'The URL could not be found. Please check that it is correct and try again.';
      } else if (errorMessage.includes('non-JSON response')) {
        errorDetails = 'The server encountered an error. Please try again or contact support if the issue persists.';
      }
      
      setError({ 
        message: errorMessage,
        details: errorDetails
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Web Scraper</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <InputForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
            initialUrl={initialUrl}
            initialType={initialType}
          />
          
          <div className="card mt-6">
            <h2 className="text-xl font-bold mb-4">How to Use</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Enter the URL you want to scrape</li>
              <li>Select the appropriate scraper type for the content</li>
              <li>Customize options if needed</li>
              <li>Click &quot;Scrape Now&quot; to start the process</li>
              <li>View the results in JSON format or as a preview</li>
            </ol>
          </div>
        </div>
        
        <div>
          {error && (
            <ErrorDisplay message={error.message} details={error.details} />
          )}
          
          {isLoading ? (
            <LoadingIndicator message="Scraping content..." />
          ) : (
            <ResultDisplay result={result} error={error?.message} />
          )}
        </div>
      </div>
    </div>
  );
} 