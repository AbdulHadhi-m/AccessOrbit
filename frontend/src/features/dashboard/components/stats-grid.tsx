"use client";

import { Blocks, KeyRound, Shield, UserCheck, UserX, Users } from "lucide-react";
import { StatCard } from "./stat-card";
import type { DashboardAccess, DashboardOverview } from "../types/dashboard";

interface StatsGridProps {
  data: DashboardOverview;
  access: DashboardAccess;
}

export function StatsGrid({ data, access }: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {access.users && data.users && (
        <>
          <StatCard
            title="Total users"
            icon={Users}
            value={data.users.total}
            description="Registered accounts"
          />
          <StatCard
            title="Active users"
            icon={UserCheck}
            value={data.users.active}
            description="Accounts with access"
            accent="success"
          />
          <StatCard
            title="Inactive users"
            icon={UserX}
            value={data.users.suspended}
            description="Suspended accounts"
            accent="destructive"
          />
        </>
      )}
      {access.roles && data.roles && (
        <StatCard
          title="Total roles"
          icon={Shield}
          value={data.roles.total}
          description="Roles in the RBAC system"
        />
      )}
      {access.modules && data.hierarchy && (
        <StatCard
          title="Total modules"
          icon={Blocks}
          value={data.hierarchy.counts.modules}
          description="Top-level permission modules"
        />
      )}
      {access.permissions && data.permissions && (
        <StatCard
          title="Total permissions"
          icon={KeyRound}
          value={data.permissions.total}
          description="Permission codes across modules"
        />
      )}
    </div>
  );
}