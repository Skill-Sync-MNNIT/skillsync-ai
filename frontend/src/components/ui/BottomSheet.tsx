import { useEffect, useRef } from 'react';
import { cn } from './Button';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet = ({ isOpen, onClose, title, children }: BottomSheetProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        ref={contentRef}
        className={cn(
          "relative w-full max-w-md bg-white dark:bg-[#202123] rounded-t-[32px] sm:rounded-2xl shadow-2xl overflow-hidden",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-[#2a2b32] rounded-full" />
        </div>

        {(title || !!onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-[#383942]">
            {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>}
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-[#2a2b32] rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        )}

        <div className="px-6 py-6 pb-12 sm:pb-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
