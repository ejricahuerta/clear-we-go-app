"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  /** 1-based current page */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Optional page size options; if provided, shows a selector and calls onPageSizeChange */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const showNumbers = totalPages <= 7;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const pageNumbers = showNumbers
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : [];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-3">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "No results"
            : `Showing ${start}–${end} of ${total.toLocaleString()}`}
        </span>
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrev}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {showNumbers ? (
          <div className="flex items-center gap-0.5 mx-1">
            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={n === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 min-w-8"
                onClick={() => onPageChange(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </Button>
            ))}
          </div>
        ) : (
          <span className="min-w-[7rem] text-center text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
