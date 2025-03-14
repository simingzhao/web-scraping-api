'use client';

import { AlertCircle } from 'lucide-react';

export interface ErrorDisplayProps {
  message: string;
  details?: string;
}

export default function ErrorDisplay({ message, details }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {message}
          </h3>
          {details && (
            <div className="mt-2 text-sm text-red-700">
              <p>{details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 