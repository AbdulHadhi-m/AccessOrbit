"use client";

import { KeyRound, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
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
import { SortHeader } from "@/components/data-table/sort-header";
import type { RoleDto } from "@/types/roles";

interface RolesTableProps {
  data: RoleDto[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  sort: string | undefined;
  order: "asc" | "desc";
  onSortChange: (sortKey: string, order: "asc" | "desc") => void;
  onEdit: (role: RoleDto) => void;
  onManagePermissions: (role: RoleDto) => void;
  onToggleStatus: (role: RoleDto) => void;
  onDelete: (role: RoleDto) => void;
}

export function RolesTable({
  data,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  canManagePermissions,
  sort,
  order,
  onSortChange,
  onEdit,
  onManagePermissions,
  onToggleStatus,
  onDelete,
}: RolesTableProps) {
  const colSpan = 6;
  const showSkeleton = loading && data.length === 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader label="Role" sortKey="name" sort={sort} order={order} onSortChange={onSortChange} />
          </TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>
            <SortHeader
              label="Status"
              sortKey="active"
              sort={sort}
              order={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {showSkeleton && <TableSkeleton rows={5} columns={colSpan} />}
        {!showSkeleton && error && (
          <TableError message={error.message} onRetry={onRetry} colSpan={colSpan} />
        )}
        {!showSkeleton && !error && data.length === 0 && (
          <TableEmpty title="No roles found" colSpan={colSpan} />
        )}
        {!showSkeleton &&
          !error &&
          data.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{role.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{role.slug}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-64 text-muted-foreground">
                <span className="line-clamp-2">{role.description || "—"}</span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
                  <KeyRound className="size-3.5" aria-hidden="true" />
                  {role.permissionKeys.length}
                </span>
              </TableCell>
              <TableCell>
                {role.isSystem ? (
                  <Badge variant="outline">System</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Custom</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={role.active ? "active" : "inactive"} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canManagePermissions && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onManagePermissions(role)}
                      aria-label={`Manage permissions for ${role.name}`}
                      title="Manage permissions"
                    >
                      <KeyRound className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(role)}
                        aria-label={`Edit ${role.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleStatus(role)}
                        aria-label={role.active ? `Deactivate ${role.name}` : `Activate ${role.name}`}
                        title={role.active ? "Deactivate" : "Activate"}
                      >
                        {role.active ? (
                          <PowerOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Power className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </>
                  )}
                  {canDelete && !role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(role)}
                      aria-label={`Delete ${role.name}`}
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