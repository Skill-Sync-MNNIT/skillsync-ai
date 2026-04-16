import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Processing...', 
  fullPage = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-[1.5px] border-slate-200 dark:border-slate-800 animate-[spin_3s_linear_infinite]" />
        
        {/* Pulsing Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-teal-500 animate-pulse blur-[2px] opacity-20" />
        </div>

        {/* Dynamic Accents */}
        <div className="absolute inset-0 border-[3px] border-transparent border-t-primary-500 border-r-teal-500 rounded-full animate-spin shadow-[0_0_15px_rgba(34,197,94,0.3)]"
             style={{ width: '100%', height: '100%' }} />
             
        <div className="absolute inset-2 border-[2px] border-transparent border-b-primary-400 border-l-teal-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse] opacity-60" />
      </div>
      
      {message && (
        <div className="mt-8 flex flex-col items-center gap-1.5">
          <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1">
            {message}
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" 
                style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.8s' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
        <div className="bg-white/40 dark:bg-slate-900/40 p-12 rounded-[2.5rem] border border-white/20 dark:border-slate-800/50 shadow-2xl backdrop-blur-md">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
