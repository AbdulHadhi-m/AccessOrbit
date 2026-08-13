"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/data-table/search-input";
import { PERMISSIONS } from "@/config/permissions";
import { useSession } from "@/hooks/use-session";
import { invalidate } from "@/lib/query/query-client";
import { toErrorMessage } from "@/lib/errors";
import { rolesService } from "../service";
import { useRolePermissions, useModuleHierarchy } from "../hooks";
import type { RoleDto } from "@/types/roles";
import type { HierarchyOperation, HierarchyPermission } from "@/types/rbac";

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleDto;
}

export function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
  const { can } = useSession();
  const canAssign = can(PERMISSIONS.rolePermissions.assign);
  const canRemove = can(PERMISSIONS.rolePermissions.remove);

  const {
    data: hierarchy,
    status: hierarchyStatus,
    refetch: refetchHierarchy,
  } = useModuleHierarchy();
  const {
    data: assigned,
    status: assignedStatus,
  } = useRolePermissions(role.id);

  const [filter, setFilter] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());

  const assignedByKey = useMemo(() => {
    const map = new Map<string, HierarchyPermission>();
    for (const item of assigned ?? []) {
      if (item.enabled && item.permission) {
        map.set(item.permissionKey, item.permission);
      }
    }
    return map;
  }, [assigned]);

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
      toast.error(toErrorMessage(error, "Unable to update the permission assignment."));
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(permission.key);
        return next;
      });
    }
  };

  const renderPermission = (permission: HierarchyPermission) => {
    const isAssigned = assignedByKey.has(permission.key);
    const busy = pending.has(permission.key);
    const actionAllowed = isAssigned ? canRemove : canAssign;
    const canToggle = actionAllowed && role.active && permission.active && !busy;

    return (
      <li key={permission.id} className="flex items-center justify-between gap-3 py-1">
        <label
          className={`flex min-w-0 flex-1 items-start gap-2.5 text-sm ${
            canToggle ? "cursor-pointer" : ""
          }`}
        >
          <Checkbox
            checked={isAssigned}
            onCheckedChange={() => void handleToggle(permission)}
            disabled={!canToggle}
            aria-label={
              isAssigned ? `Remove ${permission.key}` : `Assign ${permission.key}`
            }
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0">
            <span className="block truncate font-mono text-xs font-medium">{permission.key}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {permission.name}
            </span>
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
    const assignedCount = operation.permissions.filter((permission) =>
      assignedByKey.has(permission.key)
    ).length;

    return (
      <div key={operation.id} className="rounded-md border bg-muted/30 p-2">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <span className="truncate">{operation.name}</span>
            <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
              {operation.key}
            </span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {assignedCount}/{operation.permissions.length}
          </span>
        </div>
        {visible.length === 0 ? (
          <p className="px-1 py-1.5 text-xs text-muted-foreground">
            {operation.permissions.length === 0
              ? "No permissions"
              : "No permissions match the filter"}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {visible.map(renderPermission)}
          </ul>
        )}
      </div>
    );
  };

  const loading = hierarchyStatus === "loading" || assignedStatus === "loading";
  const errorState =
    hierarchyStatus === "error"
      ? new Error("Unable to load the permission hierarchy.")
      : assignedStatus === "error"
        ? new Error("Unable to load the role's assigned permissions.")
        : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Permissions — {role.name}</DialogTitle>
          <DialogDescription>
            Assign or remove permissions for this role. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        {!role.active && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
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
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-destructive">{errorState.message}</p>
              <Button variant="outline" size="sm" onClick={refetchHierarchy}>
                Retry
              </Button>
            </div>
          )}
          {!loading && !errorState && (hierarchy?.length ?? 0) === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No modules defined yet. Create modules and permissions first.
            </p>
          )}
          {!loading &&
            !errorState &&
            hierarchy?.map((module) => (
              <section key={module.id} className="rounded-lg border p-3">
                <header className="flex items-center justify-between gap-2 pb-2">
                  <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{module.name}</span>
                    <span className="hidden shrink-0 font-mono text-xs font-normal text-muted-foreground md:inline">
                      {module.key}
                    </span>
                  </h3>
                  {!module.active && <Badge variant="outline">Inactive</Badge>}
                </header>
                {module.subModules.length === 0 && module.operations.length === 0 && (
                  <p className="px-1 pb-1 text-xs text-muted-foreground">No operations yet</p>
                )}
                {module.subModules.map((subModule) => (
                  <div key={subModule.id} className="ml-1 space-y-2 border-l pl-3">
                    <h4 className="flex items-center gap-2 pt-1 text-sm font-medium">
                      <span className="truncate">{subModule.name}</span>
                      <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
                        {subModule.key}
                      </span>
                    </h4>
                    {subModule.operations.length === 0 && (
                      <p className="px-1 pb-1 text-xs text-muted-foreground">No operations yet</p>
                    )}
                    <div className="space-y-2 pb-2">
                      {subModule.operations.map(renderOperation)}
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  {module.operations.map(renderOperation)}
                </div>
              </section>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}