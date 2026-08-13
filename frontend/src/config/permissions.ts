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
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];