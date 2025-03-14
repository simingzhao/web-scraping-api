'use client';

import { useEffect, useState } from 'react';

export interface LoadingIndicatorProps {
  message?: string;
  showProgress?: boolean;
}

export default function LoadingIndicator({ 
  message = 'Loading...', 
  showProgress = true 
}: LoadingIndicatorProps) {
  const [dots, setDots] = useState('.');
  const [progress, setProgress] = useState(0);
  
  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Simulate progress
  useEffect(() => {
    if (!showProgress) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        // Slow down progress as it gets higher
        const increment = Math.max(1, Math.floor((100 - prev) / 10));
        const newProgress = Math.min(99, prev + increment);
        
        // Stop at 99% - will be set to 100% when actually complete
        return newProgress;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [showProgress]);
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-20 h-20 mb-4">
        <div className="spinner-large"></div>
      </div>
      
      <div className="text-center">
        <p className="text-lg font-medium mb-2">
          {message} <span className="inline-block w-6">{dots}</span>
        </p>
        
        {showProgress && (
          <div className="w-full max-w-md">
            <div className="bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
} 