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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {access.users && data.users && (
        <>
          <StatCard
            title="Total users"
            icon={Users}
            value={data.users.total}
            description="Registered accounts"
            accent="default"
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
          description="RBAC system roles"
          accent="default"
        />
      )}
      {access.modules && data.hierarchy && (
        <StatCard
          title="Total modules"
          icon={Blocks}
          value={data.hierarchy.counts.modules}
          description="Top-level modules"
          accent="default"
        />
      )}
      {access.permissions && data.permissions && (
        <StatCard
          title="Total permissions"
          icon={KeyRound}
          value={data.permissions.total}
          description="System permission codes"
          accent="default"
        />
      )}
    </div>
  );
}