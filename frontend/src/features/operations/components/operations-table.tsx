"use client";

import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { OperationDto, ModuleDto, SubModuleDto } from "@/types/rbac";

interface OperationsTableProps {
  data: OperationDto[];
  modules: ModuleDto[];
  subModules: SubModuleDto[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (operation: OperationDto) => void;
  onToggleStatus: (operation: OperationDto) => void;
  onDelete: (operation: OperationDto) => void;
}

export function OperationsTable({
  data,
  modules,
  subModules,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  onEdit,
  onToggleStatus,
  onDelete,
}: OperationsTableProps) {
  const colSpan = 6;
  const showSkeleton = loading && data.length === 0;
  const moduleName = (moduleId: string) =>
    modules.find((module) => module.id === moduleId)?.name ?? "—";
  const subModuleName = (subModuleId: string | null) => {
    if (!subModuleId) return null;
    return subModules.find((subModule) => subModule.id === subModuleId)?.name ?? "—";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Operation</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Sub-module</TableHead>
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
          <TableEmpty title="No operations found" colSpan={colSpan} />
        )}
        {!showSkeleton &&
          !error &&
          data.map((operation) => {
            const subModule = subModuleName(operation.subModuleId);
            return (
              <TableRow key={operation.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{operation.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {operation.key}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {moduleName(operation.moduleId)}
                </TableCell>
                <TableCell>
                  {subModule ? (
                    <span className="text-muted-foreground">{subModule}</span>
                  ) : (
                    <Badge variant="outline">Top level</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {operation.order}
                </TableCell>
                <TableCell>
                  <StatusBadge status={operation.active ? "active" : "inactive"} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {canUpdate && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(operation)}
                          aria-label={`Edit ${operation.name}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onToggleStatus(operation)}
                          aria-label={
                            operation.active
                              ? `Deactivate ${operation.name}`
                              : `Activate ${operation.name}`
                          }
                          title={operation.active ? "Deactivate" : "Activate"}
                        >
                          {operation.active ? (
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
                        onClick={() => onDelete(operation)}
                        aria-label={`Delete ${operation.name}`}
                        title="Delete"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}