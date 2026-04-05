import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}
export const Pagination = ({ page, totalPages, onPageChange, className = '' }: PaginationProps) => {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);
  return (
    <nav
      className={`mx-auto flex w-full justify-center ${className}`}
      role="navigation"
      aria-label="pagination"
    >
      <ul className="flex flex-row items-center gap-1">
        <li>
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        {pages.map(p => (
          <li key={p}>
            <button
              onClick={() => onPageChange(p)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm ${p === page ? 'bg-primary text-primary-foreground' : 'border bg-background hover:bg-muted'}`}
            >
              {p}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};
