import { MUTATION_OPERATIONS } from "@/config/permissions";

export interface PermissionGroup {
  moduleKey: string;
  label: string;
  permissions: string[];
}

export const MODULE_LABELS: Record<string, string> = {
  rbac: "Access Control",
  employee: "Employee Management",
  attendance: "Attendance",
  leave: "Leave Management",
  audit: "Audit & Compliance",
};

const MODULE_ORDER = ["rbac", "employee", "attendance", "leave", "audit"];

export function getModuleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] ?? moduleKey.replace(/-/g, " ");
}

export function groupPermissionsByModule(permissions: readonly string[]): PermissionGroup[] {
  const map = new Map<string, string[]>();

  for (const key of permissions) {
    const moduleKey = key.split(".")[0] ?? key;
    const list = map.get(moduleKey) ?? [];
    list.push(key);
    map.set(moduleKey, list);
  }

  return MODULE_ORDER.filter((key) => map.has(key))
    .map((moduleKey) => ({
      moduleKey,
      label: getModuleLabel(moduleKey),
      permissions: [...(map.get(moduleKey) ?? [])].sort(),
    }))
    .concat(
      [...map.entries()]
        .filter(([key]) => !MODULE_ORDER.includes(key))
        .map(([moduleKey, perms]) => ({
          moduleKey,
          label: getModuleLabel(moduleKey),
          permissions: [...perms].sort(),
        }))
    );
}

export function formatPermissionAction(key: string): string {
  const parts = key.split(".");
  const action = parts[parts.length - 1] ?? key;
  return action
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isReadOnlyPermissionSet(permissions: readonly string[]): boolean {
  if (permissions.length === 0) return true;
  return permissions.every((key) => {
    const action = key.split(".").pop() ?? "";
    return !MUTATION_OPERATIONS.has(action);
  });
}

export function hasAnyMutationPermission(permissions: readonly string[]): boolean {
  return permissions.some((key) => {
    const action = key.split(".").pop() ?? "";
    return MUTATION_OPERATIONS.has(action);
  });
}
