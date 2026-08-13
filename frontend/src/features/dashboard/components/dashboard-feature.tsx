"use client";

import { AlertTriangle, Blocks, KeyRound, RefreshCw, Shield, ShieldOff, UserCheck, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";
import { useDashboard } from "../hooks/use-dashboard";
import { StatCard } from "./stat-card";
import { StatsGrid } from "./stats-grid";
import { RbacOverview } from "./rbac-overview";
import { RecentLists } from "./recent-lists";
import type { DashboardAccess, DashboardOverview } from "../types/dashboard";

const EMPTY_OVERVIEW: DashboardOverview = {
  users: null,
  roles: null,
  permissions: null,
  hierarchy: null,
};

function DashboardSkeleton({ access }: { access: DashboardAccess }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {access.users && (
          <>
            <StatCard title="Total users" icon={Users} loading />
            <StatCard title="Active users" icon={UserCheck} loading />
            <StatCard title="Inactive users" icon={UserX} loading />
          </>
        )}
        {access.roles && <StatCard title="Total roles" icon={Shield} loading />}
        {access.modules && <StatCard title="Total modules" icon={Blocks} loading />}
        {access.permissions && <StatCard title="Total permissions" icon={KeyRound} loading />}
      </div>
      {access.modules && (
        <RbacOverview
          modules={[]}
          counts={{ modules: 0, subModules: 0, operations: 0, permissions: 0 }}
          loading
        />
      )}
      <RecentLists data={EMPTY_OVERVIEW} access={access} loading />
    </>
  );
}

export function DashboardFeature() {
  const { data, status, refetch } = useDashboard();
  const { hasPermission } = usePermission();

  const access: DashboardAccess = {
    users: hasPermission(PERMISSIONS.users.view),
    roles: hasPermission(PERMISSIONS.roles.view),
    permissions: hasPermission(PERMISSIONS.permissions.view),
    modules: hasPermission(PERMISSIONS.modules.view),
  };

  const anySection = access.users || access.roles || access.permissions || access.modules;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="System and RBAC overview." />

      {!anySection ? (
        <Card>
          <CardHeader className="items-center text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-muted">
              <ShieldOff className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <CardTitle>No dashboard data available</CardTitle>
            <CardDescription>
              Your permissions do not include any dashboard sections. Contact an administrator if
              you believe this is a mistake.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : status === "loading" ? (
        <DashboardSkeleton access={access} />
      ) : status === "error" ? (
        <Card>
          <CardHeader className="items-center text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
            </span>
            <CardTitle>Could not load the dashboard</CardTitle>
            <CardDescription>
              The system overview could not be loaded. Check your connection and try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={refetch}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <StatsGrid data={data} access={access} />
          {access.modules && data.hierarchy && (
            <RbacOverview
              modules={data.hierarchy.modules}
              counts={data.hierarchy.counts}
              loading={false}
            />
          )}
          <RecentLists data={data} access={access} loading={false} />
        </>
      ) : null}
    </div>
  );
}