"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/data-table/pagination";
import { AccessDenied } from "@/components/access-denied";
import { PERMISSIONS } from "@/config/permissions";
import { usePermission } from "@/hooks/use-permission";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuditLogs } from "../hooks";
import { AuditLogsTable } from "./audit-logs-table";
import { AuditLogsFilters } from "./audit-logs-filters";
import { AuditLogDetailModal } from "./audit-log-detail-modal";
import type { AuditLogDto, AuditStatus } from "@/types/audit";

const PAGE_SIZE = 20;

export function AuditLogsFeature() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(PERMISSIONS.audit.view);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string | undefined>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [inspectLog, setInspectLog] = useState<AuditLogDto | null>(null);

  const { data, error, status: queryStatus, refetch } = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    status: (statusFilter as AuditStatus) || undefined,
    sortBy: sort,
    sortOrder: order,
  });

  if (!canView) {
    return <AccessDenied />;
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const loading = queryStatus === "loading";

  const handleSortChange = (nextSort: string, nextOrder: "asc" | "desc") => {
    setSort(nextSort);
    setOrder(nextOrder);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Logs"
        description="Inspect secure system audit trails, access attempts, and administrative actions."
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <AuditLogsFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            category={categoryFilter}
            onCategoryChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            status={statusFilter}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            onReset={handleResetFilters}
          />

          <div className="rounded-lg border">
            <AuditLogsTable
              data={items}
              total={total}
              loading={loading}
              error={error}
              onRetry={refetch}
              sort={sort}
              order={order}
              onSortChange={handleSortChange}
              onInspect={(log) => setInspectLog(log)}
            />
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <AuditLogDetailModal
        open={Boolean(inspectLog)}
        onOpenChange={(open) => !open && setInspectLog(null)}
        log={inspectLog}
      />
    </div>
  );
}
