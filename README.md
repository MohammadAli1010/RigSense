# RigSense

RigSense is a custom PC building platform focused on part discovery, private build planning, public build showcases, benchmarks, guides, and community Q&A.

The current codebase includes a production-shaped app shell, credentials-based auth with role-aware admin access, Prisma-backed content and workflow models, protected account routes, public discovery pages, builder flows, community tools, and an internal admin CMS.

All roadmap milestones in `milestones.md` are implemented, including Milestone 9 production readiness work such as security hardening, Docker-based production testing, CI workflows, smoke coverage, health checks, error boundaries, and operational documentation.

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
- Production-readiness foundations including:
  - route protection, security headers, and basic rate limiting via Next.js proxy
  - Dockerized production-style app and Postgres stack
  - CI verification and smoke-test GitHub workflows
  - `/api/health` health check endpoint
  - global and route-level error boundaries
  - operations and backup/recovery documentation
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
- final visual polish, branding, animation, and design refinement

## Local Setup

### Prerequisites

- Node.js 20+
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
docker compose up -d postgres
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

## How To Test Locally

### Quick functional test in dev mode

Use this flow when you want the fastest feedback while working on UI or product behavior.

1. Start Postgres:

```bash
docker compose up -d postgres
```

2. Ensure schema and demo data are loaded:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

3. Start the app:

```bash
npm run dev
```

4. Open `http://localhost:3000` and verify these public flows:

- `/`
- `/parts`
- `/guides`
- `/benchmarks`
- `/forum`
- `/trending`

5. Log in with the seeded account and verify these private flows:

```text
demo@rigsense.dev
rigsense123
```

- `/login`
- `/profile`
- `/builder`
- `/builds`

6. In the builder, verify the main workflow end to end:

- add parts to a build
- review compatibility output
- save the build
- mark it complete if applicable
- publish or unpublish it
- open the resulting public build page

7. Verify supporting product flows:

- open `/compare`
- open a guide and benchmark page
- create a forum question or answer if you want to exercise the community flow
- visit `/api/health` and confirm it returns JSON with `status: "ok"`

### Production-style test with Docker

Use this flow when you want to test the app closer to deployment conditions.

1. Build and start the full stack:

```bash
docker compose up -d --build
```

2. Open `http://localhost:3000`.

3. Confirm the app responds and the health check works:

```bash
curl http://localhost:3000/api/health
```

4. If you need fresh data inside the Docker-backed database, run local seed/migration commands against the same database connection, then restart the web container if needed:

```bash
npm run db:migrate
npm run db:seed
docker compose restart web
```

5. Inspect logs if something fails:

```bash
docker compose logs -f web
docker compose logs -f postgres
```

### Validation commands

Run the same release gates used by Milestone 9:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

### What to verify before calling it healthy

- the app loads without server errors
- `/api/health` returns HTTP 200
- login works with the seeded account
- protected routes redirect correctly when logged out
- admin pages are blocked for non-admin users
- builder save and publish flows work
- compare, benchmarks, guides, forum, and public build pages render successfully
- `lint`, `test`, `typecheck`, and `build` all pass

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
- Production health is exposed through `/api/health`.
- Production-style local verification is available through `docker compose up -d --build`.

## Next Focus

1. Visual polish, branding, motion, and final design refinement.
2. Real-time part pricing providers beyond manual/admin-managed offers.
3. Smarter recommendation and upgrade-planning flows.
4. Richer benchmark comparison and ingestion workflows.
5. Broader community depth and notification systems.
