"use client";

import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableErrorProps {
  message: string;
  onRetry: () => void;
  colSpan: number;
}

export function TableError({ message, onRetry, colSpan }: TableErrorProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-40 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          <p className="text-sm">{message}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Retry
          </Button>
        </div>
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
      <TableCell colSpan={colSpan} className="h-40 text-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Inbox className="size-6" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
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
            <TableCell key={column}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}