import { within, type queries } from "@testing-library/react";
import type { UserDto } from "@/types/users";
import type { RoleDto, RolePermissionItem } from "@/types/roles";
import type {
  ModuleDto,
  SubModuleDto,
  OperationDto,
  PermissionDto,
  HierarchyModule,
} from "@/types/rbac";

export function makeUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: "u1",
    name: "John Doe",
    email: "john@example.com",
    status: "active",
    lastLoginAt: "2026-08-01T10:00:00.000Z",
    roles: [
      { id: "r1", name: "Administrator", slug: "administrator", active: true },
    ],
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeRole(overrides: Partial<RoleDto> = {}): RoleDto {
  return {
    id: "r1",
    name: "Administrator",
    slug: "administrator",
    description: "Full access",
    isSystem: true,
    active: true,
    permissionKeys: ["rbac.users.view"],
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeModule(overrides: Partial<ModuleDto> = {}): ModuleDto {
  return {
    id: "m1",
    key: "employees",
    name: "Procurement",
    description: "Procurement operations",
    order: 1,
    icon: "package",
    active: true,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeSubModule(overrides: Partial<SubModuleDto> = {}): SubModuleDto {
  return {
    id: "s1",
    key: "purchase-orders",
    name: "Purchase Orders",
    moduleId: "m1",
    order: 1,
    active: true,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeOperation(overrides: Partial<OperationDto> = {}): OperationDto {
  return {
    id: "o1",
    key: "view",
    name: "View",
    moduleId: "m1",
    subModuleId: "s1",
    order: 1,
    active: true,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makePermission(overrides: Partial<PermissionDto> = {}): PermissionDto {
  return {
    id: "p1",
    key: "employees.view",
    name: "View Purchase Orders",
    description: "View purchase order records",
    moduleId: "m1",
    operationId: "o1",
    active: true,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

export function makeHierarchyModule(overrides: Partial<HierarchyModule> = {}): HierarchyModule {
  return {
    id: "m1",
    key: "employees",
    name: "Procurement",
    description: "",
    order: 1,
    icon: "package",
    active: true,
    operations: [
      {
        id: "o2",
        key: "configure",
        name: "Configure",
        order: 2,
        active: true,
        permissions: [
          {
            id: "p2",
            key: "employees.configure",
            name: "Configure employees",
            description: "",
            active: true,
          },
        ],
      },
    ],
    subModules: [
      {
        id: "s1",
        key: "purchase-orders",
        name: "Purchase Orders",
        order: 1,
        active: true,
        operations: [
          {
            id: "o1",
            key: "view",
            name: "View",
            order: 1,
            active: true,
            permissions: [
              {
                id: "p1",
                key: "employees.view",
                name: "View Purchase Orders",
                description: "",
                active: true,
              },
              {
                id: "p3",
                key: "employees.create",
                name: "Create Purchase Orders",
                description: "",
                active: true,
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

export function makeRolePermissionItem(overrides: Partial<RolePermissionItem> = {}): RolePermissionItem {
  return {
    roleId: "r1",
    permissionKey: "employees.view",
    enabled: true,
    permission: {
      id: "p1",
      key: "employees.view",
      name: "View Purchase Orders",
      description: "",
      moduleId: "m1",
      operationId: "o1",
      active: true,
    },
    ...overrides,
  };
}

export function checkboxByAriaLabel(
  scope: ReturnType<typeof within<typeof queries>>,
  ariaLabel: string
): HTMLElement {
  const checkbox = scope.getAllByRole("checkbox").find(
    (element) => element.getAttribute("aria-label") === ariaLabel
  );
  if (!checkbox) {
    throw new Error(`Checkbox with aria-label "${ariaLabel}" not found`);
  }
  return checkbox;
}