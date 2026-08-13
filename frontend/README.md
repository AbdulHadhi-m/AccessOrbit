# AccessOrbit — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui frontend for AccessOrbit.

See the [root README](../README.md) for setup, development, and deployment instructions.

## Structure

```
src/
├── app/          # Routes, layouts, error/loading boundaries
├── features/     # Business features (added in later phases)
├── components/   # Shared UI components (ui/ = shadcn primitives)
├── hooks/        # Shared hooks
├── services/     # API clients
├── providers/    # App providers (theme, and later auth/query)
├── lib/          # Utilities
├── types/        # Shared types
└── config/       # Environment configuration
```
