import type { Metadata } from "next";
import { PermissionGate } from "@/components/permission-gate";
import { PERMISSIONS } from "@/config/permissions";
import { PermissionsFeature } from "@/features/permissions/components/permissions-feature";

export const metadata: Metadata = {
  title: "Permissions",
};

export default function PermissionsPage() {
  return (
    <PermissionGate permission={PERMISSIONS.permissions.view}>
      <PermissionsFeature />
    </PermissionGate>
  );
}