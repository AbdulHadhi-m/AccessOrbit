"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatPermissionAction,
  groupPermissionsByModule,
  type PermissionGroup,
} from "@/lib/permissions";

interface EffectivePermissionsPanelProps {
  permissions: string[];
  loading?: boolean;
  compact?: boolean;
}

function PermissionGroupList({ groups, compact }: { groups: PermissionGroup[]; compact?: boolean }) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No effective permissions assigned.</p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {groups.map((group) => (
        <section key={group.moduleKey}>
          <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.label}
          </h4>
          <ul className="flex flex-wrap gap-1.5">
            {group.permissions.map((key) => (
              <li key={key}>
                <Badge variant="secondary" className="font-mono text-xs font-normal">
                  {formatPermissionAction(key)}
                  <span className="sr-only"> ({key})</span>
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function EffectivePermissionsPanel({
  permissions,
  loading = false,
  compact = false,
}: EffectivePermissionsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const groups = groupPermissionsByModule(permissions);
  return <PermissionGroupList groups={groups} compact={compact} />;
}
