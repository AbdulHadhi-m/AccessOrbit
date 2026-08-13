"use client";

import { useState } from "react";
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
import { useSession } from "@/hooks/use-session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { invalidate } from "@/lib/query/query-client";
import { toErrorMessage } from "@/lib/errors";
import { rolesService } from "../service";
import { useRolesList } from "../hooks";
import { RolesTable } from "./roles-table";
import { RoleFormDialog } from "./role-form-dialog";
import { RolePermissionsDialog } from "./role-permissions-dialog";
import type { RoleDto } from "@/types/roles";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; role: RoleDto }
  | { kind: "permissions"; role: RoleDto }
  | { kind: "delete"; role: RoleDto }
  | null;

const PAGE_SIZE = 20;

export function RolesFeature() {
  const { can } = useSession();
  const canCreate = can(PERMISSIONS.roles.create);
  const canUpdate = can(PERMISSIONS.roles.update);
  const canDelete = can(PERMISSIONS.roles.delete);
  const canManagePermissions = can(PERMISSIONS.rolePermissions.view);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, error, status: queryStatus, refetch } = useRolesList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    sort,
    order,
  });

  const loading = queryStatus === "loading";

  const handleSortChange = (nextSort: string, nextOrder: "asc" | "desc") => {
    setSort(nextSort);
    setOrder(nextOrder);
    setPage(1);
  };

  const handleToggleStatus = async (role: RoleDto) => {
    const nextActive = !role.active;
    try {
      await rolesService.update(role.id, { active: nextActive });
      toast.success(nextActive ? "Role activated" : "Role deactivated");
      invalidate("roles");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to update the role's status."));
    }
  };

  const handleDelete = async (role: RoleDto) => {
    try {
      await rolesService.remove(role.id);
      toast.success("Role deleted");
      invalidate("roles");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to delete the role."));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles"
        description="Define roles and control which permissions each role receives."
      >
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create role
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
              placeholder="Search roles..."
            />
            <SelectFilter
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value === "__all__" ? "" : value);
                setPage(1);
              }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Status"
              ariaLabel="Filter by status"
            />
          </div>

          <div className="rounded-lg border">
            <RolesTable
              data={data?.items ?? []}
              loading={loading}
              error={error}
              onRetry={refetch}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canManagePermissions={canManagePermissions}
              sort={sort}
              order={order}
              onSortChange={handleSortChange}
              onEdit={(role) => setDialog({ kind: "edit", role })}
              onManagePermissions={(role) => setDialog({ kind: "permissions", role })}
              onToggleStatus={(role) => void handleToggleStatus(role)}
              onDelete={(role) => setDialog({ kind: "delete", role })}
            />
          </div>

          <PaginationControls
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            limit={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {dialog?.kind === "create" && (
        <RoleFormDialog open onOpenChange={(open) => !open && setDialog(null)} role={null} />
      )}
      {dialog?.kind === "edit" && (
        <RoleFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          role={dialog.role}
        />
      )}
      {dialog?.kind === "permissions" && (
        <RolePermissionsDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          role={dialog.role}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete role"
          description={
            <>
              Are you sure you want to delete the role{" "}
              <span className="font-medium">{dialog.role.name}</span>? Roles assigned to users
              cannot be deleted — deactivate them instead.
            </>
          }
          confirmLabel="Delete role"
          onConfirm={() => handleDelete(dialog.role)}
        />
      )}
    </div>
  );
}