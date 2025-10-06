import { useEffect, useMemo, useState } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export const usePagination = <T,>(items: T[], options?: UsePaginationOptions) => {
  const [page, setPage] = useState(options?.initialPage ?? 1);
  const [pageSize, setPageSize] = useState(options?.initialPageSize ?? 10);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(totalItems, currentPage * pageSize);

  const currentItems = useMemo(() => {
    const offset = (currentPage - 1) * pageSize;
    return items.slice(offset, offset + pageSize);
  }, [items, currentPage, pageSize]);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, totalItems]);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    page: currentPage,
    pageSize,
    setPageSize,
    setPage: goToPage,
    nextPage: goToNextPage,
    previousPage: goToPreviousPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    items: currentItems,
  };
};

export default usePagination;
