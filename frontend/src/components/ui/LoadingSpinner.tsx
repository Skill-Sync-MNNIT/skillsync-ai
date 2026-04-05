import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  fullPage = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Simple Blue Spinner */}
      <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
      
      {/* Simple Text */}
      {message && (
        <p className="mt-3 text-xs font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center w-full animate-fade-in">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
