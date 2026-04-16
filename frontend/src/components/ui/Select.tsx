import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from './Button';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: string;
  placeholder?: string;
}

export const Select = ({ label, value, onChange, options, error, placeholder }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all duration-200",
          error && "border-red-400 focus:ring-red-500/40 focus:border-red-400 dark:border-red-500",
          isOpen && "ring-2 ring-primary-500/40 border-primary-400"
        )}
      >
        <span className={cn(!selectedOption && "text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder || "Select option"}
        </span>
        <ChevronDown 
          size={18} 
          className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full origin-top animate-in fade-in zoom-in-95 duration-100 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800",
                  option.value === value ? "text-primary-600 bg-primary-50/50 dark:bg-primary-900/10" : "text-slate-700 dark:text-slate-200"
                )}
              >
                {option.label}
                {option.value === value && <Check size={16} className="text-primary-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
