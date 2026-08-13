import type { OpenAPIV3 } from "openapi-types";

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Access token from POST /auth/login",
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
  401: errorResponse("Missing or invalid access token (AUTH_UNAUTHORIZED)"),
  403: errorResponse("Authenticated but the required permission is missing (AUTH_FORBIDDEN)"),
  404: errorResponse("Resource not found (NOT_FOUND)"),
  409: errorResponse("Conflict — duplicate or integrity violation (CONFLICT)"),
  422: errorResponse("Request validation failed (VALIDATION_ERROR)"),
  500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
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
    description: "Page number (1-based)",
  },
  {
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    description: "Items per page",
  },
  {
    in: "query",
    name: "search",
    schema: { type: "string", maxLength: 100 },
    description: "Case-insensitive text search",
  },
  {
    in: "query",
    name: "sort",
    schema: { type: "string" },
    description: "Sort field (whitelisted per resource)",
  },
  {
    in: "query",
    name: "order",
    schema: { type: "string", enum: ["asc", "desc"] },
    description: "Sort direction",
  },
];

const statusParam: OpenAPIV3.ParameterObject = {
  in: "query",
  name: "status",
  schema: { type: "string", enum: ["active", "inactive"] },
  description: "Filter by active/inactive state",
};

const idParam: OpenAPIV3.ParameterObject = {
  in: "path",
  name: "id",
  required: true,
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "MongoDB ObjectId",
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
  description: "Filter by parent module",
};

const subModuleIdQueryParam: OpenAPIV3.ParameterObject = {
  in: "query",
  name: "subModuleId",
  schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
  description: "Filter by parent sub-module",
};

const paginatedData = (
  itemsSchemaRef: string
): OpenAPIV3.SchemaObject => ({
  type: "object",
  properties: {
    items: { type: "array", items: { $ref: itemsSchemaRef } },
    page: { type: "integer" },
    limit: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
});

const successData = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): OpenAPIV3.ResponseObject => ({
  description: "Successful response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: schema,
          requestId: { type: "string" },
        },
      },
    },
  },
});

const operation = (
  summary: string,
  permissionKey: string,
  params: OpenAPIV3.ParameterObject[],
  requestBody: OpenAPIV3.RequestBodyObject | undefined,
  responses: Record<string, OpenAPIV3.ResponseObject>,
  description?: string
): OpenAPIV3.OperationObject => ({
  summary,
  description:
    description ??
    `Requires authentication and the \`${permissionKey}\` permission.`,
  security: [{ bearerAuth: [] }],
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
    title: "AccessOrbit API",
    version: "0.5.0",
    description:
      "Enterprise access control API with a fully dynamic RBAC system. Every administrative endpoint is protected by `requireAuth` + `requirePermission` and resolves permissions from the database on each request — no code changes are needed when new roles or permissions are introduced through these APIs.",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Authentication" },
    { name: "Users" },
    { name: "Roles" },
    { name: "Role Permissions" },
    { name: "Modules" },
    { name: "Sub-Modules" },
    { name: "Operations" },
    { name: "Permissions" },
  ],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      ErrorField: {
        type: "object",
        properties: {
          field: { type: "string" },
          message: { type: "string" },
        },
      },
      ErrorBody: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "array", items: { $ref: "#/components/schemas/ErrorField" } },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          error: { $ref: "#/components/schemas/ErrorBody" },
          requestId: { type: "string" },
        },
      },
      RoleRef: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          active: { type: "boolean" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          status: { type: "string", enum: ["active", "suspended"] },
          lastLoginAt: { type: "string", nullable: true },
          roles: { type: "array", items: { $ref: "#/components/schemas/RoleRef" } },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
        description: "Sensitive fields (passwordHash, refresh tokens) are never returned.",
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
          name: { type: "string", minLength: 1, maxLength: 120 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
          roleIds: { type: "array", items: { type: "string", pattern: "^[0-9a-fA-F]{24}$" } },
        },
      },
      UpdateUserBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          email: { type: "string", format: "email" },
          status: { type: "string", enum: ["active", "suspended"] },
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
          },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          isSystem: { type: "boolean" },
          active: { type: "boolean" },
          permissionKeys: { type: "array", items: { type: "string" } },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
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
          name: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", maxLength: 500 },
          permissionKeys: {
            type: "array",
            maxItems: 200,
            items: { type: "string" },
            description: "Permission keys to assign on creation",
          },
        },
      },
      UpdateRoleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", maxLength: 500 },
          active: { type: "boolean" },
        },
      },
      RolePermission: {
        type: "object",
        properties: {
          roleId: { type: "string" },
          permissionKey: { type: "string" },
          enabled: { type: "boolean" },
          permission: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              key: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              moduleId: { type: "string" },
              operationId: { type: "string" },
              active: { type: "boolean" },
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
        properties: { permissionKey: { type: "string" } },
      },
      Module: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          order: { type: "integer" },
          icon: { type: "string" },
          active: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
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
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          name: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", maxLength: 500 },
          order: { type: "integer", minimum: 0 },
          icon: { type: "string", maxLength: 64 },
        },
      },
      UpdateModuleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: "string", maxLength: 500 },
          order: { type: "integer", minimum: 0 },
          icon: { type: "string", maxLength: 64 },
          active: { type: "boolean" },
        },
        description: "`key` is immutable after creation.",
      },
      SubModule: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          moduleId: { type: "string" },
          order: { type: "integer" },
          active: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
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
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          name: { type: "string", minLength: 1, maxLength: 120 },
          order: { type: "integer", minimum: 0 },
        },
      },
      UpdateSubModuleBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          order: { type: "integer", minimum: 0 },
          active: { type: "boolean" },
        },
        description: "`key` is immutable after creation.",
      },
      Operation: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          moduleId: { type: "string" },
          subModuleId: { type: "string", nullable: true },
          order: { type: "integer" },
          active: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
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
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          subModuleId: {
            type: "string",
            nullable: true,
            pattern: "^[0-9a-fA-F]{24}$",
            description: "Must belong to the given module",
          },
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          name: { type: "string", minLength: 1, maxLength: 120 },
          order: { type: "integer", minimum: 0 },
        },
      },
      UpdateOperationBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 120 },
          order: { type: "integer", minimum: 0 },
          active: { type: "boolean" },
        },
        description: "`key` is immutable after creation.",
      },
      Permission: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          moduleId: { type: "string" },
          operationId: { type: "string" },
          active: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
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
          key: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*\\.[a-z0-9-]+$" },
          name: { type: "string", minLength: 1, maxLength: 160 },
          description: { type: "string", maxLength: 500 },
          moduleId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
          operationId: {
            type: "string",
            pattern: "^[0-9a-fA-F]{24}$",
            description: "Operation must belong to the given module",
          },
        },
      },
      UpdatePermissionBody: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 160 },
          description: { type: "string", maxLength: 500 },
          active: { type: "boolean" },
        },
        description: "`key` is immutable after creation. Prefer disabling over deleting.",
      },
      HierarchyPermission: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          active: { type: "boolean" },
        },
      },
      HierarchyOperation: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          order: { type: "integer" },
          active: { type: "boolean" },
          permissions: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyPermission" },
          },
        },
      },
      HierarchySubModule: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          order: { type: "integer" },
          active: { type: "boolean" },
          operations: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyOperation" },
          },
        },
      },
      HierarchyModule: {
        type: "object",
        properties: {
          id: { type: "string" },
          key: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          order: { type: "integer" },
          icon: { type: "string" },
          active: { type: "boolean" },
          operations: {
            type: "array",
            items: { $ref: "#/components/schemas/HierarchyOperation" },
            description: "Operations not attached to a sub-module",
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
          accessToken: { type: "string" },
          expiresIn: { type: "integer" },
        },
      },
    },
  },
  paths: {
    "/auth/login": {
      post: operation(
        "Authenticate with email and password",
        "public",
        [],
        jsonBody("Credentials", {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        }),
        {
          200: successData({ $ref: "#/components/schemas/AuthSuccess" }),
          401: errorResponse("Invalid credentials (AUTH_INVALID_CREDENTIALS)"),
          403: errorResponse("Account disabled (AUTH_USER_DISABLED)"),
          422: errorResponse("Validation failed (VALIDATION_ERROR)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Public endpoint. Sets an httpOnly refresh-token cookie and returns a 15-minute access token."
      ),
    },
    "/auth/me": {
      get: operation(
        "Get the current user",
        "public",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          401: errorResponse("Missing or invalid access token (AUTH_UNAUTHORIZED)"),
          500: errorResponse("Unexpected server error (INTERNAL_SERVER_ERROR)"),
        },
        "Requires `Authorization: Bearer <accessToken>`. Returns the authenticated user without sensitive fields."
      ),
    },
    "/users": {
      get: operation(
        "List users",
        "rbac.users.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/User"),
        "Paginated, searchable user list. `status` accepts `active` or `suspended`. Never returns password hashes or refresh tokens."
      ),
      post: operation(
        "Create a user",
        "rbac.users.create",
        [],
        jsonBody("User payload", { $ref: "#/components/schemas/CreateUserBody" }),
        {
          201: successData({ $ref: "#/components/schemas/UserSingle" }),
          ...standardErrors(),
        },
        "Creates an active user with the given roles. Duplicate emails are rejected with 409."
      ),
    },
    "/users/{id}": {
      get: operation(
        "Get a user",
        "rbac.users.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Update a user",
        "rbac.users.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateUserBody" }),
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          ...standardErrors(),
        },
        "Updates name/email/status only. Protected authentication fields (passwordHash, refresh tokens) cannot be modified."
      ),
      delete: operation(
        "Delete a user",
        "rbac.users.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Deletes the user and revokes all of their refresh tokens. Self-deletion is rejected with 409."
      ),
    },
    "/users/{id}/roles": {
      post: operation(
        "Assign roles to a user",
        "rbac.users.assign-roles",
        [idParam],
        jsonBody("Role ids", { $ref: "#/components/schemas/SetUserRolesBody" }),
        {
          200: successData({ $ref: "#/components/schemas/UserSingle" }),
          ...standardErrors(),
        },
        "Replaces the user's roles. Every role must exist; unknown ids are rejected with 422."
      ),
    },
    "/roles": {
      get: operation(
        "List roles",
        "rbac.roles.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/Role"),
        "Each role includes its assigned `permissionKeys`."
      ),
      post: operation(
        "Create a role",
        "rbac.roles.create",
        [],
        jsonBody("Role payload", { $ref: "#/components/schemas/CreateRoleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/RoleSingle" }),
          ...standardErrors(),
        },
        "The role slug is derived from the name. Duplicate slugs are rejected with 409."
      ),
    },
    "/roles/{id}": {
      get: operation(
        "Get a role",
        "rbac.roles.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/RoleSingle" }),
          ...standardErrors(),
        },
        "Returns the role with its assigned `permissionKeys`."
      ),
      patch: operation(
        "Update a role",
        "rbac.roles.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateRoleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/RoleSingle" }),
          ...standardErrors(),
        },
        "Renaming regenerates the slug. Duplicate slugs are rejected with 409."
      ),
      delete: operation(
        "Delete a role",
        "rbac.roles.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "System roles and roles assigned to users cannot be deleted (409)."
      ),
    },
    "/roles/{id}/permissions": {
      get: operation(
        "List a role's permissions",
        "rbac.role-permissions.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/RolePermissionList" }),
          ...standardErrors(),
        }
      ),
      post: operation(
        "Assign a permission to a role",
        "rbac.role-permissions.assign",
        [idParam],
        jsonBody("Permission key", { $ref: "#/components/schemas/AssignPermissionBody" }),
        {
          200: successData({ $ref: "#/components/schemas/RolePermissionList" }),
          ...standardErrors(),
        },
        "Rejects assignments to disabled roles (409), unknown or disabled permissions (422), and duplicate assignments (409). Takes effect immediately."
      ),
    },
    "/roles/{id}/permissions/{permissionId}": {
      delete: operation(
        "Remove a permission from a role",
        "rbac.role-permissions.remove",
        [idParam, permissionIdParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Removes the assignment immediately. Returns 404 if the permission is not assigned."
      ),
    },
    "/modules": {
      get: operation(
        "List modules",
        "rbac.modules.view",
        [...pageParams, statusParam],
        undefined,
        listResponses("#/components/schemas/Module")
      ),
      post: operation(
        "Create a module",
        "rbac.modules.create",
        [],
        jsonBody("Module payload", { $ref: "#/components/schemas/CreateModuleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/ModuleSingle" }),
          ...standardErrors(),
        },
        "Module keys must be unique kebab-case codes. Duplicates are rejected with 409."
      ),
    },
    "/modules/hierarchy": {
      get: operation(
        "Get the full RBAC hierarchy",
        "rbac.modules.view",
        [],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/Hierarchy" }),
          ...standardErrors(),
        },
        "Returns modules → sub-modules → operations → permissions in a single response so the frontend can render the RBAC management UI without dozens of requests."
      ),
    },
    "/modules/{id}": {
      get: operation(
        "Get a module",
        "rbac.modules.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/ModuleSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Update a module",
        "rbac.modules.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateModuleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/ModuleSingle" }),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Delete a module",
        "rbac.modules.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Modules referenced by sub-modules, operations, or permissions cannot be deleted (409)."
      ),
    },
    "/sub-modules": {
      get: operation(
        "List sub-modules",
        "rbac.sub-modules.view",
        [...pageParams, statusParam, moduleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/SubModule")
      ),
      post: operation(
        "Create a sub-module",
        "rbac.sub-modules.create",
        [],
        jsonBody("Sub-module payload", { $ref: "#/components/schemas/CreateSubModuleBody" }),
        {
          201: successData({ $ref: "#/components/schemas/SubModuleSingle" }),
          ...standardErrors(),
        },
        "The parent module must exist (422 otherwise). Keys are unique per module (409 on duplicates)."
      ),
    },
    "/sub-modules/{id}": {
      get: operation(
        "Get a sub-module",
        "rbac.sub-modules.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/SubModuleSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Update a sub-module",
        "rbac.sub-modules.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateSubModuleBody" }),
        {
          200: successData({ $ref: "#/components/schemas/SubModuleSingle" }),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Delete a sub-module",
        "rbac.sub-modules.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Sub-modules referenced by operations cannot be deleted (409)."
      ),
    },
    "/operations": {
      get: operation(
        "List operations",
        "rbac.operations.view",
        [...pageParams, statusParam, moduleIdQueryParam, subModuleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/Operation")
      ),
      post: operation(
        "Create an operation",
        "rbac.operations.create",
        [],
        jsonBody("Operation payload", { $ref: "#/components/schemas/CreateOperationBody" }),
        {
          201: successData({ $ref: "#/components/schemas/OperationSingle" }),
          ...standardErrors(),
        },
        "The module must exist and an optional sub-module must belong to that module (422 otherwise). Duplicate keys per module/sub-module are rejected with 409."
      ),
    },
    "/operations/{id}": {
      get: operation(
        "Get an operation",
        "rbac.operations.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/OperationSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Update an operation",
        "rbac.operations.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdateOperationBody" }),
        {
          200: successData({ $ref: "#/components/schemas/OperationSingle" }),
          ...standardErrors(),
        }
      ),
      delete: operation(
        "Delete an operation",
        "rbac.operations.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Operations referenced by permissions cannot be deleted (409)."
      ),
    },
    "/permissions": {
      get: operation(
        "List permissions",
        "rbac.permissions.view",
        [...pageParams, statusParam, moduleIdQueryParam],
        undefined,
        listResponses("#/components/schemas/Permission")
      ),
      post: operation(
        "Create a permission",
        "rbac.permissions.create",
        [],
        jsonBody("Permission payload", { $ref: "#/components/schemas/CreatePermissionBody" }),
        {
          201: successData({ $ref: "#/components/schemas/PermissionSingle" }),
          ...standardErrors(),
        },
        "Permission keys must be unique dotted codes (409 on duplicates). The operation must belong to the given module (422 otherwise)."
      ),
    },
    "/permissions/{id}": {
      get: operation(
        "Get a permission",
        "rbac.permissions.view",
        [idParam],
        undefined,
        {
          200: successData({ $ref: "#/components/schemas/PermissionSingle" }),
          ...standardErrors(),
        }
      ),
      patch: operation(
        "Update a permission",
        "rbac.permissions.update",
        [idParam],
        jsonBody("Fields to update", { $ref: "#/components/schemas/UpdatePermissionBody" }),
        {
          200: successData({ $ref: "#/components/schemas/PermissionSingle" }),
          ...standardErrors(),
        },
        "Set `active: false` to disable a permission; disabled permissions immediately stop granting access."
      ),
      delete: operation(
        "Delete a permission",
        "rbac.permissions.delete",
        [idParam],
        undefined,
        {
          200: successData({ type: "object" }),
          ...standardErrors(),
        },
        "Permissions assigned to roles cannot be deleted (409); disable them instead."
      ),
    },
  },
};