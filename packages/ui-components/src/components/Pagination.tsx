import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export type PaginationVariant = "b2b" | "b2c" | "admin";
export type PaginationDensity = "compact" | "normal" | "comfortable";

export interface PaginationProps
  extends VariantProps<typeof paginationVariants> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  showFirst?: boolean;
  showLast?: boolean;
  showInfo?: boolean;
  containerClassName?: string;
  disabled?: boolean;
}

const paginationVariants = cva(
  "flex items-center justify-center gap-1 transition-colors",
  {
    variants: {
      variant: {
        b2b: "text-near-black",
        b2c: "text-near-black",
        admin: "text-near-black",
      },
      density: {
        compact: "text-xs",
        normal: "text-sm",
        comfortable: "text-base",
      },
    },
    defaultVariants: {
      variant: "b2b",
      density: "normal",
    },
  }
);

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        b2b: "hover:bg-apple-blue/10 hover:text-apple-blue focus-visible:ring-2 focus-visible:ring-apple-blue",
        b2c: "hover:bg-apple-blue/10 hover:text-apple-blue focus-visible:ring-2 focus-visible:ring-apple-blue",
        admin: "hover:bg-near-black hover:text-near-black focus-visible:ring-2 focus-visible:ring-apple-blue",
      },
      density: {
        compact: "h-6 w-6 text-xs",
        normal: "h-8 w-8 text-sm",
        comfortable: "h-10 w-10 text-base",
      },
      active: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "b2b",
        active: true,
        className: "bg-apple-blue text-white hover:bg-apple-blue",
      },
      {
        variant: "b2c",
        active: true,
        className: "bg-apple-blue text-white hover:bg-apple-blue",
      },
      {
        variant: "admin",
        active: true,
        className: "bg-near-black text-white hover:bg-near-black",
      },
    ],
    defaultVariants: {
      variant: "b2b",
      density: "normal",
      active: false,
    },
  }
);

const densityStyles = {
  compact: { button: "h-6 w-6", icon: "h-3 w-3" },
  normal: { button: "h-8 w-8", icon: "h-4 w-4" },
  comfortable: { button: "h-10 w-10", icon: "h-5 w-5" },
};

export const Pagination = React.forwardRef<
  HTMLDivElement,
  PaginationProps
>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      itemsPerPage,
      totalItems,
      showFirst = false,
      showLast = false,
      showInfo = false,
      variant = "b2b",
      density = "normal",
      containerClassName,
      disabled = false,
    },
    ref
  ) => {
    const styles = densityStyles[density || "normal"];

    // Generate page numbers to display
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const delta = 2;
      const range = {
        start: Math.round(currentPage - delta),
        end: Math.round(currentPage + delta),
      };

      range.start = Math.max(2, range.start);
      range.end = Math.min(totalPages - 1, range.end);

      let prev: number | string = 0;

      for (let i = 1; i <= totalPages; i += 1) {
        if (i === 1 || i === totalPages) {
          pages.push(i);
          prev = i;
        } else if (i >= range.start && i <= range.end) {
          if (prev !== i - 1) pages.push("...");
          pages.push(i);
          prev = i;
        }
      }

      return pages;
    };

    const pageNumbers = getPageNumbers();
    const startItem = (currentPage - 1) * (itemsPerPage || 10) + 1;
    const endItem = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4",
          containerClassName
        )}
      >
        {showInfo && totalItems && (
          <div className="text-center text-sm text-near-black">
            Showing {startItem} to {endItem} of {totalItems} items
          </div>
        )}

        <div
          className={cn(paginationVariants({ variant, density }))}
          role="navigation"
          aria-label="Pagination"
        >
          {/* First Page Button */}
          {showFirst && (
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || disabled}
              className={cn(buttonVariants({ variant, density }))}
              aria-label="Go to first page"
            >
              <span>«</span>
            </button>
          )}

          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || disabled}
            className={cn(buttonVariants({ variant, density }))}
            aria-label="Go to previous page"
          >
            <ChevronLeft className={styles.icon} />
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className={cn(styles.button, "flex items-center justify-center")}
                >
                  <MoreHorizontal className={cn(styles.icon, "text-near-black")} />
                </div>
              );
            }

            return (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(Number(page))}
                disabled={disabled}
                className={cn(
                  buttonVariants({
                    variant,
                    density,
                    active: page === currentPage,
                  })
                )}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || disabled}
            className={cn(buttonVariants({ variant, density }))}
            aria-label="Go to next page"
          >
            <ChevronRight className={styles.icon} />
          </button>

          {/* Last Page Button */}
          {showLast && (
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || disabled}
              className={cn(buttonVariants({ variant, density }))}
              aria-label="Go to last page"
            >
              <span>»</span>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";
