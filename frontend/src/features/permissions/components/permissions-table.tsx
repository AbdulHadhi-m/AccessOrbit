"use client";

import { ChevronRight, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
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
import type { PermissionDto, ModuleDto, SubModuleDto, OperationDto } from "@/types/rbac";

interface PermissionsTableProps {
  data: PermissionDto[];
  modules: ModuleDto[];
  subModules: SubModuleDto[];
  operations: OperationDto[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (permission: PermissionDto) => void;
  onToggleStatus: (permission: PermissionDto) => void;
  onDelete: (permission: PermissionDto) => void;
}

export function PermissionsTable({
  data,
  modules,
  subModules,
  operations,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  onEdit,
  onToggleStatus,
  onDelete,
}: PermissionsTableProps) {
  const colSpan = 5;
  const showSkeleton = loading && data.length === 0;

  const lookup = (permission: PermissionDto) => {
    const operation = operations.find((item) => item.id === permission.operationId);
    const parentModule = modules.find((item) => item.id === permission.moduleId);
    const subModule = subModules.find((item) => item.id === operation?.subModuleId);
    return { operation, module: parentModule, subModule };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Path</TableHead>
          <TableHead>Permission</TableHead>
          <TableHead>Description</TableHead>
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
          <TableEmpty title="No permissions found" colSpan={colSpan} />
        )}
        {!showSkeleton &&
          !error &&
          data.map((permission) => {
            const { operation, module, subModule } = lookup(permission);
            const segments = [
              module?.name ?? "Unknown module",
              subModule?.name,
              operation?.name,
            ].filter((segment): segment is string => Boolean(segment));
            return (
              <TableRow key={permission.id}>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1 text-sm">
                    {segments.map((segment, index) => (
                      <span key={segment} className="flex items-center gap-1">
                        {index > 0 && (
                          <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                        )}
                        <span className="max-w-36 truncate">{segment}</span>
                      </span>
                    ))}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs font-medium">{permission.key}</span>
                    <span className="text-sm">{permission.name}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-56 text-muted-foreground">
                  <span className="line-clamp-2">{permission.description || "—"}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={permission.active ? "active" : "inactive"} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {canUpdate && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(permission)}
                          aria-label={`Edit ${permission.key}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onToggleStatus(permission)}
                          aria-label={
                            permission.active
                              ? `Deactivate ${permission.key}`
                              : `Activate ${permission.key}`
                          }
                          title={permission.active ? "Deactivate" : "Activate"}
                        >
                          {permission.active ? (
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
                        onClick={() => onDelete(permission)}
                        aria-label={`Delete ${permission.key}`}
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