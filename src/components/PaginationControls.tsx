import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  pageInfo?: string;
}

const buildPageItems = (currentPage: number, totalPages: number) => {
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const leftSibling = Math.max(currentPage - 1, 2);
  const rightSibling = Math.min(currentPage + 1, totalPages - 1);

  if (leftSibling > 2) {
    pages.push('ellipsis');
  }

  for (let page = leftSibling; page <= rightSibling; page++) {
    pages.push(page);
  }

  if (rightSibling < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
};

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  pageInfo,
}: PaginationControlsProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      {pageInfo && <span className="text-sm text-muted-foreground">{pageInfo}</span>}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={cn(
                'cursor-pointer',
                currentPage === 1 && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>

          {pageItems.map((item, index) => (
            <PaginationItem key={`${item}-${index}`}>
              {item === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(item)}
                  isActive={currentPage === item}
                  className="cursor-pointer"
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              className={cn(
                'cursor-pointer',
                currentPage === totalPages && 'pointer-events-none opacity-50'
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default PaginationControls;
