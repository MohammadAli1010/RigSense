# RigSense

RigSense is a custom PC building platform focused on part discovery, private build planning, public build showcases, benchmarks, guides, and community Q&A.

The current codebase includes a production-shaped app shell, credentials-based auth with role-aware admin access, Prisma-backed content and workflow models, protected account routes, public discovery pages, builder flows, community tools, and an internal admin CMS.

Milestones 1-8 are implemented in the codebase. The current app includes the core product plus admin CMS, moderation, and operational tooling, with Milestone 9 focused on final production hardening and launch readiness.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Auth.js (`next-auth` v5 beta)
- Prisma ORM
- PostgreSQL
- Zod
- bcryptjs

## Current Status

Implemented now:

- Dark-first app shell with shared navigation and footer
- Register, login, logout, protected profile flow, and role-aware admin access
- Prisma schema for users, roles, parts, offers, builds, guides, benchmarks, forum, subscriptions, reports, background jobs, featured modules, operational settings, and audit logs
- Prisma migration and seed support for local development
- Interactive PC builder with compatibility analysis, clone/fork flows, and database-backed save/publish lifecycle
- Database-backed saved builds, completion, publish/unpublish flow, and visibility toggles
- Deterministic recommendation engine scoring parts by compatibility, value, and budget
- A dedicated side-by-side benchmark `/compare` view with inline benchmark metrics in the builder
- Database-backed forum questions, answers, nested replies, voting, solved answers, subscriptions, reporting, and moderation states
- Public user profile pages and public build detail pages
- Admin CMS for:
  - parts and manual catalog correction
  - retailer offers and fallback pricing entries
  - guides with draft/publish workflow
  - benchmarks with revision history
  - forum taxonomy
  - featured modules
  - operational settings
- Moderation and operations tooling for:
  - report queue review and enforcement
  - background job monitoring and retry flows
  - audit log review
  - user role management
- Public pages for:
  - parts catalog
  - part category pages
  - part detail pages
  - guides and guide detail pages
  - benchmarks
  - trending builds
  - forum categories and question detail pages
  - public build detail pages
  - public user profile pages

Still intentionally deferred from v1:

- external pricing providers beyond the current internal/manual offer workflow
- more advanced recommendation inputs and upgrade-planning logic
- deeper benchmark ingestion automation and richer compare UX
- end-to-end smoke coverage and deployment/rollback operations for final launch
- broader production hardening work from Milestone 9

## Local Setup

### Prerequisites

- Node.js 22+
- npm
- Docker Desktop or another Docker runtime

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Copy the example env file:

```bash
cp .env.example .env
cp .env.example .env.local
```

Use a long random value for `AUTH_SECRET`, and keep `.env` / `.env.local` untracked local files only. Do not force-add them to git.

Default local database connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rigsense"
DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rigsense"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rigsense_shadow"
```

Docker-based local development uses Postgres on `localhost:5432`. Older Prisma dev URLs like `localhost:51214` or `localhost:51215` should be removed from `.env` and `.env.local` when switching back to Docker.

### 3. Start PostgreSQL

Option A: Docker-based Postgres

```bash
docker compose up -d
```

If you run the app from WSL, enable Docker Desktop WSL integration for this distro so `localhost:5432` is reachable from the workspace shell.

Option B: Prisma local Postgres server

```bash
npx prisma dev -d -n rigsense
```

If you use Prisma local Postgres, update `.env` and `.env.local` from the connection details shown by:

```bash
npx prisma dev ls
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Apply migrations

```bash
npm run db:migrate
```

If you are syncing a fresh local database against the latest admin/CMS schema changes, `npx prisma db push` is also acceptable for local-only setup.

### 6. Start the app

```bash
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Demo login after seeding:

```text
demo@rigsense.dev
rigsense123
```

## Scripts

- `npm run dev` - start the Next.js dev server
- `npm run build` - build the app for production
- `npm run start` - start the production build
- `npm run lint` - run ESLint
- `npm run test` - run unit tests
- `npm run test:watch` - run unit tests in watch mode
- `npm run typecheck` - run TypeScript checks
- `npm run jobs:run -- foundation.health-check` - enqueue and run the foundation health-check job
- `npm run db:generate` - generate Prisma client
- `npm run db:migrate` - run Prisma migrations locally
- `npm run db:seed` - run the Prisma seed script
- `npm run db:studio` - open Prisma Studio

## Route Overview

Public routes:

- `/`
- `/parts`
- `/parts/[category]`
- `/parts/[category]/[slug]`
- `/guides`
- `/guides/[slug]`
- `/benchmarks`
- `/trending`
- `/forum`
- `/forum/[category]`
- `/forum/questions/[questionId]`
- `/builds/[id]`
- `/login`
- `/register`

Protected routes:

- `/profile`
- `/builder`
- `/builds`

Admin routes:

- `/admin/parts`
- `/admin/offers`
- `/admin/guides`
- `/admin/benchmarks`
- `/admin/categories`
- `/admin/featured-modules`
- `/admin/settings`
- `/admin/users`
- `/admin/moderation`
- `/admin/jobs`
- `/admin/audit`

## Project Structure

```text
src/
  actions/
  app/
  components/
  data/
  lib/
  types/
prisma/
  schema.prisma
  seed.ts
compose.yaml
```

## Notes

- Builds are private by default in the product design.
- Guides and forum pages are intentionally public, but unpublished guides are only visible through the admin CMS.
- Forum question detail uses `/forum/questions/[questionId]` to avoid a route collision with `/forum/[category]`.
- Public discovery pages prefer Prisma-backed content and fall back to `src/data/mock-data.ts` when the database is unavailable.
- Core mutation logic now lives in `src/services/` so server actions stay thin and reusable.
- Runtime env validation lives in `src/lib/env.ts` and is loaded by server-side infra modules.
- Background jobs use the `BackgroundJob` Prisma model and the registry/service under `src/lib/jobs/`.
- High-impact admin and moderation actions are recorded in the `AuditLog` model and surfaced through `/admin/audit`.
- Next.js 16 in this repo manages the JSX compiler setting during `next build`; keep `tsconfig.json` aligned with framework-managed output.

## Next Focus

1. Milestone 9 production hardening: security review, smoke coverage, CI/CD, observability, and backup/recovery.
2. Real-time part pricing providers beyond manual/admin-managed offers.
3. Smarter recommendation and upgrade-planning flows.
4. Richer benchmark comparison and ingestion workflows.
5. Broader community depth and notification systems.
