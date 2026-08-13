"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SearchInput } from "@/components/data-table/search-input";
import { SelectFilter } from "@/components/data-table/select-filter";
import { PaginationControls } from "@/components/data-table/pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission, usePermissionError } from "@/hooks/use-permission";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { invalidate } from "@/lib/query/query-client";

import { usersService } from "../service";
import { useUsersList } from "../hooks";
import { useRoleOptions } from "@/features/roles/hooks";
import { UsersTable } from "./users-table";
import { UserFormDialog } from "./user-form-dialog";
import { UserRolesDialog } from "./user-roles-dialog";
import { UserDetailsDialog } from "./user-details-dialog";
import type { UserDto } from "@/types/users";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; user: UserDto }
  | { kind: "roles"; user: UserDto }
  | { kind: "details"; user: UserDto }
  | { kind: "delete"; user: UserDto }
  | null;

const PAGE_SIZE = 20;

export function UsersFeature() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.users.create);
  const canUpdate = hasPermission(PERMISSIONS.users.update);
  const canDelete = hasPermission(PERMISSIONS.users.delete);
  const canAssignRoles = hasPermission(PERMISSIONS.users.assignRoles);

  const reportStatusError = usePermissionError("Unable to update the user's status.");
  const reportDeleteError = usePermissionError("Unable to delete the user.");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: roleOptions } = useRoleOptions();
  const { data, error, status: queryStatus, refetch } = useUsersList({
    page,
    limit: roleFilter ? 100 : PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    sort,
    order,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    if (!roleFilter) return data.items;
    return data.items.filter((user) => user.roles.some((role) => role.id === roleFilter));
  }, [data, roleFilter]);

  const total = roleFilter ? rows.length : data?.total ?? 0;
  const totalPages = roleFilter ? 1 : data?.totalPages ?? 1;
  const loading = queryStatus === "loading";

  const handleSortChange = (nextSort: string, nextOrder: "asc" | "desc") => {
    setSort(nextSort);
    setOrder(nextOrder);
    setPage(1);
  };

  const handleToggleStatus = async (user: UserDto) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      await usersService.update(user.id, { status: nextStatus });
      toast.success(nextStatus === "active" ? "User activated" : "User suspended");
      invalidate("users");
    } catch (error) {
      toast.error(reportStatusError(error));
    }
  };

  const handleDelete = async (user: UserDto) => {
    try {
      await usersService.remove(user.id);
      toast.success("User deleted");
      invalidate("users");
    } catch (error) {
      toast.error(reportDeleteError(error));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, and access status."
      >
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create user
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <SelectFilter
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value === "__all__" ? "" : value);
                  setPage(1);
                }}
                options={[
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ]}
                placeholder="Status"
                ariaLabel="Filter by status"
              />
              <SelectFilter
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value === "__all__" ? "" : value);
                  setPage(1);
                }}
                options={
                  roleOptions?.map((role) => ({ value: role.id, label: role.name })) ?? []
                }
                placeholder="Role"
                ariaLabel="Filter by role"
              />
            </div>
          </div>

          <div className="rounded-lg border">
            <UsersTable
              data={rows}
              total={total}
              loading={loading}
              error={error}
              onRetry={refetch}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canAssignRoles={canAssignRoles}
              sort={sort}
              order={order}
              onSortChange={handleSortChange}
              onView={(user) => setDialog({ kind: "details", user })}
              onEdit={(user) => setDialog({ kind: "edit", user })}
              onManageRoles={(user) => setDialog({ kind: "roles", user })}
              onToggleStatus={(user) => void handleToggleStatus(user)}
              onDelete={(user) => setDialog({ kind: "delete", user })}
            />
          </div>

          {!roleFilter && (
            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={total}
              limit={PAGE_SIZE}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
          {roleFilter && rows.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {rows.length} result{rows.length === 1 ? "" : "s"} for the selected role.
            </p>
          )}
        </CardContent>
      </Card>

      {dialog?.kind === "create" && (
        <UserFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          user={null}
        />
      )}
      {dialog?.kind === "edit" && (
        <UserFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          user={dialog.user}
        />
      )}
      {dialog?.kind === "roles" && (
        <UserRolesDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          user={dialog.user}
        />
      )}
      {dialog?.kind === "details" && (
        <UserDetailsDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          user={dialog.user}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete user"
          description={
            <>
              Are you sure you want to delete <span className="font-medium">{dialog.user.name}</span>?
              This action cannot be undone and will revoke the user&apos;s sessions.
            </>
          }
          confirmLabel="Delete user"
          onConfirm={() => handleDelete(dialog.user)}
        />
      )}
    </div>
  );
}