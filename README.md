# AccessOrbit

**Enterprise Access Control and Management Platform** with a fully dynamic Role-Based Access Control (RBAC) system.

New modules, sub-modules, operations, permissions, roles, and role assignments are managed as data through the application — no authorization code changes required.

> **Status: Phase 2 (Database & RBAC Core)** — project skeleton, backend infrastructure, and the full dynamic RBAC data layer (models, repositories, services, permission resolution, idempotent seed) are implemented. Authentication and RBAC administration APIs arrive in later phases.

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
   | `JWT_ACCESS_SECRET` | ≥ 32 chars (used in later auth phase) |
   | `JWT_REFRESH_SECRET` | ≥ 32 chars, different from access (later phase) |
   | `LOG_LEVEL` | `info` default |
   | `SEED_ADMIN_EMAIL` | Optional — email for the seeded super administrator |
   | `SEED_ADMIN_PASSWORD` | Optional — password for the seeded super administrator (min 8 chars) |

2. **Frontend** — optional; defaults to `http://localhost:4000`:

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

## Seeding the Database

Creates the RBAC hierarchy (modules, sub-modules, operations, permissions), the six system roles, role-permission assignments, and the super administrator user. Safe to run repeatedly:

```bash
npm run seed
```

## Tests

```bash
npm test    # RBAC core tests (uses a separate accessorbit_test database)
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

## Deployment (planned)

- Frontend → Vercel
- API → Render
- MongoDB → MongoDB Atlas

Details will be documented in the README once deployment is implemented.
