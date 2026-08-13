"use client";

import { ArrowDown, ArrowRight, Blocks, FolderTree, KeyRound, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HierarchyModule } from "@/types/rbac";
import type { DashboardHierarchyCounts } from "../types/dashboard";

interface RbacOverviewProps {
  modules: HierarchyModule[];
  counts: DashboardHierarchyCounts;
  loading: boolean;
}

interface FlowNode {
  label: string;
  value: number;
  icon: typeof Blocks;
}

export function RbacOverview({ modules, counts, loading }: RbacOverviewProps) {
  const nodes: FlowNode[] = [
    { label: "Modules", value: counts.modules, icon: Blocks },
    { label: "Sub-modules", value: counts.subModules, icon: FolderTree },
    { label: "Operations", value: counts.operations, icon: Workflow },
    { label: "Permissions", value: counts.permissions, icon: KeyRound },
  ];

  const moduleSummary = (rbacModule: HierarchyModule) => {
    const subModules = rbacModule.subModules.length;
    const operations =
      rbacModule.operations.length +
      rbacModule.subModules.reduce((sum, subModule) => sum + subModule.operations.length, 0);
    const permissions =
      rbacModule.operations.reduce((sum, operation) => sum + operation.permissions.length, 0) +
      rbacModule.subModules.reduce(
        (sum, subModule) =>
          sum + subModule.operations.reduce((inner, operation) => inner + operation.permissions.length, 0),
        0
      );
    return { subModules, operations, permissions };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="size-4 text-muted-foreground" aria-hidden="true" />
          RBAC structure
        </CardTitle>
        <CardDescription>How access is organized, from modules down to permission codes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ol className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-0">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <li key={node.label} className="flex items-center">
                <span className="flex min-w-36 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">{node.label}</span>
                  {loading ? (
                    <Skeleton className="h-4 w-8" />
                  ) : (
                    <span className="text-sm font-semibold">{node.value.toLocaleString()}</span>
                  )}
                </span>
                {index < nodes.length - 1 && (
                  <>
                    <ArrowRight className="mx-1 hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
                    <ArrowDown className="mx-auto size-4 shrink-0 text-muted-foreground sm:hidden" aria-hidden="true" />
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <div>
          <h3 className="mb-2 text-sm font-medium">By module</h3>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : modules.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              No modules have been created yet.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {modules.map((rbacModule) => {
                const summary = moduleSummary(rbacModule);
                return (
                  <li
                    key={rbacModule.id}
                    className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{rbacModule.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{rbacModule.key}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">
                        {summary.subModules} sub-module{summary.subModules === 1 ? "" : "s"}
                      </Badge>
                      <Badge variant="outline">
                        {summary.operations} operation{summary.operations === 1 ? "" : "s"}
                      </Badge>
                      <Badge variant="outline">
                        {summary.permissions} permission{summary.permissions === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}