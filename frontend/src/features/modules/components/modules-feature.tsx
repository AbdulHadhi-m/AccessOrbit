"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataPanel } from "@/components/data-panel";
import { SearchInput } from "@/components/data-table/search-input";
import { SelectFilter } from "@/components/data-table/select-filter";
import { PaginationControls } from "@/components/data-table/pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission, usePermissionError } from "@/hooks/use-permission";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { invalidate } from "@/stores/query-store";

import { modulesService } from "../service";
import { useModulesList } from "../hooks";
import { ModulesTable } from "./modules-table";
import { ModuleFormDialog } from "./module-form-dialog";
import type { ModuleDto } from "@/types/rbac";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; module: ModuleDto }
  | { kind: "delete"; module: ModuleDto }
  | null;

const PAGE_SIZE = 20;

export function ModulesFeature() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.modules.create);
  const canUpdate = hasPermission(PERMISSIONS.modules.update);
  const canDelete = hasPermission(PERMISSIONS.modules.delete);

  const reportStatusError = usePermissionError("Unable to update the module's status.");
  const reportDeleteError = usePermissionError("Unable to delete the module.");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, error, status: queryStatus, refetch } = useModulesList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const loading = queryStatus === "loading";

  const handleToggleStatus = async (module: ModuleDto) => {
    try {
      await modulesService.update(module.id, { active: !module.active });
      toast.success(module.active ? "Module deactivated" : "Module activated");
      invalidate("modules", "modules:hierarchy");
    } catch (error) {
      toast.error(reportStatusError(error));
    }
  };

  const handleDelete = async (module: ModuleDto) => {
    try {
      await modulesService.remove(module.id);
      toast.success("Module deleted");
      invalidate("modules", "modules:hierarchy");
    } catch (error) {
      toast.error(reportDeleteError(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Top-level permission groupings.{" "}
          <span className="font-medium text-foreground">{data?.total ?? 0}</span> total.
        </p>
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create module
          </Button>
        )}
      </div>

      <DataPanel
        toolbar={
          <div className="table-toolbar">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search modules..."
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
        }
        footer={
          <PaginationControls
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total ?? 0}
            limit={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <ModulesTable
          data={data?.items ?? []}
          loading={loading}
          error={error}
          onRetry={refetch}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={(module) => setDialog({ kind: "edit", module })}
          onToggleStatus={(module) => void handleToggleStatus(module)}
          onDelete={(module) => setDialog({ kind: "delete", module })}
        />
      </DataPanel>

      {dialog?.kind === "create" && (
        <ModuleFormDialog open onOpenChange={(open) => !open && setDialog(null)} module={null} />
      )}
      {dialog?.kind === "edit" && (
        <ModuleFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          module={dialog.module}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete module"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium">{dialog.module.name}</span>? Modules referenced by
              sub-modules, operations, or permissions cannot be deleted.
            </>
          }
          confirmLabel="Delete module"
          onConfirm={() => handleDelete(dialog.module)}
        />
      )}
    </div>
  );
}