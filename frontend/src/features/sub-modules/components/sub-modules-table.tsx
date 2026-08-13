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
import type { SubModuleDto, ModuleDto } from "@/types/rbac";

interface SubModulesTableProps {
  data: SubModuleDto[];
  modules: ModuleDto[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (subModule: SubModuleDto) => void;
  onToggleStatus: (subModule: SubModuleDto) => void;
  onDelete: (subModule: SubModuleDto) => void;
}

export function SubModulesTable({
  data,
  modules,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  onEdit,
  onToggleStatus,
  onDelete,
}: SubModulesTableProps) {
  const colSpan = 6;
  const showSkeleton = loading && data.length === 0;
  const moduleName = (moduleId: string) =>
    modules.find((module) => module.id === moduleId)?.name ?? "—";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sub-module</TableHead>
          <TableHead>Module</TableHead>
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
          <TableEmpty title="No sub-modules found" colSpan={colSpan} />
        )}
        {!showSkeleton &&
          !error &&
          data.map((subModule) => (
            <TableRow key={subModule.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{subModule.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{subModule.key}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {moduleName(subModule.moduleId)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{subModule.order}</TableCell>
              <TableCell>
                <StatusBadge status={subModule.active ? "active" : "inactive"} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(subModule)}
                        aria-label={`Edit ${subModule.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleStatus(subModule)}
                        aria-label={
                          subModule.active
                            ? `Deactivate ${subModule.name}`
                            : `Activate ${subModule.name}`
                        }
                        title={subModule.active ? "Deactivate" : "Activate"}
                      >
                        {subModule.active ? (
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
                      onClick={() => onDelete(subModule)}
                      aria-label={`Delete ${subModule.name}`}
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