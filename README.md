# AccessOrbit

**Enterprise Access Control and Management Platform** with a fully dynamic, runtime-resolved Role-Based Access Control (RBAC) system.

New modules, sub-modules, operations, permissions, roles, and role assignments are managed completely as data through the application — zero code changes or redeployments required.

---

## Key Features

- **Dynamic Permission Resolution**: Permissions are evaluated directly from MongoDB on every request via `requireAuth` + `requirePermission("key")`. Modifying a role, assigning a permission, or toggling status takes effect immediately.
- **4-Tier Hierarchical RBAC Structure**: `Module` → `Sub-Module` → `Operation` → `Permission` architecture.
- **Full Administration Suite**: Interactive data tables with sorting, pagination, search, and dynamic assignment modals for Users, Roles, Role Permissions, Modules, Sub-Modules, Operations, and Permissions.
- **Global Instant Search (`Cmd/Ctrl + K`)**: High-performance unified search across users, roles, modules, sub-modules, operations, permissions, and audit logs respecting user permissions.
- **Comprehensive Audit Trail**: Immutable logging capturing actor identity, action type, IP address, user agent, timestamps, and status with JSON inspection modals and sanitization of sensitive credentials.
- **Interactive OpenAPI 3.0 Documentation**: Fully tagged Swagger UI with custom dark mode theme, live search filter, and persistent Bearer token authorization.
- **Enterprise Security**: Rotating HttpOnly refresh cookies, 15-minute in-memory JWT access tokens, token reuse detection, rate limiting, and Helmet security headers.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Sonner |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Zod, Pino Logger |
| **Database** | MongoDB (Mongoose ODM) |
| **Security & Auth** | JWT (`jsonwebtoken`), `bcrypt`, `helmet`, `cors`, `express-rate-limit` |
| **API Documentation** | OpenAPI 3.0.3, Swagger UI (`swagger-ui-express`) |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom |

---

## Project Structure

```
AccessOrbit/
├── frontend/                  # Next.js 15+ App Router frontend
│   └── src/
│       ├── app/               # Routes, layouts, error/loading/not-found boundaries
│       │   ├── (admin)/       # RBAC & Audit admin routes (/users, /roles, /modules, etc.)
│       │   ├── (auth)/        # Auth routes (/login)
│       │   ├── dashboard/     # System overview dashboard
│       │   ├── icon.svg       # Brand favicon
│       │   └── layout.tsx     # Root layout & providers
│       ├── features/          # Feature slices (auth, users, roles, permissions, audit-logs)
│       ├── components/        # Shared UI components & shadcn primitives
│       ├── hooks/             # Custom React hooks (usePermission, useSession, etc.)
│       ├── services/          # Typed API clients
│       ├── providers/         # ThemeProvider, TooltipProvider, etc.
│       └── lib/               # Utilities & fetch client wrapper
├── backend/                   # Express TypeScript modular monolith API
│   └── src/
│       ├── modules/           # Feature modules (auth, users, roles, modules, permissions, audit, search, docs)
│       ├── shared/            # Shared middleware, validators, errors, logger, constants
│       ├── config/            # Zod-validated environment variables
│       ├── database/          # Mongoose models, connection, and seeders
│       ├── app.ts             # Express application configuration
│       └── server.ts          # Server entry point & graceful shutdown
└── docs/                      # Architecture documentation & diagrams
```

---

## Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **MongoDB** (Local instance or MongoDB Atlas cluster)

---

## Environment Setup

### 1. Backend Setup

Copy the example configuration file:

```bash
cp backend/.env.example backend/.env
```

Key environment variables:

| Variable | Default / Description |
|---|---|
| `NODE_ENV` | `development` / `production` / `test` |
| `PORT` | `4000` — Backend API listening port |
| `MONGODB_URI` | `mongodb://localhost:27017/accessorbit` |
| `FRONTEND_URL` | `http://localhost:3000` (CORS origin whitelist) |
| `JWT_ACCESS_SECRET` | Secret string for signing 15-min access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret string for refresh token handling (min 32 chars) |
| `SEED_ADMIN_EMAIL` | `admin@accessorbit.local` — Seeded super administrator email |
| `SEED_ADMIN_PASSWORD` | `AccessOrbitAdmin2026!` — Seeded super administrator password |
| `SEED_DEMO_EMAIL` | `demo@accessorbit.local` — Seeded demo user email |
| `SEED_DEMO_PASSWORD` | `DemoUserAccess2026!` — Seeded password for demo role accounts |

### 2. Frontend Setup

Copy the frontend configuration file:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Default / Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` — Backend base URL |

---

## Database Seeding

Seed the default RBAC hierarchy, default roles, and administrator credentials:

```bash
npm run seed
```

This creates:
- **Core RBAC Hierarchy**: Modules (`rbac`, `employee`, `attendance`, `procurement`), sub-modules, operations, and fine-grained permissions.
- **Default Roles**: `Super Administrator`, `HR Manager`, `Department Manager`, `Team Lead`, `Employee`, `Auditor`.
- **Default Super Admin**: `admin@accessorbit.local` / `AccessOrbitAdmin2026!`
- **Demo Accounts** (Password: `DemoUserAccess2026!`):
  - `demo@accessorbit.local` (HR Manager)
  - `hr@accessorbit.local` (HR Manager)
  - `manager@accessorbit.local` (Department Manager)
  - `lead@accessorbit.local` (Team Lead)
  - `employee@accessorbit.local` (Employee)
  - `auditor@accessorbit.local` (Auditor)

---

## Running the Application

### Development Mode

Start both the backend and frontend concurrently:

```bash
# Terminal 1: Backend (http://localhost:4000)
npm run dev:backend

# Terminal 2: Frontend (http://localhost:3000)
npm run dev:frontend
```

### Access URLs:
- **Web App**: `http://localhost:3000`
- **API Base**: `http://localhost:4000/api/v1`
- **Swagger Documentation**: `http://localhost:4000/api/v1/docs/`
- **OpenAPI JSON Spec**: `http://localhost:4000/api/v1/docs/json`
- **Health Check**: `http://localhost:4000/api/v1/health`

---

## API Reference Overview

All administrative API endpoints are prefixed with `/api/v1` and protected by `requireAuth` + granular permission codes:

| Tag | Endpoint | Method | Permission Required | Description |
|---|---|:---:|---|---|
| **Health** | `/health` | `GET` | *Public* | System health & MongoDB connection state |
| **Authentication** | `/auth/login` | `POST` | *Public* | Authenticate user & issue JWT tokens |
| | `/auth/refresh` | `POST` | *Public* | Rotate refresh cookie & issue access token |
| | `/auth/logout` | `POST` | `Bearer` | Revoke session & clear HttpOnly cookie |
| | `/auth/me` | `GET` | `Bearer` | Get authenticated user profile & permissions |
| **Users** | `/users` | `GET` | `rbac.users.view` | List users with pagination, filter, & search |
| | `/users` | `POST` | `rbac.users.create` | Create a user account |
| | `/users/:id` | `GET` | `rbac.users.view` | Get user by ID |
| | `/users/:id` | `PATCH` | `rbac.users.update` | Update user details / toggle active status |
| | `/users/:id` | `DELETE` | `rbac.users.delete` | Delete user account |
| | `/users/:id/roles` | `POST` | `rbac.users.assign-roles` | Replace user role assignments |
| **Roles** | `/roles` | `GET` | `rbac.roles.view` | List roles with assigned permission keys |
| | `/roles` | `POST` | `rbac.roles.create` | Create custom role |
| | `/roles/:id` | `GET` | `rbac.roles.view` | Get role by ID |
| | `/roles/:id` | `PATCH` | `rbac.roles.update` | Update role name / description / active state |
| | `/roles/:id` | `DELETE` | `rbac.roles.delete` | Delete custom role (system roles protected) |
| **Role Permissions** | `/roles/:id/permissions` | `GET` | `rbac.role-permissions.view` | List permissions bound to a role |
| | `/roles/:id/permissions` | `POST` | `rbac.role-permissions.assign` | Assign permission key to role |
| | `/roles/:id/permissions/:permissionId` | `DELETE` | `rbac.role-permissions.remove` | Remove permission from role |
| **Modules** | `/modules` | `GET` | `rbac.modules.view` | List top-level domain modules |
| | `/modules/hierarchy` | `GET` | `rbac.modules.view` | Get complete 4-tier RBAC tree hierarchy |
| | `/modules` | `POST` | `rbac.modules.create` | Create new top-level module |
| | `/modules/:id` | `GET` | `rbac.modules.view` | Get module by ID |
| | `/modules/:id` | `PATCH` | `rbac.modules.update` | Update module metadata |
| | `/modules/:id` | `DELETE` | `rbac.modules.delete` | Delete module (if not in use) |
| **Sub-Modules** | `/sub-modules` | `GET` | `rbac.sub-modules.view` | List sub-modules with module filter |
| | `/sub-modules` | `POST` | `rbac.sub-modules.create` | Create new sub-module |
| | `/sub-modules/:id` | `PATCH` | `rbac.sub-modules.update` | Update sub-module |
| | `/sub-modules/:id` | `DELETE` | `rbac.sub-modules.delete` | Delete sub-module |
| **Operations** | `/operations` | `GET` | `rbac.operations.view` | List operations |
| | `/operations` | `POST` | `rbac.operations.create` | Create functional operation |
| | `/operations/:id` | `PATCH` | `rbac.operations.update` | Update operation |
| | `/operations/:id` | `DELETE` | `rbac.operations.delete` | Delete operation |
| **Permissions** | `/permissions` | `GET` | `rbac.permissions.view` | List permission codes |
| | `/permissions` | `POST` | `rbac.permissions.create` | Create atomic permission code |
| | `/permissions/:id` | `PATCH` | `rbac.permissions.update` | Update permission or toggle active state |
| | `/permissions/:id` | `DELETE` | `rbac.permissions.delete` | Delete permission |
| **Audit Logs** | `/audit-logs` | `GET` | `audit.view` | Query compliance audit event trail |
| **Search** | `/search` | `GET` | `Bearer` | Global cross-entity search (`?q=...`) |

---

## Testing & Quality Assurance

AccessOrbit includes automated unit and integration tests across both the backend and frontend:

```bash
# Run all backend tests (17 test suites, 170+ assertions)
npm test

# Run all frontend tests (9 test suites, 59+ assertions)
npm test -w frontend

# Run TypeScript typechecks across both packages
npm run typecheck

# Run linter
npm run lint
```

---

## Production Build

```bash
# Build both backend and frontend bundles
npm run build
```

---

## License

Private and proprietary. Designed and maintained for enterprise access control governance.
