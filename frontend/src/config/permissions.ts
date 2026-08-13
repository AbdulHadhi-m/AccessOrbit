export const PERMISSIONS = {
  users: {
    view: "rbac.users.view",
    create: "rbac.users.create",
    update: "rbac.users.update",
    delete: "rbac.users.delete",
    assignRoles: "rbac.users.assign-roles",
  },
  roles: {
    view: "rbac.roles.view",
    create: "rbac.roles.create",
    update: "rbac.roles.update",
    delete: "rbac.roles.delete",
  },
  rolePermissions: {
    view: "rbac.role-permissions.view",
    assign: "rbac.role-permissions.assign",
    remove: "rbac.role-permissions.remove",
  },
  modules: {
    view: "rbac.modules.view",
    create: "rbac.modules.create",
    update: "rbac.modules.update",
    delete: "rbac.modules.delete",
  },
  subModules: {
    view: "rbac.sub-modules.view",
    create: "rbac.sub-modules.create",
    update: "rbac.sub-modules.update",
    delete: "rbac.sub-modules.delete",
  },
  operations: {
    view: "rbac.operations.view",
    create: "rbac.operations.create",
    update: "rbac.operations.update",
    delete: "rbac.operations.delete",
  },
  permissions: {
    view: "rbac.permissions.view",
    create: "rbac.permissions.create",
    update: "rbac.permissions.update",
    delete: "rbac.permissions.delete",
  },
  audit: {
    view: "audit.view",
  },
  employee: {
    view: "employee.employees.view",
    create: "employee.employees.create",
    update: "employee.employees.update",
    delete: "employee.employees.delete",
  },
  departments: {
    view: "employee.departments.view",
    create: "employee.departments.create",
    update: "employee.departments.update",
  },
  attendance: {
    view: "attendance.records.view",
    create: "attendance.records.create",
    approve: "attendance.records.approve",
  },
  leave: {
    view: "leave.requests.view",
    apply: "leave.requests.apply",
    approve: "leave.requests.approve",
    reject: "leave.requests.reject",
  },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

/** RBAC administration permissions — used for admin dashboard sections and navigation. */
export const RBAC_ADMIN_PERMISSIONS = [
  PERMISSIONS.users.view,
  PERMISSIONS.roles.view,
  PERMISSIONS.modules.view,
  PERMISSIONS.permissions.view,
  PERMISSIONS.audit.view,
] as const;

/** Mutation permission suffixes — users with only view permissions are read-only. */
export const MUTATION_OPERATIONS = new Set([
  "create",
  "update",
  "delete",
  "assign",
  "remove",
  "assign-roles",
  "assign-permissions",
  "apply",
  "approve",
  "reject",
]);
