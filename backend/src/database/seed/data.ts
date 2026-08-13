export interface SeedOperationDefinition {
  key: string;
  name: string;
  order: number;
}

export interface SeedSubModuleDefinition {
  key: string;
  name: string;
  order: number;
  operations: SeedOperationDefinition[];
}

export interface SeedModuleDefinition {
  key: string;
  name: string;
  description: string;
  order: number;
  icon: string;
  subModules: SeedSubModuleDefinition[];
}

export interface SeedRoleDefinition {
  slug: string;
  name: string;
  description: string;
  permissionKeys: string[];
}

export const SUPER_ADMIN_ROLE_SLUG = "super-administrator";
export const DEMO_ROLE_SLUG = "hr-manager";

const op = (key: string, name: string, order: number): SeedOperationDefinition => ({
  key,
  name,
  order,
});

export const SEED_MODULES: SeedModuleDefinition[] = [
  {
    key: "rbac",
    name: "Access Control",
    description: "Administration of users, roles, modules, and permissions",
    order: 1,
    icon: "shield",
    subModules: [
      {
        key: "roles",
        name: "Roles",
        order: 1,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
          op("assign-permissions", "Assign Permissions", 5),
        ],
      },
      {
        key: "users",
        name: "Users",
        order: 2,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
          op("assign-roles", "Assign Roles", 5),
        ],
      },
      {
        key: "modules",
        name: "Modules",
        order: 3,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
        ],
      },
      {
        key: "permissions",
        name: "Permissions",
        order: 4,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
        ],
      },
      {
        key: "sub-modules",
        name: "Sub-Modules",
        order: 5,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
        ],
      },
      {
        key: "operations",
        name: "Operations",
        order: 6,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
        ],
      },
      {
        key: "role-permissions",
        name: "Role Permissions",
        order: 7,
        operations: [
          op("view", "View", 1),
          op("assign", "Assign", 2),
          op("remove", "Remove", 3),
        ],
      },
    ],
  },
  {
    key: "employee",
    name: "Employee Management",
    description: "Manage employee records and departments",
    order: 2,
    icon: "users",
    subModules: [
      {
        key: "employees",
        name: "Employees",
        order: 1,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
          op("delete", "Delete", 4),
        ],
      },
      {
        key: "departments",
        name: "Departments",
        order: 2,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("update", "Update", 3),
        ],
      },
    ],
  },
  {
    key: "attendance",
    name: "Attendance",
    description: "Track and manage attendance records",
    order: 3,
    icon: "clock",
    subModules: [
      {
        key: "records",
        name: "Attendance Records",
        order: 1,
        operations: [
          op("view", "View", 1),
          op("create", "Create", 2),
          op("approve", "Approve", 3),
        ],
      },
    ],
  },
  {
    key: "leave",
    name: "Leave Management",
    description: "Apply for and manage leave requests",
    order: 4,
    icon: "calendar",
    subModules: [
      {
        key: "requests",
        name: "Leave Requests",
        order: 1,
        operations: [
          op("view", "View", 1),
          op("apply", "Apply", 2),
          op("approve", "Approve", 3),
          op("reject", "Reject", 4),
        ],
      },
    ],
  },
  {
    key: "audit",
    name: "Audit Logs",
    description: "System audit logging and activity tracking",
    order: 5,
    icon: "activity",
    subModules: [
      {
        key: "",
        name: "Audit Logs",
        order: 1,
        operations: [op("view", "View", 1)],
      },
    ],
  },
];

const emp = (operation: string) => `employee.employees.${operation}`;
const dept = (operation: string) => `employee.departments.${operation}`;
const att = (operation: string) => `attendance.records.${operation}`;
const leave = (operation: string) => `leave.requests.${operation}`;
const rbacRoles = (operation: string) => `rbac.roles.${operation}`;
const rbacUsers = (operation: string) => `rbac.users.${operation}`;
const rbacModules = (operation: string) => `rbac.modules.${operation}`;
const rbacPermissions = (operation: string) => `rbac.permissions.${operation}`;
const rbacSubModules = (operation: string) => `rbac.sub-modules.${operation}`;
const rbacOperations = (operation: string) => `rbac.operations.${operation}`;
const rbacRolePermissions = (operation: string) => `rbac.role-permissions.${operation}`;
const auditLogs = (operation: string) => `audit.${operation}`;

const VIEW_ONLY = [
  emp("view"),
  dept("view"),
  att("view"),
  leave("view"),
  rbacRoles("view"),
  rbacUsers("view"),
  rbacModules("view"),
  rbacPermissions("view"),
  rbacSubModules("view"),
  rbacOperations("view"),
  rbacRolePermissions("view"),
  auditLogs("view"),
];

export const SEED_ROLES: SeedRoleDefinition[] = [
  {
    slug: SUPER_ADMIN_ROLE_SLUG,
    name: "Super Administrator",
    description: "Full access to the entire platform",
    permissionKeys: [],
  },
  {
    slug: "hr-manager",
    name: "HR Manager",
    description: "Manages employees, departments, attendance approval, and leave approval",
    permissionKeys: [
      emp("view"),
      emp("create"),
      emp("update"),
      emp("delete"),
      dept("view"),
      dept("create"),
      dept("update"),
      att("view"),
      leave("view"),
      leave("approve"),
      leave("reject"),
    ],
  },
  {
    slug: "department-manager",
    name: "Department Manager",
    description: "Views employees, manages departments, and approves leave",
    permissionKeys: [
      emp("view"),
      dept("view"),
      dept("create"),
      dept("update"),
      att("view"),
      leave("view"),
      leave("approve"),
    ],
  },
  {
    slug: "team-lead",
    name: "Team Lead",
    description: "Views employees, attendance, and leave requests",
    permissionKeys: [emp("view"), att("view"), leave("view")],
  },
  {
    slug: "employee",
    name: "Employee",
    description: "Views own employee record, attendance, and applies for leave",
    permissionKeys: [emp("view"), att("view"), leave("view"), leave("apply")],
  },
  {
    slug: "auditor",
    name: "Auditor",
    description: "Read-only access across all modules",
    permissionKeys: VIEW_ONLY,
  },
];
