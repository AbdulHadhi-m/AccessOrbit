"use client";

import { Eye, Pencil, ShieldCheck, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
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
import { formatDate } from "@/lib/utils";
import type { UserDto } from "@/types/users";

interface UsersTableProps {
  data: UserDto[];
  total: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  canAssignRoles: boolean;
  sort: string | undefined;
  order: "asc" | "desc";
  onSortChange: (sortKey: string, order: "asc" | "desc") => void;
  onView: (user: UserDto) => void;
  onEdit: (user: UserDto) => void;
  onManageRoles: (user: UserDto) => void;
  onToggleStatus: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
}

export function UsersTable({
  data,
  total,
  loading,
  error,
  onRetry,
  canUpdate,
  canDelete,
  canAssignRoles,
  sort,
  order,
  onSortChange,
  onView,
  onEdit,
  onManageRoles,
  onToggleStatus,
  onDelete,
}: UsersTableProps) {
  const colSpan = 6;
  const showSkeleton = loading && data.length === 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader label="User" sortKey="name" sort={sort} order={order} onSortChange={onSortChange} />
          </TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>
            <SortHeader
              label="Status"
              sortKey="status"
              sort={sort}
              order={order}
              onSortChange={onSortChange}
            />
          </TableHead>
          <TableHead>Last login</TableHead>
          <TableHead>
            <SortHeader
              label="Created"
              sortKey="createdAt"
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
          <TableEmpty
            title={total > 0 ? "No users match the role filter" : "No users found"}
            colSpan={colSpan}
          />
        )}
        {!showSkeleton &&
          !error &&
          data.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex max-w-56 flex-wrap gap-1">
                  {user.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">No roles</span>
                  )}
                  {user.roles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={user.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(user.lastLoginAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onView(user)}
                    aria-label={`View details for ${user.name}`}
                    title="View details"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Button>
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onToggleStatus(user)}
                        aria-label={
                          user.status === "active"
                            ? `Suspend ${user.name}`
                            : `Activate ${user.name}`
                        }
                        title={user.status === "active" ? "Suspend" : "Activate"}
                      >
                        {user.status === "active" ? (
                          <UserRoundX className="size-4" aria-hidden="true" />
                        ) : (
                          <UserRoundCheck className="size-4" aria-hidden="true" />
                        )}
                      </Button>
                    </>
                  )}
                  {canAssignRoles && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onManageRoles(user)}
                      aria-label={`Manage roles for ${user.name}`}
                      title="Manage roles"
                    >
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(user)}
                      aria-label={`Delete ${user.name}`}
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