"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  if (totalPages <= 1 && total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {total === 0 ? 0 : (page - 1) * limit + 1}
        </span>
        {" – "}
        <span className="font-medium text-foreground">
          {total === 0 ? 0 : Math.min(page * limit, total)}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span> results
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <span className="px-2 text-sm tabular-nums text-muted-foreground">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}