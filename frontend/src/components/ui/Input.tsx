import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './Button';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border border-slate-200 dark:border-[#383942] bg-white dark:bg-[#202123] px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 hover:border-primary-400/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
            error && 'border-red-400 focus:ring-red-500/10 focus:border-red-400 dark:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
