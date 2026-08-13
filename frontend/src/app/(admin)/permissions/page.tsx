import type { Metadata } from "next";
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/config/permissions";
import { PermissionsFeature } from "@/features/permissions/components/permissions-feature";

export const metadata: Metadata = {
  title: "Permissions",
};

export default function PermissionsPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.permissions.view}>
      <PermissionsFeature />
    </PermissionGuard>
  );
}