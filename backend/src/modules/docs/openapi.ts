import type { OpenAPIV3 } from "openapi-types";

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "JWT access token received from `POST /auth/login` or `POST /auth/refresh`. Include in the `Authorization` header as `Bearer <token>`.",
};

const errorResponse = (description: string): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const standardErrors = (): Record<string, OpenAPIV3.ResponseObject> => ({
  401: errorResponse("Missing or invalid access token (`AUTH_UNAUTHORIZED`)"),
  403: errorResponse("Authenticated but required permission code is missing (`AUTH_FORBIDDEN`)"),
  404: errorResponse("Target resource not found (`NOT_FOUND`)"),
  409: errorResponse("Conflict — duplicate key or relational constraint violation (`CONFLICT`)"),
  422: errorResponse("Request payload or parameter validation failed (`VALIDATION_ERROR`)"),
  500: errorResponse("Unexpected server error (`INTERNAL_SERVER_ERROR`)"),
});

const jsonBody = (
  description: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): OpenAPIV3.RequestBodyObject => ({
  description,
  required: true,
  content: {
    "application/json": { schema },
  },
});

const pageParams: OpenAPIV3.ParameterObject[] = [
  {
    in: "query",
    name: "page",
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "Page number (1-based index)",
  },
  {
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    description: "Maximum number of items per page (up to 100)",
  },
  {
    in: "query",
    name: "search",
    schema: { type: "string", maxLength: 100 },
    description: "Case-insensitive substring search filter",
  },
  {
    in: "query",
    name: "sort",
    schema: { type: "string" },
    description: "Field name to sort by",
  },
  {
    in: "query",
    name: "order",
    schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
    description: "Sort order direction",
  },
];

const statusParam: OpenAPIV3.ParameterObject = {
  in: "query",
  name: "status",
  schema: { type: "string", enum: ["active", "suspended", "inactive"] },
  description: "Filter by resource status",
};

const idParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "MongoDB 24-character hex ObjectId",
};

const permissionIdParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "permissionId",
  required: true,
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "MongoDB ObjectId of the permission",
};

const moduleIdQueryParam: OpenAPIV3.ParameterObject = {
  in: "query",
  name: "moduleId",
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "Filter items by parent module ID",
};

const subModuleIdQueryParam: OpenAPIV3.ParameterObject = {
  in: "query",
  name: "subModuleId",
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "Filter items by parent sub-module ID",
};

const paginatedData = (
  itemsSchemaRef: string
): OpenAPIV3.SchemaObject => ({
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: itemsSchemaRef } },
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 20 },
    total: { type: "integer", example: 42 },
    totalPages: { type: "integer", example: 3 },
  },
});

const successData = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  message = "Operation completed successfully"
): OpenAPIV3.ResponseObject => ({
  description: "Successful response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: message },
          data: schema,
          requestId: { type: "string", example: "req_9f8b2a1e-3c4d-4e5f" },
        },
      },
    },
  },
});

const operation = (
  tag: string,
  summary: string,
  permissionKey: string,
  params: OpenAPIV3.ParameterObject[],
  requestBody: OpenAPIV3.RequestBodyObject | undefined,
  responses: Record<string, OpenAPIV3.ResponseObject>,
  description?: string,
  isPublic = false
): OpenAPIV3.OperationObject => ({
  tags: [tag],
  summary,
  description:
    description ??
    (isPublic
      ? "Public endpoint — does not require authorization header."
      : `Requires authentication (\`Bearer <accessToken>\`) and the \`${permissionKey}\` permission code.`),
  security: isPublic ? [] : [{ bearerAuth: [] }],
  parameters: params,
  requestBody,
  responses,
});

const listResponses = (ref: string): Record<string, OpenAPIV3.ResponseObject> => ({
  200: successData(paginatedData(ref)),
  ...standardErrors(),
});

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "AccessOrbit REST API",
    version: "1.0.0",
    description: `### Enterprise Dynamic Role-Based Access Control (RBAC) & Audit Platform

AccessOrbit provides runtime-resolved authorization, granular permission governance, multi-tier module architectures, and full cryptographic audit trails.

#### Key Architectural Highlights
- **Dynamic Permission Resolution**: Every administrative endpoint is guarded by \`requireAuth\` + \`requirePermission\`. Permissions are computed directly from MongoDB on every request without requiring redeployments or restarts.
- **Hierarchical Governance**: \`Module\` → \`Sub-Module\` → \`Operation\` → \`Permission\` structure.
- **Audit Logging**: Comprehensive, immutable activity recording for all user authentication and administrative mutations.
- **Unified Global Search**: Multi-entity instant search across users, roles, modules, permissions, and audit logs.`,
    contact: {
      name: "AccessOrbit Support",
      url: "https://github.com/AbdulHadhi-m/AccessOrbit",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "API Version 1 (Base Server)",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User authentication, JWT token issuance, session refresh, and revocation.",
    },
    {
      name: "Users",
      description: "Account creation, profile management, status toggling, and role assignments.",
    },
    {
      name: "Roles",
      description: "RBAC role definitions, system role protections, and lifecycle management.",
    },
    {
      name: "Role Permissions",
      description: "Direct atomic binding and removal of permission codes to roles.",
    },
    {
      name: "Modules",
      description: "Top-level domain modules and the comprehensive RBAC tree hierarchy.",
    },
    {
      name: "Sub-Modules",
      description: "Secondary domain groupings nested within parent modules.",
    },
    {
      name: "Operations",
      description: "Functional action sets categorized by module or sub-module.",
    },
    {
      name: "Permissions",
      description: "Atomic, fine-grained permission codes used in authorization guards.",
    },
    {
      name: "Audit Logs",
      description: "Immutable compliance audit log trail with rich search and filtering.",
    },
    {
      name: "Search",
      description: "High-performance global search indexing all RBAC entities.",
    },
    {
      name: "Health",
      description: "Liveness and database connectivity diagnostic endpoints.",
    },
  ],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      ErrorField: {
        type: "object",
        properties: {
          field: { type: "string", example: "email" },
          message: { type: "string", example: "Invalid email address format" },
        },
      },
      ErrorBody: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Request validation failed" },
          details: { type: "array", items: { $ref: "#/components/schemas/ErrorField" } },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Request failed" },
          error: { $ref: "#/components/schemas/ErrorBody" },
          requestId: { type: "string", example: "req_9f8b2a1e-3c4d-4e5f" },
        },
      },
      RoleRef: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          name: { type: "string", example: "Administrator" },
          slug: { type: "string", example: "administrator" },
          active: { type: "boolean", example: true },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane.doe@accessorbit.com" },
          status: { type: "string", enum: ["active", "suspended"], example: "active" },
          lastLoginAt: { type: "string", nullable: true, example: "2026-08-14T03:45:00.000Z" },
          roles: { type: "array", items: { $ref: "#/components/schemas/RoleRef" } },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
        description: "Public user profile model. Sensitive credentials and refresh tokens are strictly omitted.",
      },
      UserSingle: {
        type: "object",
        properties: { user: { $ref: "#/components/schemas/User" } },
      },
      UserPage: paginatedData("#/components/schemas/User"),
      CreateUserBody: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "John Smith" },
          email: { type: "string", format: "email", example: "john.smith@accessorbit.com" },
          password: { type: "string", minLength: 8, maxLength: 128, example: "SecureP@ssw0rd!2026" },
          roleIds: {
            type: "array",
            items: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
            example: ["66b1a2c3d4e5f67890123456"],
          },
        },
      },
      UpdateUserBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "John Smith" },
          email: { type: "string", format: "email", example: "john.smith@accessorbit.com" },
          status: { type: "string", enum: ["active", "suspended"], example: "active" },
        },
      },
      SetUserRolesBody: {
        type: "object",
        required: ["roleIds"],
        properties: {
          roleIds: {
            type: "array",
            minItems: 1,
            items: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
            example: ["66b1a2c3d4e5f67890123456"],
          },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          name: { type: "string", example: "Compliance Officer" },
          slug: { type: "string", example: "compliance-officer" },
          description: { type: "string", example: "Can view all audit logs and user activity reports" },
          isSystem: { type: "boolean", example: false },
          active: { type: "boolean", example: true },
          permissionKeys: {
            type: "array",
            items: { type: "string" },
            example: ["audit.view", "rbac.users.view"],
          },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      RoleSingle: {
        type: "object",
        properties: { role: { $ref: "#/components/schemas/Role" } },
      },
      RolePage: paginatedData("#/components/schemas/Role"),
      CreateRoleBody: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Security Auditor" },
          description: { type: "string", maxLength: 500, example: "Read-only access to audit logs and security policies" },
          permissionKeys: {
            type: "array",
            maxItems: 200,
            items: { type: "string" },
            example: ["audit.view"],
          },
        },
      },
      UpdateRoleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Senior Security Auditor" },
          description: { type: "string", maxLength: 500, example: "Full access to audit trails and security alerts" },
          active: { type: "boolean", example: true },
        },
      },
      RolePermission: {
        type: "object",
        properties: {
          roleId: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          permissionKey: { type: "string", example: "rbac.users.create" },
          enabled: { type: "boolean", example: true },
          permission: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", example: "66b1a2c3d4e5f67890123457" },
              key: { type: "string", example: "rbac.users.create" },
              name: { type: "string", example: "Create User Accounts" },
              description: { type: "string", example: "Allows creating new users and assigning initial roles" },
              moduleId: { type: "string", example: "66b1a2c3d4e5f67890123458" },
              operationId: { type: "string", example: "66b1a2c3d4e5f67890123459" },
              active: { type: "boolean", example: true },
            },
          },
        },
      },
      RolePermissionList: {
        type: "object",
        properties: {
          items: { type: "array", items: { $ref: "#/components/schemas/RolePermission" } },
        },
      },
      AssignPermissionBody: {
        type: "object",
        required: ["permissionKey"],
        properties: {
          permissionKey: { type: "string", example: "rbac.users.create" },
        },
      },
      Module: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123458" },
          key: { type: "string", example: "rbac" },
          name: { type: "string", example: "Access Control" },
          description: { type: "string", example: "Role-based access control and administrative entity management" },
          order: { type: "integer", example: 1 },
          icon: { type: "string", example: "Shield" },
          active: { type: "boolean", example: true },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      ModuleSingle: {
        type: "object",
        properties: { module: { $ref: "#/components/schemas/Module" } },
      },
      ModulePage: paginatedData("#/components/schemas/Module"),
      CreateModuleBody: {
        type: "object",
        required: ["key", "name"],
        properties: {
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "payroll" },
          name: { type: "string", minLength: 1, maxLength: 120, example: "Payroll Management" },
          description: { type: "string", maxLength: 500, example: "Employee compensation and salary disbursal" },
          order: { type: "integer", minimum: 0, example: 5 },
          icon: { type: "string", maxLength: 64, example: "CreditCard" },
        },
      },
      UpdateModuleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Payroll & Compensation" },
          description: { type: "string", maxLength: 500, example: "Manage employee salaries, bonuses, and tax deductions" },
          order: { type: "integer", minimum: 0, example: 5 },
          icon: { type: "string", maxLength: 64, example: "DollarSign" },
          active: { type: "boolean", example: true },
        },
      },
      SubModule: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123460" },
          key: { type: "string", example: "user-management" },
          name: { type: "string", example: "User Management" },
          moduleId: { type: "string", example: "66b1a2c3d4e5f67890123458" },
          order: { type: "integer", example: 1 },
          active: { type: "boolean", example: true },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      SubModuleSingle: {
        type: "object",
        properties: { subModule: { $ref: "#/components/schemas/SubModule" } },
      },
      SubModulePage: paginatedData("#/components/schemas/SubModule"),
      CreateSubModuleBody: {
        type: "object",
        required: ["moduleId", "key", "name"],
        properties: {
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", example: "66b1a2c3d4e5f67890123458" },
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "salary-slips" },
          name: { type: "string", minLength: 1, maxLength: 120, example: "Salary Slips" },
          order: { type: "integer", minimum: 0, example: 1 },
        },
      },
      UpdateSubModuleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Pay Slips & Invoices" },
          order: { type: "integer", minimum: 0, example: 1 },
          active: { type: "boolean", example: true },
        },
      },
      Operation: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123459" },
          key: { type: "string", example: "users" },
          name: { type: "string", example: "Users Operations" },
          moduleId: { type: "string", example: "66b1a2c3d4e5f67890123458" },
          subModuleId: { type: "string", nullable: true, example: "66b1a2c3d4e5f67890123460" },
          order: { type: "integer", example: 1 },
          active: { type: "boolean", example: true },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      OperationSingle: {
        type: "object",
        properties: { operation: { $ref: "#/components/schemas/Operation" } },
      },
      OperationPage: paginatedData("#/components/schemas/Operation"),
      CreateOperationBody: {
        type: "object",
        required: ["moduleId", "key", "name"],
        properties: {
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", example: "66b1a2c3d4e5f67890123458" },
          subModuleId: {
            type: "string",
            nullable: true,
            pattern: "^[0-9a-fA-F]{24}$",
            example: "66b1a2c3d4e5f67890123460",
          },
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "disburse" },
          name: { type: "string", minLength: 1, maxLength: 120, example: "Disburse Payment" },
          order: { type: "integer", minimum: 0, example: 2 },
        },
      },
      UpdateOperationBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120, example: "Disburse Payments & Bonuses" },
          order: { type: "integer", minimum: 0, example: 2 },
          active: { type: "boolean", example: true },
        },
      },
      Permission: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123457" },
          key: { type: "string", example: "rbac.users.create" },
          name: { type: "string", example: "Create Users" },
          description: { type: "string", example: "Allows creating user accounts" },
          moduleId: { type: "string", example: "66b1a2c3d4e5f67890123458" },
          operationId: { type: "string", example: "66b1a2c3d4e5f67890123459" },
          active: { type: "boolean", example: true },
          createdAt: { type: "string", example: "2026-08-10T12:00:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      PermissionSingle: {
        type: "object",
        properties: { permission: { $ref: "#/components/schemas/Permission" } },
      },
      PermissionPage: paginatedData("#/components/schemas/Permission"),
      CreatePermissionBody: {
        type: "object",
        required: ["key", "name", "moduleId", "operationId"],
        properties: {
          key: {
            type: "string",
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*\\.[a-z0-9-]+$",
            example: "payroll.disburse.approve",
          },
          name: { type: "string", minLength: 1, maxLength: 160, example: "Approve Payment Disbursal" },
          description: { type: "string", maxLength: 500, example: "Authorizes approval of payroll batches" },
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", example: "66b1a2c3d4e5f67890123458" },
          operationId: { type: "string", pattern: "^[0-9a-fA-F]{24}$", example: "66b1a2c3d4e5f67890123459" },
        },
      },
      UpdatePermissionBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 160, example: "Approve & Sign Payroll" },
          description: { type: "string", maxLength: 500, example: "Authorizes and cryptographically signs payroll batches" },
          active: { type: "boolean", example: true },
        },
      },
      HierarchyPermission: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123457" },
          key: { type: "string", example: "rbac.users.view" },
          name: { type: "string", example: "View Users" },
          description: { type: "string", example: "View user directory and metadata" },
          active: { type: "boolean", example: true },
        },
      },
      HierarchyOperation: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123459" },
          key: { type: "string", example: "users" },
          name: { type: "string", example: "User Operations" },
          order: { type: "integer", example: 1 },
          active: { type: "boolean", example: true },
          permissions: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyPermission" },
          },
        },
      },
      HierarchySubModule: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123460" },
          key: { type: "string", example: "user-management" },
          name: { type: "string", example: "User Management" },
          order: { type: "integer", example: 1 },
          active: { type: "boolean", example: true },
          operations: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyOperation" },
          },
        },
      },
      HierarchyModule: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123458" },
          key: { type: "string", example: "rbac" },
          name: { type: "string", example: "Access Control" },
          description: { type: "string", example: "Core access control models" },
          order: { type: "integer", example: 1 },
          icon: { type: "string", example: "Shield" },
          active: { type: "boolean", example: true },
          operations: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyOperation" },
          },
          subModules: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchySubModule" },
          },
        },
      },
      Hierarchy: {
        type: "object",
        properties: {
          modules: { type: "array", items: { $ref: "#/components/schemas/HierarchyModule" } },
        },
      },
      AuthSuccess: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          expiresIn: { type: "integer", example: 900, description: "Token validity in seconds (15 mins)" },
        },
      },
      AuditActor: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          email: { type: "string", format: "email", example: "admin@accessorbit.com" },
          name: { type: "string", example: "Super Administrator" },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123461" },
          actor: { $ref: "#/components/schemas/AuditActor" },
          action: { type: "string", example: "user.role.assigned" },
          category: { type: "string", example: "rbac" },
          targetId: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          targetType: { type: "string", example: "User" },
          details: { type: "object", example: { role: "Administrator", grantedBy: "admin@accessorbit.com" } },
          status: { type: "string", enum: ["success", "failure"], example: "success" },
          ipAddress: { type: "string", example: "192.168.1.100" },
          userAgent: { type: "string", example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          requestId: { type: "string", example: "req_9f8b2a1e-3c4d-4e5f" },
          createdAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
          updatedAt: { type: "string", example: "2026-08-14T03:45:00.000Z" },
        },
      },
      AuditLogPage: paginatedData("#/components/schemas/AuditLog"),
      SearchResultItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "66b1a2c3d4e5f67890123456" },
          title: { type: "string", example: "Jane Doe" },
          subtitle: { type: "string", example: "jane.doe@accessorbit.com" },
          type: {
            type: "string",
            enum: ["user", "role", "module", "permission", "audit-log"],
            example: "user",
          },
          url: { type: "string", example: "/users/66b1a2c3d4e5f67890123456" },
          badge: { type: "string", example: "Administrator" },
        },
      },
      SearchResult: {
        type: "object",
        properties: {
          query: { type: "string", example: "jane" },
          results: { type: "array", items: { $ref: "#/components/schemas/SearchResultItem" } },
        },
      },
      HealthData: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok", "degraded"], example: "ok" },
          database: { type: "string", enum: ["up", "down"], example: "up" },
          uptime: { type: "integer", example: 18450, description: "Process uptime in seconds" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: operation(
        "Health",
        "System health and database connectivity diagnostic",
        "public",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/HealthData" }, "AccessOrbit API is healthy"),
          503: errorResponse("Database is unavailable (SERVICE_UNAVAILABLE)"),
        },
        "Returns the API liveness status, process uptime, and live MongoDB connection state.",
        true
      ),
    },
    "/auth/login": {
      post: operation(
        "Authentication",
        "Authenticate user credentials and issue JWT tokens",
        "public",
        [],
        jsonBody("User login credentials", {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@accessorbit.com" },
            password: { type: "string", example: "Admin@123456" },
          },
        }),
        {
          200: successData({ $ref: "#/components/schemas/AuthSuccess" }, "Login successful"),
          401: errorResponse("Invalid email or password (AUTH_INVALID_CREDENTIALS)"),
          403: errorResponse("User account is suspended or disabled (AUTH_USER_DISABLED)"),
          422: errorResponse("Validation failed on email or password (VALIDATION_ERROR)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Authenticates the user with email and password. Sets an `httpOnly`, `Secure` refresh cookie and returns a short-lived 15-minute JWT access token.",
        true
      ),
    },
    "/auth/refresh": {
      post: operation(
        "Authentication",
        "Refresh expired JWT access token using refresh cookie",
        "public",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/AuthSuccess" }, "Token refreshed"),
          401: errorResponse("Missing, expired, or invalid refresh token (AUTH_REFRESH_INVALID)"),
          403: errorResponse("User account suspended (AUTH_USER_DISABLED)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Extracts the refresh token from the `httpOnly` cookie, rotates the token family in the database, and issues a fresh 15-minute access token.",
        true
      ),
    },
    "/auth/logout": {
      post: operation(
        "Authentication",
        "Logout current user session and revoke refresh token",
        "public",
        [],
        undefined,
        {
          200: successData({ type: "object" }, "Logged out successfully"),
          401: errorResponse("Missing or invalid authentication token (AUTH_UNAUTHORIZED)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Revokes the session refresh token from MongoDB, clears the client `httpOnly` cookie, and records an audit trail entry."
      ),
    },
    "/auth/me": {
      get: operation(
        "Authentication",
        "Get current authenticated user profile and permissions",
        "public",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          401: errorResponse("Missing or invalid access token (AUTH_UNAUTHORIZED)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Returns the active user profile, assigned roles, and runtime resolved permissions for the current bearer token."
      ),
    },
    "/users": {
      get: operation(
        "Users",
        "List users with pagination, sorting, and text search",
        "rbac.users.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/User"),
        "Paginated, searchable list of user accounts. Pass `status=active` or `status=suspended` to filter."
      ),
      post: operation(
        "Users",
        "Create a new user account with initial role assignments",
        "rbac.users.create",
        [],
        jsonBody("User creation payload", { $ref: "#/components/schemas/CreateUserBody" }),
        {
          201: successData({ $ref: "#/components/schemas/UserSingle" }, "User created successfully"),
          ...standardErrors(),
        },
        "Creates a new active user and assigns the provided roles. Duplicate emails are rejected with `409 Conflict`."
      ),
    },
    "/users/{id}": {
      get: operation(
        "Users",
        "Get user details by ID",
        "rbac.users.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          ...standardErrors(),
        },
        "Fetches a single user profile including populated role references."
      ),
      patch: operation(
        "Users",
        "Update user profile details or toggle account status",
        "rbac.users.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateUserBody" }),
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }, "User updated successfully"),
          ...standardErrors(),
        },
        "Modifies name, email, or status. Pass `status: 'suspended'` to instantly lock an account out of the system."
      ),
      delete: operation(
        "Users",
        "Permanently delete a user account",
        "rbac.users.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "User deleted successfully"),
          ...standardErrors(),
        },
        "Deletes the user record and purges all active refresh tokens. Self-deletion by the requesting admin is rejected with `409 Conflict`."
      ),
    },
    "/users/{id}/roles": {
      post: operation(
        "Users",
        "Set or replace roles assigned to a user",
        "rbac.users.assign-roles",
        [idParam],
        jsonBody("Array of role IDs", { $ref: "#/components/schemas/SetUserRolesBody" }),
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }, "User roles updated"),
          ...standardErrors(),
        },
        "Replaces the complete role assignment list for the target user. Changes take effect on the very next request."
      ),
    },
    "/roles": {
      get: operation(
        "Roles",
        "List RBAC roles with pagination and search",
        "rbac.roles.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/Role"),
        "Retrieves system and custom roles with their assigned permission key lists."
      ),
      post: operation(
        "Roles",
        "Create a new custom RBAC role",
        "rbac.roles.create",
        [],
        jsonBody("Role creation payload", { $ref: "#/components/schemas/CreateRoleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/RoleSingle" }, "Role created successfully"),
          ...standardErrors(),
        },
        "Creates a role with an automatically generated kebab-case slug and optional initial permission key bindings."
      ),
    },
    "/roles/{id}": {
      get: operation(
        "Roles",
        "Get role details by ID",
        "rbac.roles.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/RoleSingle" }),
          ...standardErrors(),
        },
        "Returns role metadata and assigned permission keys."
      ),
      patch: operation(
        "Roles",
        "Update role name, description, or active status",
        "rbac.roles.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateRoleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/RoleSingle" }, "Role updated successfully"),
          ...standardErrors(),
        },
        "Updates role metadata. System roles retain fixed slugs."
      ),
      delete: operation(
        "Roles",
        "Delete a custom role",
        "rbac.roles.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "Role deleted successfully"),
          ...standardErrors(),
        },
        "Protected system roles (such as `Administrator`) or roles actively assigned to users cannot be deleted (`409 Conflict`)."
      ),
    },
    "/roles/{id}/permissions": {
      get: operation(
        "Role Permissions",
        "List all permissions assigned to a role",
        "rbac.role-permissions.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/RolePermissionList" }),
          ...standardErrors(),
        },
        "Returns all granular permission items attached to this role."
      ),
      post: operation(
        "Role Permissions",
        "Assign an atomic permission key to a role",
        "rbac.role-permissions.assign",
        [idParam],
        jsonBody("Permission assignment payload", { $ref: "#/components/schemas/AssignPermissionBody" }),
        {
          200: successData({ $ref: "#/components/schemas/RolePermissionList" }, "Permission assigned to role"),
          ...standardErrors(),
        },
        "Immediately grants the permission key to the role. Duplicate assignments are rejected with `409 Conflict`."
      ),
    },
    "/roles/{id}/permissions/{permissionId}": {
      delete: operation(
        "Role Permissions",
        "Remove an atomic permission from a role",
        "rbac.role-permissions.remove",
        [idParam, permissionIdParam],
        undefined,
        {
          200: successData({ type: "object" }, "Permission removed from role"),
          ...standardErrors(),
        },
        "Revokes the permission from the role immediately across all assigned users."
      ),
    },
    "/modules": {
      get: operation(
        "Modules",
        "List top-level RBAC modules",
        "rbac.modules.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/Module"),
        "Paginated list of top-level application domain modules."
      ),
      post: operation(
        "Modules",
        "Create a new top-level module",
        "rbac.modules.create",
        [],
        jsonBody("Module payload", { $ref: "#/components/schemas/CreateModuleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/ModuleSingle" }, "Module created successfully"),
          ...standardErrors(),
        },
        "Creates a module with a unique kebab-case key and Lucide icon identifier."
      ),
    },
    "/modules/hierarchy": {
      get: operation(
        "Modules",
        "Get full 4-tier RBAC hierarchy tree",
        "rbac.modules.view",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/Hierarchy" }, "RBAC hierarchy retrieved"),
          ...standardErrors(),
        },
        "Returns the entire tree: `Modules` → `Sub-Modules` → `Operations` → `Permissions` in a single high-performance query."
      ),
    },
    "/modules/{id}": {
      get: operation(
        "Modules",
        "Get module details by ID",
        "rbac.modules.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/ModuleSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Modules",
        "Update module metadata or display order",
        "rbac.modules.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateModuleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/ModuleSingle" }, "Module updated successfully"),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Modules",
        "Delete a top-level module",
        "rbac.modules.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "Module deleted successfully"),
          ...standardErrors(),
        },
        "Modules with attached sub-modules, operations, or permissions cannot be deleted (`409 Conflict`)."
      ),
    },
    "/sub-modules": {
      get: operation(
        "Sub-Modules",
        "List sub-modules with parent module filtering",
        "rbac.sub-modules.view",
        [...pageParams, statusParam, moduleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/SubModule")
      ),
      post: operation(
        "Sub-Modules",
        "Create a new sub-module",
        "rbac.sub-modules.create",
        [],
        jsonBody("Sub-module payload", { $ref: "#/components/schemas/CreateSubModuleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/SubModuleSingle" }, "Sub-module created successfully"),
          ...standardErrors(),
        }
      ),
    },
    "/sub-modules/{id}": {
      get: operation(
        "Sub-Modules",
        "Get sub-module details by ID",
        "rbac.sub-modules.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/SubModuleSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Sub-Modules",
        "Update sub-module name or order",
        "rbac.sub-modules.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateSubModuleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/SubModuleSingle" }, "Sub-module updated successfully"),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Sub-Modules",
        "Delete a sub-module",
        "rbac.sub-modules.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "Sub-module deleted successfully"),
          ...standardErrors(),
        },
        "Sub-modules referenced by operations cannot be deleted (`409 Conflict`)."
      ),
    },
    "/operations": {
      get: operation(
        "Operations",
        "List operations filtered by module or sub-module",
        "rbac.operations.view",
        [...pageParams, statusParam, moduleIdQueryParam, subModuleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/Operation")
      ),
      post: operation(
        "Operations",
        "Create a functional operation",
        "rbac.operations.create",
        [],
        jsonBody("Operation payload", { $ref: "#/components/schemas/CreateOperationBody" }),
        {
          201: successData({ $ref: "#/components/schemas/OperationSingle" }, "Operation created successfully"),
          ...standardErrors(),
        }
      ),
    },
    "/operations/{id}": {
      get: operation(
        "Operations",
        "Get operation details by ID",
        "rbac.operations.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/OperationSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Operations",
        "Update operation name or sort order",
        "rbac.operations.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateOperationBody" }),
        {
          200: successData({ $ref: "#/components/schemas/OperationSingle" }, "Operation updated successfully"),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Operations",
        "Delete an operation",
        "rbac.operations.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "Operation deleted successfully"),
          ...standardErrors(),
        },
        "Operations referenced by active permissions cannot be deleted (`409 Conflict`)."
      ),
    },
    "/permissions": {
      get: operation(
        "Permissions",
        "List permission codes with search and module filtering",
        "rbac.permissions.view",
        [...pageParams, statusParam, moduleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/Permission"),
        "Lists atomic permission codes (e.g., `rbac.users.create`, `audit.view`)."
      ),
      post: operation(
        "Permissions",
        "Create a new atomic permission code",
        "rbac.permissions.create",
        [],
        jsonBody("Permission creation payload", { $ref: "#/components/schemas/CreatePermissionBody" }),
        {
          201: successData({ $ref: "#/components/schemas/PermissionSingle" }, "Permission created successfully"),
          ...standardErrors(),
        },
        "Creates a fine-grained permission code linked to a parent module and operation."
      ),
    },
    "/permissions/{id}": {
      get: operation(
        "Permissions",
        "Get permission details by ID",
        "rbac.permissions.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/PermissionSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Permissions",
        "Update permission metadata or toggle active state",
        "rbac.permissions.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdatePermissionBody" }),
        {
          200: successData({ $ref: "#/components/schemas/PermissionSingle" }, "Permission updated successfully"),
          ...standardErrors(),
        },
        "Disabling a permission (`active: false`) immediately suspends access across all roles without deleting history."
      ),
      delete: operation(
        "Permissions",
        "Delete an unassigned permission",
        "rbac.permissions.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }, "Permission deleted successfully"),
          ...standardErrors(),
        },
        "Permissions actively bound to roles cannot be deleted (`409 Conflict`)."
      ),
    },
    "/audit-logs": {
      get: operation(
        "Audit Logs",
        "List compliance audit logs with advanced filters",
        "audit.view",
        [
          ...pageParams,
          {
            in: "query",
            name: "category",
            schema: { type: "string" },
            description: "Filter by category (e.g., `auth`, `rbac`, `users`, `roles`)",
          },
          {
            in: "query",
            name: "action",
            schema: { type: "string" },
            description: "Filter by exact action key (e.g., `auth.login.success`, `user.created`)",
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["success", "failure"] },
            description: "Filter by outcome status",
          },
          {
            in: "query",
            name: "actorId",
            schema: { type: "string" },
            description: "Filter by actor user ObjectId",
          },
          {
            in: "query",
            name: "startDate",
            schema: { type: "string", format: "date-time" },
            description: "ISO 8601 start timestamp filter",
          },
          {
            in: "query",
            name: "endDate",
            schema: { type: "string", format: "date-time" },
            description: "ISO 8601 end timestamp filter",
          },
        ],
        undefined,
        listResponses("#/components/schemas/AuditLog"),
        "Returns immutable chronological audit records capturing actors, actions, IP addresses, user agents, and status."
      ),
    },
    "/search": {
      get: operation(
        "Search",
        "Unified global search across all RBAC entities",
        "authenticated",
        [
          {
            in: "query",
            name: "q",
            required: true,
            schema: { type: "string", minLength: 2, maxLength: 100 },
            description: "Search keyword query (minimum 2 characters)",
          },
        ],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/SearchResult" }),
          ...standardErrors(),
        },
        "Searches across users, roles, modules, permissions, and audit logs respecting the requesting user's resolved permissions."
      ),
    },
  },
};