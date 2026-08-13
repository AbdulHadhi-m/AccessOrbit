import type { Metadata } from "next";
import { PermissionGate } from "@/components/permission-gate";
import { PERMISSIONS } from "@/config/permissions";
import { UsersFeature } from "@/features/users/components/users-feature";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <PermissionGate permission={PERMISSIONS.users.view}>
      <UsersFeature />
    </PermissionGate>
  );
}