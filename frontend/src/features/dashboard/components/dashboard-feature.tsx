"use client";

import { AlertTriangle, Blocks, KeyRound, Shield, ShieldOff, UserCheck, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
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
            <StatCard title="Active users" icon={UserCheck} loading accent="success" />
            <StatCard title="Inactive users" icon={UserX} loading accent="destructive" />
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
      <PageHeader
        title="Dashboard"
        description="System overview and RBAC health at a glance."
      />

      {!anySection ? (
        <Card className="shadow-xs">
          <CardContent className="pt-6">
            <EmptyState
              icon={ShieldOff}
              title="No dashboard data available"
              description="Your permissions do not include any dashboard sections. Contact an administrator if you believe this is a mistake."
            />
          </CardContent>
        </Card>
      ) : status === "loading" ? (
        <DashboardSkeleton access={access} />
      ) : status === "error" ? (
        <Card className="shadow-xs">
          <CardContent className="pt-6">
            <ErrorState
              title="Could not load the dashboard"
              message="The system overview could not be loaded. Check your connection and try again."
              onRetry={refetch}
              retryLabel="Retry"
              icon={AlertTriangle}
            />
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
