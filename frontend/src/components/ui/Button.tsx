import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility function to merge tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          {
            'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_8px_24px_rgba(34,197,94,0.2)] active:scale-[0.98]': variant === 'primary',
            'btn-gradient hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] active:scale-[0.98]': variant === 'gradient',
            'bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-[#2a2b32] dark:text-slate-100 dark:hover:bg-[#343541]': variant === 'secondary',
            'ghost-border bg-transparent hover:bg-slate-50 dark:hover:bg-[#2a2b32] text-slate-700 dark:text-slate-300':
              variant === 'outline',
            'bg-transparent hover:bg-slate-50 dark:hover:bg-[#2a2b32] text-slate-600 dark:text-slate-400': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30 hover:shadow-[0_8px_24px_rgba(239,68,68,0.2)]': variant === 'danger',
            'h-8 px-3 text-sm gap-1.5': size === 'sm',
            'h-10 px-5 py-2 gap-2': size === 'md',
            'h-12 px-6 text-base gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 mr-1.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
