# RigSense

RigSense is a custom PC building platform focused on part discovery, private build planning, public build showcases, benchmarks, guides, and community Q&A.

The current codebase includes the foundational app shell, credentials-based auth, Prisma schema, protected account routes, and seeded public pages for the catalog, guides, benchmarks, trending builds, and forum.

Milestone 1 foundation hardening is now in place with validated runtime env access, extracted auth/build/forum services, a background job foundation, and service-level tests for core mutation flows.

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
- Register, login, logout, and protected profile flow
- Prisma schema for users, parts, builds, guides, benchmarks, forum, and answer votes
- Prisma migration and seed support for local development
- Interactive PC builder with compatibility analysis
- Database-backed saved builds, completion, and publish/unpublish flow
- Database-backed forum questions, answers, voting, and solved answers
- Public pages for:
  - parts catalog
  - part category pages
  - part detail pages
  - guides and guide detail pages
  - benchmarks
  - trending builds
  - forum categories and question detail pages
  - public build detail pages

Still intentionally deferred from v1:

- external pricing APIs
- advanced recommendation engine
- richer threaded forum model
- admin CMS / moderation dashboards
- automated benchmark ingestion

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

Default local database connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rigsense"
```

### 3. Start PostgreSQL

Option A: Docker-based Postgres

```bash
docker compose up -d
```

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
- Guides and forum pages are intentionally public.
- Forum question detail uses `/forum/questions/[questionId]` to avoid a route collision with `/forum/[category]`.
- Public discovery pages prefer Prisma-backed content and fall back to `src/data/mock-data.ts` when the database is unavailable.
- Core mutation logic now lives in `src/services/` so server actions stay thin and reusable.
- Runtime env validation lives in `src/lib/env.ts` and is loaded by server-side infra modules.
- Background jobs use the `BackgroundJob` Prisma model and the registry/service under `src/lib/jobs/`.

## Phase 2 Ideas

1. Real-time part pricing and retailer integrations.
2. Smarter part/build recommendations.
3. Richer benchmark comparison UX.
4. Threaded forum discussions and moderation tooling.
5. Admin content management for guides, parts, and benchmarks.
