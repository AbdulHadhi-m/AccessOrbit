"use client";

import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableError, TableEmpty, TableSkeleton } from "@/components/data-table/table-states";
import type { ModuleDto } from "@/types/rbac";

interface ModulesTableProps {
  data: ModuleDto[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (module: ModuleDto) => void;
  onToggleStatus: (module: ModuleDto) => void;
  onDelete: (module: ModuleDto) => void;
}

export function ModulesTable({
  data,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  onEdit,
  onToggleStatus,
  onDelete,
}: ModulesTableProps) {
  const colSpan = 5;
  const showSkeleton = loading && data.length === 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Module</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {showSkeleton && <TableSkeleton rows={5} columns={colSpan} />}
        {!showSkeleton && error && (
          <TableError message={error.message} onRetry={onRetry} colSpan={colSpan} />
        )}
        {!showSkeleton && !error && data.length === 0 && (
          <TableEmpty title="No modules found" colSpan={colSpan} />
        )}
        {!showSkeleton &&
          !error &&
          data.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{module.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{module.key}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-72 text-muted-foreground">
                <span className="line-clamp-2">{module.description || "—"}</span>
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{module.order}</TableCell>
              <TableCell>
                <StatusBadge status={module.active ? "active" : "inactive"} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(module)}
                        aria-label={`Edit ${module.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleStatus(module)}
                        aria-label={
                          module.active ? `Deactivate ${module.name}` : `Activate ${module.name}`
                        }
                        title={module.active ? "Deactivate" : "Activate"}
                      >
                        {module.active ? (
                          <PowerOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Power className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(module)}
                      aria-label={`Delete ${module.name}`}
                      title="Delete"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}