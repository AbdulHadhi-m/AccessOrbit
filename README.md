# AccessOrbit

**Enterprise Access Control and Management Platform** with a fully dynamic Role-Based Access Control (RBAC) system.

New modules, sub-modules, operations, permissions, roles, and role assignments are managed as data through the application — no authorization code changes required.

> **Status: Phase 4 (Authorization)** — dynamic RBAC authorization middleware is live: `requireAuth` → `requirePermission("module.subModule.operation")` → 403 `AUTH_FORBIDDEN` on denial. Permissions resolve from the database on every request (role active + assignment enabled + permission active), so role/permission changes take effect instantly with no redeploy. No caching yet — the resolution service is isolated so Redis can be introduced behind the same API later. RBAC administration APIs and the frontend come next.

## Architecture Summary

- **Modular monolith** backend — Express + TypeScript + Mongoose, organized into feature modules (`src/modules/*`) with layered internals (routes → controllers → services → repositories → models) on a shared infrastructure base.
- **Feature-based frontend** — Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui, organized into isolated `src/features/*`.
- **Permission-based authorization** — the RBAC core is data-driven. Authorization checks permission keys (e.g. `employee.view`), never role names.
- **Monorepo** — npm workspaces (`backend`, `frontend`), independently runnable and deployable.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB |
| Validation | Zod |
| Logging | Pino (structured JSON, redacted secrets) |
| Security | Helmet, CORS, rate limiting, JWT (later phase) |

## Project Structure

```
AccessOrbit/
├── frontend/                  # Next.js application
│   └── src/
│       ├── app/               # Routes, layouts, error/loading/not-found boundaries
│       ├── features/          # Business features (auth, users, roles, ...)
│       ├── components/        # Shared UI (ui/ = shadcn primitives)
│       ├── hooks/             # Shared hooks
│       ├── services/          # API clients
│       ├── providers/         # App providers (theme, ...)
│       ├── lib/               # Utilities (cn, ...)
│       ├── types/             # Shared types
│       └── config/            # Environment configuration
├── backend/                   # Express API
│   └── src/
│       ├── modules/           # Feature modules (health, and later auth/users/roles/...)
│       ├── shared/            # Errors, middleware, logger, validation, types, constants
│       ├── config/            # Zod-validated environment configuration
│       ├── database/          # MongoDB connection (Mongoose)
│       ├── app.ts             # Express application assembly
│       └── server.ts          # Server bootstrap (env → db → listen → graceful shutdown)
└── docs/                      # Architecture and design documents
```

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB (local install or Atlas cluster)

## Environment Setup

1. **Backend** — copy and edit:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Required variables (validated at startup; the app fails fast if any are missing or invalid):

   | Variable | Description |
   |---|---|
   | `NODE_ENV` | `development` / `test` / `production` |
   | `PORT` | API port (default 4000) |
   | `MONGODB_URI` | MongoDB connection string |
   | `FRONTEND_URL` | Frontend origin (used for CORS) |
   | `JWT_ACCESS_SECRET` | ≥ 32 chars — signs 15-minute access tokens |
   | `JWT_REFRESH_SECRET` | ≥ 32 chars, different from access — reserved for future use |
   | `LOG_LEVEL` | `info` default |
   | `SEED_ADMIN_EMAIL` | Optional — email for the seeded super administrator |
   | `SEED_ADMIN_PASSWORD` | Optional — password for the seeded super administrator (min 8 chars) |
   | `SEED_DEMO_EMAIL` | Optional — email for the seeded demo user (created only if absent) |
   | `SEED_DEMO_PASSWORD` | Optional — password for the seeded demo user (min 8 chars) |

2. **Frontend** — optional; defaults to `http://localhost:4000`:

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

## Seeding the Database

Creates the RBAC hierarchy (modules, sub-modules, operations, permissions), the six system roles, role-permission assignments, the super administrator, and (when configured) a demo user with the HR Manager role. Safe to run repeatedly:

```bash
npm run seed
```

## Authentication

| Endpoint | Description |
|---|---|
| `POST /api/v1/auth/login` | Email + password → access token (body) + refresh token (httpOnly cookie) |
| `POST /api/v1/auth/refresh` | Rotates the refresh token and issues a new access token |
| `POST /api/v1/auth/logout` | Revokes the refresh-token family and clears the cookie |
| `GET /api/v1/auth/me` | Current user (requires `Authorization: Bearer <accessToken>`) |

Access tokens expire after 15 minutes and contain only `sub`/`type`/`jti` — permissions are never embedded and are resolved from the RBAC system per request. Refresh tokens are opaque, stored SHA-256 hashed, rotated on every refresh, revoked on logout, and guarded by reuse detection (reusing a rotated token revokes the entire session family).

## Authorization

Protecting an endpoint is two layers, kept fully separate:

```ts
router.get("/employees", requireAuth, requirePermission("employee.employees.view"), controller);
```

- **`requireAuth`** answers *who the user is* (identity from the JWT).
- **`requirePermission("key")`** answers *what the user may do* — it resolves the user's active roles → enabled role-permission rows → active permissions from MongoDB **on every request**, then denies with `403 AUTH_FORBIDDEN` if the key is absent.

Authorization never consults role names, and never trusts client-supplied role IDs, permission arrays, or user IDs. Because resolution is database-backed, adding/removing/disabling a permission or changing a user's role takes effect immediately — no redeploy, no token reissue. Access tokens contain no permission claims, so they stay valid for their 15-minute lifetime regardless of RBAC changes; each request re-resolves against current database state.

**Caching boundary:** resolution is currently uncached by design (correctness over premature optimization). The `permissionResolutionService` API (`resolvePermissionsForUser(userId) → { permissions }`) is the single seam where a generation-stamped Redis cache can be introduced later without touching middleware or routes.

Verification endpoints exist under `GET/POST/DELETE /api/v1/test/employee-{view,create,delete}` (protected by `employee.employees.*`) until real business modules are built.

## Admin API (RBAC management)

All admin endpoints are protected by `requireAuth` + a dynamic permission (`rbac.*`) — never by role name. Slugs and permission keys are derived server-side (e.g. role `slug` from `name`); keys are immutable once created because they are embedded in permission-key strings.

| Group | Endpoints | Permission required |
|---|---|---|
| Users | `GET/POST /api/v1/users`, `GET/PATCH/DELETE /api/v1/users/:id`, `POST /api/v1/users/:id/roles` | `rbac.users.{view,create,update,delete,assign-roles}` |
| Roles | `GET/POST /api/v1/roles`, `GET/PATCH/DELETE /api/v1/roles/:id` | `rbac.roles.{view,create,update,delete}` |
| Role permissions | `GET /api/v1/roles/:id/permissions`, `POST /api/v1/roles/:id/permissions`, `DELETE /api/v1/roles/:id/permissions/:permissionId` | `rbac.role-permissions.{view,assign,remove}` |
| Modules | `GET/POST /api/v1/modules`, `GET/PATCH/DELETE /api/v1/modules/:id`, `GET /api/v1/modules/hierarchy` | `rbac.modules.*` |
| Sub-modules | `GET/POST /api/v1/sub-modules`, `GET/PATCH/DELETE /api/v1/sub-modules/:id` | `rbac.sub-modules.*` |
| Operations | `GET/POST /api/v1/operations`, `GET/PATCH/DELETE /api/v1/operations/:id` | `rbac.operations.*` |
| Permissions | `GET/POST /api/v1/permissions`, `GET/PATCH/DELETE /api/v1/permissions/:id` | `rbac.permissions.*` |

Behavior highlights:
- Lists support pagination (`page`, `limit`), `search`, and `sort`/`order` (e.g. `GET /users?search=jane&status=active&sort=email&order=asc`).
- Error codes: `404` unknown resource, `422` invalid body/relationship (e.g. operation's sub-module belongs to a different module), `409` duplicates and integrity blocks (system role, role in use, module/sub-module/operation/permission referenced by children, self-disable/self-delete).
- Role membership and permission grants take effect immediately — no token reissue (resolution is per-request, see Authorization above).
- No `passwordHash` or refresh tokens are ever returned.

Interactive OpenAPI documentation: `GET /api/v1/docs` (Swagger UI) and raw spec at `GET /api/v1/docs/json`.

## Tests

```bash
npm test    # auth + RBAC core tests (uses a separate accessorbit_test database)
```

## Installation

```bash
npm install
```

## Development

Run both apps (from the repo root):

```bash
npm run dev:backend   # http://localhost:4000  (tsx watch)
npm run dev:frontend  # http://localhost:3000  (Next.js)
```

## Checks and Build

```bash
npm run typecheck     # tsc --noEmit in both workspaces
npm run lint          # ESLint in both workspaces
npm test              # backend test suite
npm run format        # Prettier (repo root)
npm run build         # Production build of both workspaces
```

## Health Endpoint

```
GET http://localhost:4000/api/v1/health
```

Returns `200` with `status: "ok"` and `database: "up"` when connected, or `503` (`SERVICE_UNAVAILABLE`) when the database is unreachable.

## API

- Base path: `/api/v1`
- Consistent response envelope: `{ success, message, data, requestId }` / `{ success, error: { code, message, details }, requestId }`
- Centralized error handling — no stack traces or internal details leak to clients.
- Swagger UI: `http://localhost:4000/api/v1/docs` — Raw OpenAPI 3.0 spec: `http://localhost:4000/api/v1/docs/json`

## Deployment (planned)

- Frontend → Vercel
- API → Render
- MongoDB → MongoDB Atlas

Details will be documented in the README once deployment is implemented.
