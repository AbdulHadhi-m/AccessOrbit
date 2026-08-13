import type { Metadata } from "next";
import { PermissionGate } from "@/components/permission-gate";
import { PERMISSIONS } from "@/config/permissions";
import { RolesFeature } from "@/features/roles/components/roles-feature";

export const metadata: Metadata = {
  title: "Roles",
};

export default function RolesPage() {
  return (
    <PermissionGate permission={PERMISSIONS.roles.view}>
      <RolesFeature />
    </PermissionGate>
  );
}