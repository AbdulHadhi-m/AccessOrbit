"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortHeader } from "@/components/data-table/sort-header";
import {
  TableEmpty,
  TableError,
  TableSkeleton,
} from "@/components/data-table/table-states";
import type { AuditLogDto } from "@/types/audit";

interface AuditLogsTableProps {
  data: AuditLogDto[];
  total: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  sort?: string;
  order?: "asc" | "desc";
  onSortChange: (sort: string, order: "asc" | "desc") => void;
  onInspect: (log: AuditLogDto) => void;
}

export function AuditLogsTable({
  data,
  total,
  loading,
  error,
  onRetry,
  sort,
  order,
  onSortChange,
  onInspect,
}: AuditLogsTableProps) {
  const columnsCount = 7;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader
              column="createdAt"
              label="Timestamp"
              currentSort={sort}
              currentOrder={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>
            <SortHeader
              column="category"
              label="Category"
              currentSort={sort}
              currentOrder={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead>
            <SortHeader
              column="action"
              label="Action"
              currentSort={sort}
              currentOrder={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead>
            <SortHeader
              column="status"
              label="Status"
              currentSort={sort}
              currentOrder={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead className="hidden md:table-cell">IP Address</TableHead>
          <TableHead className="w-16 text-right">Inspect</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && <TableSkeleton rows={5} columns={columnsCount} />}
        {error && !loading && (
          <TableError
            message={error.message || "Failed to load audit logs"}
            onRetry={onRetry}
            colSpan={columnsCount}
          />
        )}
        {!loading && !error && data.length === 0 && (
          <TableEmpty
            title="No audit logs found"
            description={total === 0 ? "No activity recorded yet." : "Try adjusting filters."}
            colSpan={columnsCount}
          />
        )}
        {!loading &&
          !error &&
          data.map((log) => {
            const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "medium",
            });
            const actorName = log.actor?.name || log.actor?.email || "System / Unauthenticated";

            return (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formattedDate}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{actorName}</span>
                    {log.actor?.email && log.actor.name && (
                      <span className="text-xs text-muted-foreground">{log.actor.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">
                    {log.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {log.action}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={log.status === "success" ? "default" : "destructive"}
                    className="capitalize text-xs"
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {log.ipAddress || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onInspect(log)}
                    aria-label={`Inspect audit log ${log.id}`}
                    title="View audit log details"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
