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
import { useSession } from "@/hooks/use-session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { invalidate } from "@/lib/query/query-client";
import { toErrorMessage } from "@/lib/errors";
import { permissionsService } from "../service";
import { usePermissionsList } from "../hooks";
import { useModuleOptions } from "@/features/modules/hooks";
import { useSubModuleOptions } from "@/features/sub-modules/hooks";
import { useOperationOptions } from "@/features/operations/hooks";
import { PermissionsTable } from "./permissions-table";
import { PermissionFormDialog } from "./permission-form-dialog";
import type { PermissionDto } from "@/types/rbac";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; permission: PermissionDto }
  | { kind: "delete"; permission: PermissionDto }
  | null;

const PAGE_SIZE = 20;

export function PermissionsFeature() {
  const { can } = useSession();
  const canCreate = can(PERMISSIONS.permissions.create);
  const canUpdate = can(PERMISSIONS.permissions.update);
  const canDelete = can(PERMISSIONS.permissions.delete);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [moduleFilter, setModuleFilter] = useState("");
  const [subModuleFilter, setSubModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: moduleOptions } = useModuleOptions();
  const { data: subModuleOptions } = useSubModuleOptions();
  const { data: operationOptions } = useOperationOptions();
  const { data, error, status: queryStatus, refetch } = usePermissionsList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    moduleId: moduleFilter || undefined,
    status: statusFilter || undefined,
  });

  const filteredSubModules = useMemo(
    () =>
      moduleFilter
        ? (subModuleOptions ?? []).filter((subModule) => subModule.moduleId === moduleFilter)
        : (subModuleOptions ?? []),
    [moduleFilter, subModuleOptions]
  );

  const pagePermissions = useMemo(
    () =>
      subModuleFilter
        ? (data?.items ?? []).filter((permission) => {
            const operation = operationOptions?.find(
              (item) => item.id === permission.operationId
            );
            return operation?.subModuleId === subModuleFilter;
          })
        : (data?.items ?? []),
    [data, subModuleFilter, operationOptions]
  );

  const loading = queryStatus === "loading";

  const handleToggleStatus = async (permission: PermissionDto) => {
    try {
      await permissionsService.update(permission.id, { active: !permission.active });
      toast.success(permission.active ? "Permission deactivated" : "Permission activated");
      invalidate("permissions", "roles", "modules:hierarchy");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to update the permission's status."));
    }
  };

  const handleDelete = async (permission: PermissionDto) => {
    try {
      await permissionsService.remove(permission.id);
      toast.success("Permission deleted");
      invalidate("permissions", "roles", "modules:hierarchy");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to delete the permission."));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Permissions"
        description="Permission keys grant access to specific operations. Keys are referenced by roles."
      >
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create permission
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
              placeholder="Search permissions..."
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <SelectFilter
                value={moduleFilter}
                onValueChange={(value) => {
                  setModuleFilter(value === "__all__" ? "" : value);
                  setSubModuleFilter("");
                  setPage(1);
                }}
                options={moduleOptions?.map((module) => ({ value: module.id, label: module.name })) ?? []}
                placeholder="Module"
                ariaLabel="Filter by module"
              />
              <SelectFilter
                value={subModuleFilter}
                onValueChange={(value) => {
                  setSubModuleFilter(value === "__all__" ? "" : value);
                  setPage(1);
                }}
                options={filteredSubModules.map((subModule) => ({
                  value: subModule.id,
                  label: subModule.name,
                }))}
                placeholder="Sub-module"
                ariaLabel="Filter by sub-module"
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
          </div>

          <div className="rounded-lg border">
            <PermissionsTable
              data={pagePermissions}
              modules={moduleOptions ?? []}
              subModules={subModuleOptions ?? []}
              operations={operationOptions ?? []}
              loading={loading}
              error={error}
              onRetry={refetch}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={(permission) => setDialog({ kind: "edit", permission })}
              onToggleStatus={(permission) => void handleToggleStatus(permission)}
              onDelete={(permission) => setDialog({ kind: "delete", permission })}
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
        <PermissionFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          permission={null}
        />
      )}
      {dialog?.kind === "edit" && (
        <PermissionFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          permission={dialog.permission}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete permission"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-mono text-xs">{dialog.permission.key}</span>? Permissions
              assigned to roles cannot be deleted — deactivate them instead.
            </>
          }
          confirmLabel="Delete permission"
          onConfirm={() => handleDelete(dialog.permission)}
        />
      )}
    </div>
  );
}