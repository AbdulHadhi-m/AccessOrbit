"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FolderTree, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchInput } from "@/components/data-table/search-input";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission, usePermissionError } from "@/hooks/use-permission";
import { invalidate } from "@/stores/query-store";
import { cn } from "@/lib/utils";

import { rolesService } from "../service";
import { useRolePermissions, useModuleHierarchy } from "../hooks";
import type { RoleDto } from "@/types/roles";
import type {
  HierarchyModule,
  HierarchyOperation,
  HierarchyPermission,
  HierarchySubModule,
} from "@/types/rbac";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDto;
}

function countAssignedInOperation(
  operation: HierarchyOperation,
  assignedByKey: Map<string, HierarchyPermission>
) {
  return operation.permissions.filter((permission) => assignedByKey.has(permission.key)).length;
}

export function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
  const { hasPermission } = usePermission();
  const canAssign = hasPermission(PERMISSIONS.rolePermissions.assign);
  const canRemove = hasPermission(PERMISSIONS.rolePermissions.remove);

  const {
    data: hierarchy,
    status: hierarchyStatus,
    refetch: refetchHierarchy,
  } = useModuleHierarchy();
  const { data: assigned, status: assignedStatus } = useRolePermissions(role.id);

  const reportAssignmentError = usePermissionError("Unable to update the permission assignment.");

  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  const assignedByKey = useMemo(() => {
    const map = new Map<string, HierarchyPermission>();
    for (const item of assigned ?? []) {
      if (item.enabled && item.permission) {
        map.set(item.permissionKey, item.permission);
      }
    }
    return map;
  }, [assigned]);

  const totalAssigned = assignedByKey.size;

  const matchesFilter = (permission: HierarchyPermission) => {
    const query = filter.trim().toLowerCase();
    if (!query) return true;
    return (
      permission.key.toLowerCase().includes(query) ||
      permission.name.toLowerCase().includes(query)
    );
  };

  const handleToggle = async (permission: HierarchyPermission) => {
    const isAssigned = assignedByKey.has(permission.key);
    const actionAllowed = isAssigned ? canRemove : canAssign;
    if (!actionAllowed || pending.has(permission.key)) return;
    if (!role.active || !permission.active) return;

    setPending((current) => new Set(current).add(permission.key));
    try {
      if (isAssigned) {
        await rolesService.removePermission(role.id, permission.id);
        toast.success(`Permission removed: ${permission.key}`);
      } else {
        await rolesService.assignPermission(role.id, { permissionKey: permission.key });
        toast.success(`Permission assigned: ${permission.key}`);
      }
      invalidate(`role-permissions:${role.id}`, "roles");
    } catch (error) {
      toast.error(reportAssignmentError(error));
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(permission.key);
        return next;
      });
    }
  };

  const toggleModule = (moduleId: string) => {
    setCollapsedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const renderPermission = (permission: HierarchyPermission) => {
    const isAssigned = assignedByKey.has(permission.key);
    const busy = pending.has(permission.key);
    const actionAllowed = isAssigned ? canRemove : canAssign;
    const canToggle = actionAllowed && role.active && permission.active && !busy;

    return (
      <li key={permission.id} className="flex items-center justify-between gap-3 py-2">
        <label
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2.5 text-sm",
            canToggle && "cursor-pointer"
          )}
        >
          <Checkbox
            checked={isAssigned}
            onCheckedChange={() => void handleToggle(permission)}
            disabled={!canToggle}
            aria-label={isAssigned ? `Remove ${permission.key}` : `Assign ${permission.key}`}
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0">
            <span className="block truncate font-mono text-xs font-medium">{permission.key}</span>
            <span className="block truncate text-xs text-muted-foreground">{permission.name}</span>
          </span>
        </label>
        <span className="flex shrink-0 items-center gap-1.5">
          {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          {!permission.active && <Badge variant="outline">Inactive</Badge>}
          {isAssigned && <Badge variant="secondary">Assigned</Badge>}
        </span>
      </li>
    );
  };

  const renderOperation = (operation: HierarchyOperation) => {
    const visible = operation.permissions.filter(matchesFilter);
    const assignedCount = countAssignedInOperation(operation, assignedByKey);

    if (filter.trim() && visible.length === 0) return null;

    return (
      <div key={operation.id} className="rounded-md border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <span className="truncate">{operation.name}</span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
              {operation.key}
            </span>
          </span>
          <Badge variant="outline" className="shrink-0 tabular-nums">
            {assignedCount}/{operation.permissions.length}
          </Badge>
        </div>
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">No permissions defined</p>
        ) : (
          <ul className="divide-y divide-border/60">{visible.map(renderPermission)}</ul>
        )}
      </div>
    );
  };

  const renderSubModule = (subModule: HierarchySubModule) => {
    const operations = subModule.operations
      .map(renderOperation)
      .filter(Boolean);

    if (filter.trim() && operations.length === 0) return null;

    return (
      <Collapsible key={subModule.id} defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted/40">
          <span className="flex min-w-0 items-center gap-2">
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform in-data-open:rotate-180" />
            <span className="truncate">{subModule.name}</span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
              {subModule.key}
            </span>
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-3 space-y-2 border-l border-border/60 py-2 pl-4">
          {operations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No operations yet</p>
          ) : (
            operations
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderModule = (module: HierarchyModule) => {
    const moduleAssigned = [
      ...module.operations,
      ...module.subModules.flatMap((subModule) => subModule.operations),
    ].reduce(
      (sum, operation) => sum + countAssignedInOperation(operation, assignedByKey),
      0
    );
    const moduleTotal = [
      ...module.operations,
      ...module.subModules.flatMap((subModule) => subModule.operations),
    ].reduce((sum, operation) => sum + operation.permissions.length, 0);

    const isExpanded = !collapsedModules.has(module.id) || Boolean(filter.trim());

    return (
      <Collapsible
        key={module.id}
        open={isExpanded}
        onOpenChange={() => toggleModule(module.id)}
      >
        <section className="overflow-hidden rounded-lg border">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 bg-muted/30 px-3 py-3 text-left hover:bg-muted/50">
            <span className="flex min-w-0 items-center gap-2">
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
              <span className="truncate text-sm font-semibold">{module.name}</span>
              <span className="hidden shrink-0 font-mono text-xs font-normal text-muted-foreground md:inline">
                {module.key}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {!module.active && <Badge variant="outline">Inactive</Badge>}
              <Badge variant="secondary" className="tabular-nums">
                {moduleAssigned}/{moduleTotal} assigned
              </Badge>
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 p-3">
            {module.subModules.map(renderSubModule)}
            {module.operations.length > 0 && (
              <div className="space-y-2">
                {module.subModules.length > 0 && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Module-level operations
                  </p>
                )}
                {module.operations.map(renderOperation)}
              </div>
            )}
            {module.subModules.length === 0 && module.operations.length === 0 && (
              <p className="text-xs text-muted-foreground">No operations yet</p>
            )}
          </CollapsibleContent>
        </section>
      </Collapsible>
    );
  };

  const loading = hierarchyStatus === "loading" || assignedStatus === "loading";
  const errorState =
    hierarchyStatus === "error"
      ? "Unable to load the permission hierarchy."
      : assignedStatus === "error"
        ? "Unable to load the role's assigned permissions."
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Permissions — {role.name}</DialogTitle>
          <DialogDescription>
            Assign or remove permissions for this role.{" "}
            <span className="font-medium text-foreground">{totalAssigned} assigned</span> in total.
          </DialogDescription>
        </DialogHeader>

        {!role.active && (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            This role is inactive. Assignments are disabled until the role is activated.
          </p>
        )}
        {!canAssign && !canRemove && (
          <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            You can view assignments but do not have permission to change them.
          </p>
        )}

        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Filter by permission key or name..."
        />

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {!loading && errorState && (
            <ErrorState compact message={errorState} onRetry={refetchHierarchy} />
          )}
          {!loading && !errorState && (hierarchy?.length ?? 0) === 0 && (
            <EmptyState
              compact
              icon={FolderTree}
              title="No modules defined"
              description="Create modules and permissions first."
            />
          )}
          {!loading && !errorState && hierarchy?.map(renderModule)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
