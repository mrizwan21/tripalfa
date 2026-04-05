import * as React from 'react';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ currentPage, totalPages, onPageChange, className = '', ...props }, ref) => {
    const classes = ['pagination'];
    if (className) classes.push(className);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <nav ref={ref} className={classes.join(' ')} {...props}>
        <button
          className="pagination__item"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          &laquo;
        </button>
        {pages.map(page => (
          <button
            key={page}
            className={`pagination__item${page === currentPage ? ' pagination__item--active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination__item"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          &raquo;
        </button>
      </nav>
    );
  }
);
Pagination.displayName = 'Pagination';
