'use client';

import { useState, FormEvent, useEffect } from 'react';

export interface InputFormProps {
  onSubmit: (data: {
    url: string;
    type: string;
    options: Record<string, unknown>;
  }) => void;
  isLoading?: boolean;
  initialUrl?: string;
  initialType?: string;
}

export default function InputForm({ 
  onSubmit, 
  isLoading = false, 
  initialUrl = '', 
  initialType = 'news' 
}: InputFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [type, setType] = useState(initialType);
  const [advancedOptions, setAdvancedOptions] = useState(false);
  
  // Update form when initialUrl or initialType changes
  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialType) setType(initialType);
  }, [initialUrl, initialType]);
  
  // Options for each scraper type
  const [newsOptions, setNewsOptions] = useState({
    extractComments: false,
    extractImages: true,
    extractAuthors: true,
    extractPublishedDate: true,
  });
  
  const [ecommerceOptions, setEcommerceOptions] = useState({
    extractReviews: false,
    extractVariants: true,
    extractRelatedProducts: false,
    extractSpecifications: true,
  });
  
  const [techDocsOptions, setTechDocsOptions] = useState({
    extractTableOfContents: true,
    extractCodeBlocks: true,
    extractHeadings: true,
    extractLinks: true,
    preserveCodeFormatting: true,
  });
  
  const [genericOptions, setGenericOptions] = useState({
    timeout: 30000,
    waitUntil: 'networkidle2',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Determine which options to use based on the selected type
    let options: Record<string, unknown> = {};
    
    switch (type) {
      case 'news':
        options = newsOptions;
        break;
      case 'ecommerce':
        options = ecommerceOptions;
        break;
      case 'techdocs':
        options = techDocsOptions;
        break;
      case 'generic':
        options = genericOptions;
        break;
    }
    
    // Add common options
    options = {
      ...options,
      timeout: genericOptions.timeout,
      waitUntil: genericOptions.waitUntil,
    };
    
    onSubmit({ url, type, options });
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Web Scraper</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url" className="form-label">URL to Scrape</label>
          <input
            type="url"
            id="url"
            className="form-input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="type" className="form-label">Scraper Type</label>
          <select
            id="type"
            className="form-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="news">News Article</option>
            <option value="ecommerce">E-commerce Product</option>
            <option value="techdocs">Technical Documentation</option>
            <option value="generic">Generic</option>
          </select>
        </div>
        
        <div className="form-group">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => setAdvancedOptions(!advancedOptions)}
          >
            {advancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>
        
        {advancedOptions && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-3">Advanced Options</h3>
            
            {/* Common options */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Common Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="timeout" className="form-label">Timeout (ms)</label>
                  <input
                    type="number"
                    id="timeout"
                    className="form-input"
                    value={genericOptions.timeout}
                    onChange={(e) => setGenericOptions({
                      ...genericOptions,
                      timeout: parseInt(e.target.value),
                    })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="waitUntil" className="form-label">Wait Until</label>
                  <select
                    id="waitUntil"
                    className="form-select"
                    value={genericOptions.waitUntil}
                    onChange={(e) => setGenericOptions({
                      ...genericOptions,
                      waitUntil: e.target.value,
                    })}
                  >
                    <option value="load">load</option>
                    <option value="domcontentloaded">domcontentloaded</option>
                    <option value="networkidle0">networkidle0</option>
                    <option value="networkidle2">networkidle2</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Type-specific options */}
            {type === 'news' && (
              <div>
                <h4 className="font-medium mb-2">News Article Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newsOptions.extractComments}
                        onChange={(e) => setNewsOptions({
                          ...newsOptions,
                          extractComments: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Comments
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newsOptions.extractImages}
                        onChange={(e) => setNewsOptions({
                          ...newsOptions,
                          extractImages: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Images
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newsOptions.extractAuthors}
                        onChange={(e) => setNewsOptions({
                          ...newsOptions,
                          extractAuthors: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Authors
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newsOptions.extractPublishedDate}
                        onChange={(e) => setNewsOptions({
                          ...newsOptions,
                          extractPublishedDate: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Published Date
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {type === 'ecommerce' && (
              <div>
                <h4 className="font-medium mb-2">E-commerce Product Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ecommerceOptions.extractReviews}
                        onChange={(e) => setEcommerceOptions({
                          ...ecommerceOptions,
                          extractReviews: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Reviews
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ecommerceOptions.extractVariants}
                        onChange={(e) => setEcommerceOptions({
                          ...ecommerceOptions,
                          extractVariants: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Variants
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ecommerceOptions.extractRelatedProducts}
                        onChange={(e) => setEcommerceOptions({
                          ...ecommerceOptions,
                          extractRelatedProducts: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Related Products
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={ecommerceOptions.extractSpecifications}
                        onChange={(e) => setEcommerceOptions({
                          ...ecommerceOptions,
                          extractSpecifications: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Specifications
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {type === 'techdocs' && (
              <div>
                <h4 className="font-medium mb-2">Technical Documentation Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={techDocsOptions.extractTableOfContents}
                        onChange={(e) => setTechDocsOptions({
                          ...techDocsOptions,
                          extractTableOfContents: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Table of Contents
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={techDocsOptions.extractCodeBlocks}
                        onChange={(e) => setTechDocsOptions({
                          ...techDocsOptions,
                          extractCodeBlocks: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Code Blocks
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={techDocsOptions.extractHeadings}
                        onChange={(e) => setTechDocsOptions({
                          ...techDocsOptions,
                          extractHeadings: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Headings
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={techDocsOptions.extractLinks}
                        onChange={(e) => setTechDocsOptions({
                          ...techDocsOptions,
                          extractLinks: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Extract Links
                    </label>
                  </div>
                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={techDocsOptions.preserveCodeFormatting}
                        onChange={(e) => setTechDocsOptions({
                          ...techDocsOptions,
                          preserveCodeFormatting: e.target.checked,
                        })}
                        className="mr-2"
                      />
                      Preserve Code Formatting
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                Scraping...
              </span>
            ) : (
              'Scrape Now'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 