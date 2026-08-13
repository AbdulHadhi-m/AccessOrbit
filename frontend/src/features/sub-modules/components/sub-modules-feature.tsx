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
import { invalidate } from "@/lib/query/query-client";

import { subModulesService } from "../service";
import { useSubModulesList } from "../hooks";
import { useModuleOptions } from "@/features/modules/hooks";
import { SubModulesTable } from "./sub-modules-table";
import { SubModuleFormDialog } from "./sub-module-form-dialog";
import type { SubModuleDto } from "@/types/rbac";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; subModule: SubModuleDto }
  | { kind: "delete"; subModule: SubModuleDto }
  | null;

const PAGE_SIZE = 20;

export function SubModulesFeature() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.subModules.create);
  const canUpdate = hasPermission(PERMISSIONS.subModules.update);
  const canDelete = hasPermission(PERMISSIONS.subModules.delete);

  const reportStatusError = usePermissionError("Unable to update the sub-module's status.");
  const reportDeleteError = usePermissionError("Unable to delete the sub-module.");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: moduleOptions } = useModuleOptions();
  const { data, error, status: queryStatus, refetch } = useSubModulesList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    moduleId: moduleFilter || undefined,
  });

  const loading = queryStatus === "loading";

  const handleToggleStatus = async (subModule: SubModuleDto) => {
    try {
      await subModulesService.update(subModule.id, { active: !subModule.active });
      toast.success(subModule.active ? "Sub-module deactivated" : "Sub-module activated");
      invalidate("sub-modules", "modules:hierarchy");
    } catch (error) {
      toast.error(reportStatusError(error));
    }
  };

  const handleDelete = async (subModule: SubModuleDto) => {
    try {
      await subModulesService.remove(subModule.id);
      toast.success("Sub-module deleted");
      invalidate("sub-modules", "modules:hierarchy");
    } catch (error) {
      toast.error(reportDeleteError(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Sub-modules group operations within a module.{" "}
          <span className="font-medium text-foreground">{data?.total ?? 0}</span> total.
        </p>
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create sub-module
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
              placeholder="Search sub-modules..."
            />
            <SelectFilter
              value={moduleFilter}
              onValueChange={(value) => {
                setModuleFilter(value === "__all__" ? "" : value);
                setPage(1);
              }}
              options={moduleOptions?.map((module) => ({ value: module.id, label: module.name })) ?? []}
              placeholder="Module"
              ariaLabel="Filter by module"
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
        <SubModulesTable
          data={data?.items ?? []}
          modules={moduleOptions ?? []}
          loading={loading}
          error={error}
          onRetry={refetch}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={(subModule) => setDialog({ kind: "edit", subModule })}
          onToggleStatus={(subModule) => void handleToggleStatus(subModule)}
          onDelete={(subModule) => setDialog({ kind: "delete", subModule })}
        />
      </DataPanel>

      {dialog?.kind === "create" && (
        <SubModuleFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          subModule={null}
        />
      )}
      {dialog?.kind === "edit" && (
        <SubModuleFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          subModule={dialog.subModule}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete sub-module"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium">{dialog.subModule.name}</span>? Sub-modules containing
              operations cannot be deleted.
            </>
          }
          confirmLabel="Delete sub-module"
          onConfirm={() => handleDelete(dialog.subModule)}
        />
      )}
    </div>
  );
}