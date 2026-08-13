# AccessOrbit

**Enterprise Access Control and Management Platform** with a fully dynamic Role-Based Access Control (RBAC) system.

New modules, sub-modules, operations, permissions, roles, and role assignments are managed as data through the application — no authorization code changes required.

> **Status: Phase 7 (Dynamic RBAC Administration)** — the full RBAC administration UI is live: users, roles, role-permission assignment, modules, sub-modules, operations, and permissions screens. Every screen is data-driven and gated by permission codes (never role names) via the backend `SafeUser.permissions` + client `can()`. Completed earlier: app shell + auth flow (Phase 6) and the backend RBAC core (Phases 4–5).

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
| Security | Helmet, CORS, rate limiting, JWT (access + rotating refresh) |

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

## Frontend (Phase 6)

The Next.js app (`frontend/`) provides the application shell and complete authentication flow:

- **`/login`** — sign-in form with client-side validation (Zod), inline field errors, a submission spinner, and typed server-error messages (`AUTH_INVALID_CREDENTIALS`, `AUTH_USER_DISABLED`, `RATE_LIMITED`, ...) including the backend `requestId` for support. Accepts `?redirect=` to return to the original destination after sign-in.
- **`/dashboard`** — protected route. The dashboard layout guards access client-side (the refresh cookie is httpOnly on the API origin, so sessions hydrate in the browser): while the session is loading it shows a skeleton shell, and unauthenticated visitors are redirected to `/login?redirect=/dashboard`. The shell includes the brand, navigation (RBAC screens are marked "coming soon"), role badges, and a sign-out action.
- **`/`** — landing page that redirects to `/dashboard` when authenticated.

Auth architecture:

- `services/auth.service.ts` — typed login/refresh/logout/me calls.
- `lib/api/client.ts` — fetch wrapper over the backend envelope: attaches `Authorization: Bearer`, sends `credentials: "include"` for the refresh cookie, parses `{ success, data }` / `{ success, error }`, throws typed `ApiError` (status/code/details/requestId), and on `401` auth-token errors performs a **single-flight** refresh (`POST /auth/refresh` — concurrent 401s share one request) then retries the original call once.
- `lib/api/token-store.ts` — in-memory access-token store (the access token is never persisted); the auth provider subscribes to it so a failed refresh signs the session out automatically.
- `providers/auth-provider.tsx` + `hooks/use-session.ts` — `AuthProvider` with `user`, `status` (`loading | authenticated | unauthenticated`), `login`, and `logout`. On mount it hydrates via `GET /auth/me` and falls back to a refresh-token exchange if the access token is missing/expired.
- `types/` — `ApiSuccess`/`ApiFailure` envelope types and auth domain types (`User`, `AuthSession`, `AuthStatus`, `ApiError`).

Access tokens live only in memory (15-minute lifetime, refreshed transparently), so no sensitive material touches cookies or storage on the frontend.

## Frontend (Phase 7) — RBAC administration

The backend session now includes the user's effective permission codes (`SafeUser.permissions`), so the UI can gate itself client-side — strictly permission-based, never role-name checks. Authorization is centralized in `hooks/use-permission.ts`: `usePermission()` exposes `hasPermission`/`hasAnyPermission`/`hasAllPermissions` (flexible string keys, so newly created backend permissions like `inventory.view` work without code changes), and `usePermissionError()` maps backend 403s to a friendly message while refreshing the session so revoked permissions self-correct. `PermissionGuard` renders children only when the required permission (or `anyOf`/`allOf`) is granted, with a configurable `fallback` (default: the Access Denied screen). Navigation is filtered to the sections the current user may access, and any route lacking its permission renders the `/access-denied` page — login is only for unauthenticated users.

Screens (all under the `/admin` route group, all static, all data-driven):

- **`/admin/users`** (`rbac.users.*`) — paginated table with search, status filter, sorting, and column-aware empty/error/skeleton states; create/edit dialogs; suspend/activate and delete with confirmation; role assignment dialog (`POST /users/:id/roles`). No password hashes or refresh tokens ever reach the UI.
- **`/admin/roles`** (`rbac.roles.*`) — same list/CRUD treatment plus an active toggle; the super-administrator role is protected against disable/delete.
- **`/admin/roles/:id/permissions`** (`rbac.role-permissions.*`) — assign permissions to a role using a dynamic module → sub-module → operation → permission hierarchy (from `GET /modules/hierarchy`), each row toggled immediately (no save step) with toast feedback.
- **`/admin/modules`** (`rbac.modules.*`, `rbac.sub-modules.*`, `rbac.operations.*`) — three linked tabs: modules, their sub-modules, and operations, with full CRUD on each and module-context filtering.
- **`/admin/permissions`** (`rbac.permissions.*`) — permissions filtered by module, keyed to the operation that owns them; create/edit/activate/delete. Keys must match the shared slug pattern (e.g. `purchase-orders.view`) — underscores are rejected by both client and server.

Shared building blocks: `lib/query/query-client.ts` (a lightweight `useQuery` with cached refetch + invalidation), the permission layer (see Authorization below), typed services per feature, form dialogs with inline Zod validation, confirm dialogs, toast notifications, and skeleton/empty/error states on every list. If the backend rejects a call the UI believed was allowed (permission revoked mid-session), the request surfaces a friendly permission error and the session is re-fetched — the backend remains the final security authority.

Feature tests (Vitest + Testing Library) cover users, roles, permissions, authorization (`PermissionGuard`, `usePermission`, 403 handling, and admin shell navigation), and the dashboard; run with `npm test -w frontend`.

## Frontend (Phase 8) — Admin dashboard and system overview

`/dashboard` (available to every authenticated user, content permission-gated) replaces the static welcome screen with a live system overview, built entirely from existing APIs — no dashboard-specific backend. One `useDashboard` hook fires parallel calls for users, roles, permissions, and the module hierarchy (results cached under a user-scoped query key so one account never sees another's data), each section rendered only when its permission is held:

- **Stat cards** — total / active / suspended users (`rbac.users.view`), roles (`rbac.roles.view`), modules (`rbac.modules.view`), permissions (`rbac.permissions.view`).
- **RBAC structure** — module → sub-module → operation → permission flow with per-module counts from `GET /modules/hierarchy`.
- **Recent lists** — newest users, roles, and permissions with status badges and relative timestamps, linking to the admin screens.

Loading renders skeletons (never misleading zeros); failures show a friendly error card with Retry; users without any dashboard permission get a dedicated empty state. Layout is responsive (cards collapse on mobile, the RBAC flow becomes vertical).

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
npm test    # backend: auth + RBAC core tests (uses a separate accessorbit_test database)
npm test -w frontend   # frontend: feature + authorization tests (Vitest + Testing Library, jsdom)
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
