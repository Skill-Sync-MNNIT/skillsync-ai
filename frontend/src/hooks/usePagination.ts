import { useState, useEffect } from 'react';

/**
 * Generic client-side pagination hook.
 * Resets to page 1 whenever the item count changes (e.g. after filtering).
 */
export const usePagination = <T>(items: T[], perPage: number) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when searching / filtering changes the list
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalPages = Math.ceil(items.length / perPage);
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentItems = items.slice(indexOfFirst, indexOfLast);

  return { currentItems, currentPage, totalPages, setPage: setCurrentPage };
};
