# AccessOrbit — System Architecture & Technical Blueprint

**AccessOrbit** is an enterprise-grade access control and identity governance platform powered by a fully dynamic, runtime-evaluated Role-Based Access Control (RBAC) engine.

---

## 1. High-Level Architecture Overview

AccessOrbit is designed as a **Modular Monolith** with a decoupled **Next.js Single-Page Application (SPA)** frontend and a high-throughput **Node.js/Express TypeScript** backend API backed by **MongoDB**.

```mermaid
graph TB
    subgraph ClientLayer ["Client Layer (Next.js 15 App Router)"]
        UI["Web App / Admin Portal<br/>(Tailwind CSS + shadcn/ui)"]
        AuthCtx["In-Memory Auth & Token Store"]
        PermGuard["PermissionGuard & usePermission()"]
    end

    subgraph Gateway ["Express API Gateway & Shared Middleware"]
        ReqId["Request ID Generator"]
        Logger["Pino Structured HTTP Logger"]
        Security["Helmet & CORS Policy"]
        RateLimit["Rate Limiter (General & Strict)"]
        AuthMW["requireAuth (JWT Validator)"]
        PermMW["requirePermission (Dynamic Resolver)"]
    end

    subgraph FeatureDomains ["Modular Monolith Feature Domains"]
        AuthMod["Auth Module<br/>(Login, Refresh, Logout, Me)"]
        UserMod["Users Module<br/>(Lifecycle & Role Assignments)"]
        RoleMod["Roles & Permissions Module<br/>(Role CRUD, M:N Mapping)"]
        HierarchyMod["RBAC Hierarchy Module<br/>(Modules, Sub-Modules, Operations)"]
        AuditMod["Audit Logging Engine<br/>(Sanitization & Trail)"]
        SearchMod["Global Search Engine<br/>(Cross-Entity Index)"]
        DocsMod["OpenAPI / Swagger Engine<br/>(API Spec & Theme)"]
    end

    subgraph DataLayer ["Database & Persistence (MongoDB)"]
        MDB[("MongoDB Replica Set / Atlas")]
        UsersCol[("Users Collection")]
        RolesCol[("Roles Collection")]
        HierarchyCols[("Modules / Operations / Permissions")]
        AuditCol[("AuditLogs (Indexed Time-Series)")]
    end

    UI -->|"HTTPS + Bearer Access Token"| Gateway
    Gateway --> FeatureDomains
    FeatureDomains --> DataLayer
```

---

## 2. Dynamic RBAC Engine Design

### 2.1 The 4-Tier RBAC Hierarchy

AccessOrbit decouples authorization logic into a hierarchical four-tier governance model:

```mermaid
graph TD
    M["1. Module (e.g. 'rbac', 'employee', 'procurement')"] --> SM["2. Sub-Module (e.g. 'user-management', 'leave-requests')"]
    SM --> OP["3. Operation (e.g. 'users', 'disbursements')"]
    OP --> P["4. Permission Code (e.g. 'rbac.users.create', 'employee.leave.approve')"]
    
    P -.->|Assigned to| RP["Role-Permission Mapping"]
    RP -.->|Belongs to| R["Role (e.g. 'HR Manager', 'Super Administrator')"]
    R -.->|Granted to| U["User Account"]
```

1. **Module**: Top-level application boundary or business domain.
2. **Sub-Module**: Logical functional subgrouping inside a parent module.
3. **Operation**: An action set or functional capability (e.g., `view`, `create`, `update`, `delete`, `approve`).
4. **Permission**: The atomic code string (e.g., `rbac.users.create`, `employee.leave.approve`) tested by authorization middleware.

### 2.2 Runtime Permission Resolution (Zero-Code Governance)

Unlike legacy systems that embed static roles or permissions inside JWT claims, AccessOrbit resolves effective permissions **dynamically from MongoDB on every request**.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as Express Router
    participant Auth as requireAuth
    participant Perm as requirePermission("rbac.users.create")
    participant Resolver as permissionResolutionService
    participant DB as MongoDB

    Client->>API: POST /api/v1/users (Headers: Bearer <accessToken>)
    API->>Auth: Verify JWT signature & expiration
    Auth-->>API: Valid user identity attached (req.user)
    
    API->>Perm: Check required permission: "rbac.users.create"
    Perm->>Resolver: resolvePermissionsForUser(userId)
    
    Resolver->>DB: Query User active roles
    Resolver->>DB: Query RolePermissions joined with active Permissions
    DB-->>Resolver: [ "rbac.users.view", "rbac.users.create", ... ]
    
    alt Permission is present
        Resolver-->>Perm: Authorized (true)
        Perm->>API: Proceed to Controller
        API->>DB: Execute Mutation
        API-->>Client: 201 Created (Success Envelope)
    else Permission is missing
        Resolver-->>Perm: Denied (false)
        Perm-->>Client: 403 Forbidden (AUTH_FORBIDDEN)
    end
```

#### Why This Design Matters:
- **Instant Role Revocation**: Revoking a permission or suspending a user takes effect on the very next HTTP request without forcing the user to log out or re-authenticate.
- **Stateless Tokens**: JWT access tokens remain lean (containing only `sub`, `type`, and `jti`), eliminating token bloat and stale permission claims.
- **Future Caching Seam**: The `permissionResolutionService` acts as a single isolation boundary where Redis caching with cache invalidation hooks can be enabled seamlessly.

---

## 3. Authentication & Session Lifecycle

AccessOrbit implements an enterprise dual-token authentication pattern with rotating refresh tokens:

```mermaid
sequenceDiagram
    autonumber
    actor Browser as Frontend SPA
    participant Server as Express Auth Module
    participant DB as MongoDB

    Note over Browser,Server: 1. Login Flow
    Browser->>Server: POST /api/v1/auth/login { email, password }
    Server->>DB: Validate bcrypt password hash & user status
    Server->>DB: Create RefreshToken document (SHA-256 hashed)
    Server-->>Browser: Set-Cookie: ao_refresh_token (HttpOnly, Secure, SameSite)<br/>Body: { accessToken (15m), user, expiresIn }
    
    Note over Browser,Server: 2. Authenticated API Calls
    Browser->>Server: GET /api/v1/users (Authorization: Bearer <accessToken>)
    Server-->>Browser: 200 OK Response

    Note over Browser,Server: 3. Silent Token Refresh
    Browser->>Server: POST /api/v1/auth/refresh (Cookie: ao_refresh_token)
    Server->>DB: Lookup hashed token & verify family reuse detection
    Server->>DB: Revoke old token & insert newly rotated token
    Server-->>Browser: Set-Cookie: updated ao_refresh_token<br/>Body: { new accessToken (15m) }

    Note over Browser,Server: 4. Logout Flow
    Browser->>Server: POST /api/v1/auth/logout
    Server->>DB: Revoke all tokens in session family
    Server-->>Browser: Clear HttpOnly Cookie & 200 OK
```

### Security Safeguards:
- **In-Memory Access Tokens**: The frontend never stores access tokens in `localStorage` or `sessionStorage` (preventing XSS exfiltration).
- **Single-Flight Token Refresh**: When concurrent API requests encounter an expired access token, a single-flight mutex ensures only one refresh request is sent to the backend; all pending calls wait and replay once refreshed.
- **Token Reuse Detection**: If an already-rotated refresh token is re-submitted, AccessOrbit detects the replay attack and revokes the entire token family immediately.

---

## 4. Backend Modular Monolith Structure

The backend follows clean layered architecture principles within each domain module:

```
src/modules/<feature>/
├── <feature>.routes.ts       # Route declarations, route-level rate limiting, and permission gates
├── <feature>.validators.ts   # Zod request body, query parameter, and path param schemas
├── <feature>.controller.ts   # Request/response adaptation, HTTP status mapping, audit triggers
├── <feature>.service.ts      # Core business logic, transactional workflows, validations
└── <feature>.repository.ts   # Mongoose database queries, projection, and pagination
```

### Shared Infrastructure Base (`src/shared/`)
- **`middleware/`**: `request-id`, `http-logger`, `validate` (Zod), `rate-limit`, `error-handler`, `not-found`.
- **`errors/`**: Standard error hierarchy (`AppError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`).
- **`utils/response.ts`**: Standardized JSON envelopes:
  - Success: `{ "success": true, "message": "...", "data": {...}, "requestId": "..." }`
  - Error: `{ "success": false, "message": "...", "error": { "code": "...", "details": [...] }, "requestId": "..." }`

---

## 5. Frontend Architecture & Client Security

### 5.1 Directory Structure & Organization

```
src/
├── app/                      # Next.js App Router root layout & route pages
│   ├── (admin)/              # Protected admin routes (/users, /roles, /modules, /permissions, /audit-logs)
│   ├── (auth)/               # Public authentication routes (/login)
│   └── dashboard/            # System overview & RBAC health dashboard
├── features/                 # Modular feature slices
│   ├── auth/                 # Login forms, authentication hooks
│   ├── dashboard/            # Overview widgets, stat cards, hierarchy flow
│   ├── users/                # User table, creation/edit modals, role assignment
│   ├── roles/                # Roles table, dynamic permission assignment matrix
│   ├── modules/              # 3-tab manager for Modules, Sub-Modules, Operations
│   ├── permissions/          # Permission codes data table & modal forms
│   └── audit-logs/           # Audit trail log table & JSON detail inspector
├── components/               # Reusable UI components & shadcn primitives
│   ├── layout/               # DashboardShell, Sidebar, Header, Breadcrumbs
│   └── ui/                   # Buttons, Tables, Dialogs, Sonner Toaster, SearchDialog
├── hooks/                    # usePermission, useSession, usePermissionError
├── services/                 # Strongly typed Axios/Fetch API clients
└── lib/                      # Client-side helpers, token store, and query utilities
```

### 5.2 Client-Side Permission Gating

The client hydrates effective permissions from `GET /api/v1/auth/me` on boot:

```tsx
// Example of declarative component-level permission guard
<PermissionGuard permission="rbac.users.create" fallback={<Button disabled>Create</Button>}>
  <CreateUserButton onClick={openModal} />
</PermissionGuard>
```

- **`usePermission()` Hook**: Exposes `hasPermission(key)`, `hasAnyPermission([keys])`, and `hasAllPermissions([keys])`.
- **Self-Healing Session**: When an API call returns `403 AUTH_FORBIDDEN` (because a permission was revoked mid-session), `usePermissionError()` catches the error, refreshes the session in the background, and seamlessly adapts the UI.

---

## 6. Database Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Role : "assigned via roleIds"
    Role ||--o{ RolePermission : "contains"
    RolePermission }o--|| Permission : "references"
    Module ||--o{ SubModule : "has many"
    SubModule ||--o{ Operation : "has many"
    Module ||--o{ Operation : "optional direct link"
    Operation ||--o{ Permission : "defines"
    User ||--o{ AuditLog : "initiates (actor)"

    User {
        ObjectId _id
        string name
        string email
        string passwordHash
        string status
        ObjectId[] roleIds
        date lastLoginAt
        date createdAt
    }

    Role {
        ObjectId _id
        string name
        string slug
        string description
        boolean isSystem
        boolean active
    }

    RolePermission {
        ObjectId _id
        ObjectId roleId
        string permissionKey
        boolean enabled
    }

    Module {
        ObjectId _id
        string key
        string name
        string description
        int order
        string icon
        boolean active
    }

    SubModule {
        ObjectId _id
        ObjectId moduleId
        string key
        string name
        int order
        boolean active
    }

    Operation {
        ObjectId _id
        ObjectId moduleId
        ObjectId subModuleId
        string key
        string name
        int order
        boolean active
    }

    Permission {
        ObjectId _id
        ObjectId moduleId
        ObjectId operationId
        string key
        string name
        string description
        boolean active
    }

    AuditLog {
        ObjectId _id
        object actor
        string action
        string category
        string targetId
        string targetType
        object details
        string status
        string ipAddress
        string userAgent
        string requestId
        date createdAt
    }
```

---

## 7. Audit Logging Architecture

Every security-sensitive event (authentication, role modifications, user creation/suspension, permission adjustments) is logged to the `AuditLog` collection:

1. **Non-Blocking Execution**: Auditing runs asynchronously without delaying the client's HTTP response.
2. **Recursive Data Sanitization**: Sensitive keys (such as `password`, `token`, `secret`, `authorization`, `cookie`) are recursively masked as `[REDACTED]` before saving.
3. **Structured Context**: Captures actor ID, IP address, user-agent string, request ID, status (`success` or `failure`), and target resource metadata.

---

## 8. Quality Assurance & Testing Strategy

AccessOrbit enforces comprehensive multi-tiered testing:

- **Unit & Service Tests**: Validates business logic, password hashing, token generation, and validator rules in isolation.
- **Integration Tests**: Tests full HTTP route flows against a dedicated MongoDB test database using Supertest.
- **Frontend Component Tests**: Verifies UI component rendering, modal workflows, dynamic forms, and permission gating using Vitest and React Testing Library.

```bash
# Run backend test suite (17 suites, 170+ tests)
npm test

# Run frontend test suite (9 suites, 59+ tests)
npm test -w frontend
```
