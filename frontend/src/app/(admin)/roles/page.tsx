import type { Metadata } from "next";
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/config/permissions";
import { RolesFeature } from "@/features/roles/components/roles-feature";

export const metadata: Metadata = {
  title: "Roles",
};

export default function RolesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.roles.view}>
      <RolesFeature />
    </PermissionGuard>
  );
}