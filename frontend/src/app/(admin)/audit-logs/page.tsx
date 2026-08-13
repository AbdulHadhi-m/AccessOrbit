import type { Metadata } from "next";
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/config/permissions";
import { AuditLogsFeature } from "@/features/audit-logs/components/audit-logs-feature";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default function AuditLogsPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.audit.view}>
      <AuditLogsFeature />
    </PermissionGuard>
  );
}
