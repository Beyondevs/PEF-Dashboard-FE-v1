import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type PaginationSummaryProps = {
  children: ReactNode;
  className?: string;
};

/** "Showing X–Y of Z" text — hidden for client role only */
export function PaginationSummary({ children, className }: PaginationSummaryProps) {
  const { showPaginationSummary } = useAuth();
  if (!showPaginationSummary()) return null;

  return <div className={cn(className)}>{children}</div>;
}

export default PaginationSummary;
