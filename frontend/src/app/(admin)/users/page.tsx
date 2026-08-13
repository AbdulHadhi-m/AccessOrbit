import type { Metadata } from "next";
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/config/permissions";
import { UsersFeature } from "@/features/users/components/users-feature";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.users.view}>
      <UsersFeature />
    </PermissionGuard>
  );
}