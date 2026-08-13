# AccessOrbit — Frontend

Modern Next.js 15+ (App Router) enterprise user interface for AccessOrbit with dynamic RBAC gating, high-performance data tables, audit log inspection, and global search.

Refer to the [Root README](../README.md) for full project setup, database seeding, and architectural documentation.

---

## Directory Structure

```
src/
├── app/               # Next.js App Router routes & layouts
│   ├── (admin)/       # RBAC & Audit admin routes (/users, /roles, /modules, etc.)
│   ├── (auth)/        # Auth routes (/login)
│   ├── dashboard/     # System overview dashboard
│   ├── icon.svg       # Brand favicon
│   └── layout.tsx     # Root layout & providers
├── features/          # Isolated feature slices
│   ├── audit-logs/    # Audit trail table & detail modal
│   ├── auth/          # Login form & authentication flows
│   ├── dashboard/     # Stats grid & RBAC hierarchy tree
│   ├── modules/       # Modules, sub-modules, and operations management
│   ├── permissions/   # Fine-grained permission codes
│   ├── roles/         # Role management & permission matrix
│   └── users/         # User directory & role assignment dialog
├── components/        # Shared UI components & shadcn primitives
│   ├── layout/        # App shell, sidebar navigation, headers
│   └── ui/            # Buttons, dialogs, dropdowns, tables, search modal
├── hooks/             # Custom hooks (usePermission, useSession, usePermissionError)
├── providers/         # ThemeProvider, TooltipProvider, etc.
├── services/          # Typed API clients
├── types/             # Shared TypeScript types & API envelopes
└── lib/               # Utilities & fetch client wrapper
```

---

## Running Frontend Standalone

```bash
# Install dependencies (from repo root or workspace)
npm install

# Start Next.js dev server (http://localhost:3000)
npm run dev -w frontend

# Run frontend test suite (Vitest + Testing Library)
npm test -w frontend

# Typecheck
npm run typecheck -w frontend
```
