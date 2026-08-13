"use client";

import Link from "next/link";
import { ChevronRight, KeyRound, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { UserDto } from "@/types/users";
import type { RoleDto } from "@/types/roles";
import type { PermissionDto } from "@/types/rbac";
import type { DashboardOverview } from "../types/dashboard";

interface RecentItem {
  id?: string;
  createdAt: string;
}

interface RecentListProps<T extends RecentItem> {
  title: string;
  description: string;
  icon: typeof Users;
  viewAllHref: string;
  items: T[];
  loading: boolean;
  renderPrimary: (item: T) => string;
  renderSecondary: (item: T) => string;
  renderBadge?: (item: T) => React.ReactNode;
  emptyLabel: string;
}

function RecentList<T extends RecentItem>({
  title,
  description,
  icon: Icon,
  viewAllHref,
  items,
  loading,
  renderPrimary,
  renderSecondary,
  renderBadge,
  emptyLabel,
}: RecentListProps<T>) {
  return (
    <Card className="flex flex-col shadow-xs transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-4">
        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item, idx) => (
              <li key={item.id ?? `${item.createdAt}-${idx}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{renderPrimary(item)}</p>
                  <p className="truncate text-xs text-muted-foreground">{renderSecondary(item)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {renderBadge?.(item)}
                  <span className="text-xs text-muted-foreground/75 tabular-nums">{formatRelativeTime(item.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
        >
          View all
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

interface RecentListsProps {
  data: DashboardOverview;
  access: { users: boolean; roles: boolean; permissions: boolean };
  loading: boolean;
}

export function RecentLists({ data, access, loading }: RecentListsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {access.users && (
        <RecentList<UserDto>
          title="Recent users"
          description="Newest accounts"
          icon={Users}
          viewAllHref="/users"
          items={data.users?.recent ?? []}
          loading={loading}
          renderPrimary={(user) => user.name}
          renderSecondary={(user) => user.email}
          renderBadge={(user) =>
            user.status === "suspended" ? (
              <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                Suspended
              </Badge>
            ) : null
          }
          emptyLabel="No users have been created yet."
        />
      )}
      {access.roles && (
        <RecentList<RoleDto>
          title="Recent roles"
          description="Newest roles"
          icon={Shield}
          viewAllHref="/roles"
          items={data.roles?.recent ?? []}
          loading={loading}
          renderPrimary={(role) => role.name}
          renderSecondary={(role) => role.slug}
          renderBadge={(role) =>
            role.active ? null : (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                Inactive
              </Badge>
            )
          }
          emptyLabel="No roles have been created yet."
        />
      )}
      {access.permissions && (
        <RecentList<PermissionDto>
          title="Recent permissions"
          description="Newest permission codes"
          icon={KeyRound}
          viewAllHref="/permissions"
          items={data.permissions?.recent ?? []}
          loading={loading}
          renderPrimary={(permission) => permission.key}
          renderSecondary={(permission) => permission.name}
          renderBadge={(permission) =>
            permission.active ? null : (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                Inactive
              </Badge>
            )
          }
          emptyLabel="No permissions have been created yet."
        />
      )}
    </div>
  );
}