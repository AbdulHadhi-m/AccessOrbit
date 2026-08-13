"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { operationsService } from "../service";
import { useOperationsList } from "../hooks";
import { useModuleOptions } from "@/features/modules/hooks";
import { useSubModuleOptions } from "@/features/sub-modules/hooks";
import { OperationsTable } from "./operations-table";
import { OperationFormDialog } from "./operation-form-dialog";
import type { OperationDto } from "@/types/rbac";

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; operation: OperationDto }
  | { kind: "delete"; operation: OperationDto }
  | null;

const PAGE_SIZE = 20;

export function OperationsFeature() {
  const { can } = useSession();
  const canCreate = can(PERMISSIONS.operations.create);
  const canUpdate = can(PERMISSIONS.operations.update);
  const canDelete = can(PERMISSIONS.operations.delete);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [moduleFilter, setModuleFilter] = useState("");
  const [subModuleFilter, setSubModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data: moduleOptions } = useModuleOptions();
  const { data: subModuleOptions } = useSubModuleOptions();
  const { data, error, status: queryStatus, refetch } = useOperationsList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    moduleId: moduleFilter || undefined,
    subModuleId: subModuleFilter || undefined,
  });

  const filteredSubModules = useMemo(
    () =>
      moduleFilter
        ? (subModuleOptions ?? []).filter((subModule) => subModule.moduleId === moduleFilter)
        : (subModuleOptions ?? []),
    [moduleFilter, subModuleOptions]
  );

  const loading = queryStatus === "loading";

  const handleToggleStatus = async (operation: OperationDto) => {
    try {
      await operationsService.update(operation.id, { active: !operation.active });
      toast.success(operation.active ? "Operation deactivated" : "Operation activated");
      invalidate("operations", "modules:hierarchy");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to update the operation's status."));
    }
  };

  const handleDelete = async (operation: OperationDto) => {
    try {
      await operationsService.remove(operation.id);
      toast.success("Operation deleted");
      invalidate("operations", "modules:hierarchy");
    } catch (error) {
      toast.error(toErrorMessage(error, "Unable to delete the operation."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Operations are the actions a module exposes.{" "}
          <span className="font-medium text-foreground">{data?.total ?? 0}</span> total.
        </p>
        {canCreate && (
          <Button onClick={() => setDialog({ kind: "create" })}>
            <Plus className="size-4" aria-hidden="true" />
            Create operation
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search operations..."
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
            </div>
          </div>

          <div className="rounded-lg border">
            <OperationsTable
              data={data?.items ?? []}
              modules={moduleOptions ?? []}
              subModules={subModuleOptions ?? []}
              loading={loading}
              error={error}
              onRetry={refetch}
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={(operation) => setDialog({ kind: "edit", operation })}
              onToggleStatus={(operation) => void handleToggleStatus(operation)}
              onDelete={(operation) => setDialog({ kind: "delete", operation })}
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
        <OperationFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          operation={null}
        />
      )}
      {dialog?.kind === "edit" && (
        <OperationFormDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          operation={dialog.operation}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Delete operation"
          description={
            <>
              Are you sure you want to delete{" "}
              <span className="font-medium">{dialog.operation.name}</span>? Operations referenced by
              permissions cannot be deleted.
            </>
          }
          confirmLabel="Delete operation"
          onConfirm={() => handleDelete(dialog.operation)}
        />
      )}
    </div>
  );
}