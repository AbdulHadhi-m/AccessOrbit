"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";

interface TableErrorProps {
  message: string;
  onRetry: () => void;
  colSpan: number;
}

export function TableError({ message, onRetry, colSpan }: TableErrorProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48 p-0">
        <ErrorState
          compact
          message={message}
          onRetry={onRetry}
          retryLabel="Retry"
          icon={AlertTriangle}
        />
      </TableCell>
    </TableRow>
  );
}

interface TableEmptyProps {
  title?: string;
  description?: string;
  colSpan: number;
}

export function TableEmpty({
  title = "No results",
  description = "Try adjusting your search or filters.",
  colSpan,
}: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48 p-0">
        <EmptyState compact icon={Inbox} title={title} description={description} />
      </TableCell>
    </TableRow>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

export function TableSkeleton({ rows = 5, columns }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: columns }).map((__, column) => (
            <TableCell key={column} className="py-3">
              <Skeleton className="h-4 w-full max-w-[12rem]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
