"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Blocks,
  CalendarDays,
  Clock,
  KeyRound,
  Shield,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";
import { useSession } from "@/hooks/use-session";
import {
  formatPermissionAction,
  groupPermissionsByModule,
  type PermissionGroup,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<string, LucideIcon> = {
  rbac: Shield,
  employee: Users,
  attendance: Clock,
  leave: CalendarDays,
  audit: Activity,
};

const ADMIN_LINKS: Partial<Record<string, { href: string; label: string }>> = {
  rbac: { href: "/modules", label: "Open modules" },
};

interface CapabilityCardProps {
  group: PermissionGroup;
}

function CapabilityCard({ group }: CapabilityCardProps) {
  const Icon = MODULE_ICONS[group.moduleKey] ?? Blocks;
  const adminLink = ADMIN_LINKS[group.moduleKey];
  const { hasPermission } = usePermission();

  const canOpenAdmin =
    group.moduleKey === "rbac" &&
    (hasPermission(PERMISSIONS.users.view) ||
      hasPermission(PERMISSIONS.roles.view) ||
      hasPermission(PERMISSIONS.modules.view));

  return (
    <Card className="group rounded-2xl shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#6B38C3]/30 dark:hover:border-[#A78BFA]/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 text-base font-bold">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#6B38C3]/10 text-[#6B38C3] dark:bg-[#A78BFA]/10 dark:text-[#A78BFA] group-hover:scale-105 transition-transform">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {group.label}
        </CardTitle>
        <CardDescription>
          {group.permissions.length} granted permission
          {group.permissions.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {group.permissions.map((key) => (
            <Badge key={key} variant="outline" className="font-mono text-xs font-normal border-[#6B38C3]/20 bg-[#6B38C3]/5 dark:border-[#A78BFA]/20 dark:bg-[#A78BFA]/5">
              {formatPermissionAction(key)}
            </Badge>
          ))}
        </div>
        {canOpenAdmin && adminLink && (
          <Link href={adminLink.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {adminLink.label}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function PermissionCapabilities() {
  const { user } = useSession();
  if (!user || user.permissions.length === 0) return null;

  const groups = groupPermissionsByModule(user.permissions).filter(
    (group) => group.moduleKey !== "rbac" || group.permissions.some((key) => key.startsWith("rbac."))
  );

  const businessGroups = groups.filter((group) => group.moduleKey !== "rbac");
  const rbacGroup = groups.find((group) => group.moduleKey === "rbac");

  if (businessGroups.length === 0 && !rbacGroup) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold tracking-tight">Your access</h2>
        <p className="text-sm text-muted-foreground">
          Areas and actions available through your assigned role permissions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businessGroups.map((group) => (
          <CapabilityCard key={group.moduleKey} group={group} />
        ))}
        {rbacGroup && businessGroups.length === 0 && (
          <CapabilityCard group={rbacGroup} />
        )}
      </div>
    </div>
  );
}

export function RbacQuickLinks() {
  const { hasPermission, hasAnyPermission } = usePermission();

  const links = [
    { href: "/users", label: "Users", permission: PERMISSIONS.users.view, icon: Users },
    { href: "/roles", label: "Roles", permission: PERMISSIONS.roles.view, icon: Shield },
    { href: "/modules", label: "Modules", permission: PERMISSIONS.modules.view, icon: Blocks },
    { href: "/permissions", label: "Permissions", permission: PERMISSIONS.permissions.view, icon: KeyRound },
    { href: "/audit-logs", label: "Audit Logs", permission: PERMISSIONS.audit.view, icon: Activity },
  ].filter((link) => hasPermission(link.permission));

  if (links.length === 0) return null;

  const showAdminOverview = hasAnyPermission([
    PERMISSIONS.users.view,
    PERMISSIONS.roles.view,
    PERMISSIONS.modules.view,
    PERMISSIONS.permissions.view,
  ]);

  if (!showAdminOverview) return null;

  return (
    <Card className="rounded-2xl shadow-xs transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">Access management</CardTitle>
        <CardDescription>Quick links to RBAC administration areas you can access.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Button key={link.href} variant="outline" size="sm" render={<Link href={link.href} />}>
              <Icon className="size-3.5 text-[#6B38C3] dark:text-[#A78BFA]" aria-hidden="true" />
              {link.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
