import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 4) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust to keep at least 3 numbers in the middle if possible
      let adjustedStart = start;
      let adjustedEnd = end;

      if (currentPage <= 4) {
        adjustedEnd = 5;
      } else if (currentPage >= totalPages - 3) {
        adjustedStart = totalPages - 4;
      }

      for (let i = adjustedStart; i <= adjustedEnd; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex justify-center items-center gap-2 mt-12 pb-8 animate-fade-in ${className || ''}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-slate-100 dark:border-[#383942] hover:bg-slate-50 dark:hover:bg-[#2a2b32] text-slate-600 dark:text-slate-400 p-0 flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-slate-100 dark:disabled:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:grayscale"
      >
        <ChevronLeft size={20} />
      </Button>

      <div className="flex items-center gap-2">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-slate-400 font-bold">
                ...
              </span>
            );
          }

          const pageNumber = page as number;
          const isActive = currentPage === pageNumber;

          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center ${isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                  : 'bg-white dark:bg-[#202123] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-[#383942] hover:border-primary-400 hover:text-primary-600 shadow-sm'
                }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-slate-100 dark:border-[#383942] hover:bg-slate-50 dark:hover:bg-[#2a2b32] text-slate-600 dark:text-slate-400 p-0 flex items-center justify-center transition-all disabled:opacity-30 disabled:bg-slate-100 dark:disabled:bg-[#1a1b1e] disabled:cursor-not-allowed disabled:grayscale"
      >
        <ChevronRight size={20} />
      </Button>
    </div>
  );
};
