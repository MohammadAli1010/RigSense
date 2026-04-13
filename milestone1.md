# Milestone 1 - Foundation Hardening Execution Checklist

This file breaks Milestone 1 into the exact order of work from the current codebase state.

Goal:
- Make the existing app safe to extend before live pricing, recommendations, compare flows, community depth, and admin tooling are added.

Out of scope:
- Visual polish
- New end-user feature breadth outside foundation work
- Pricing/recommendation implementation details from later milestones

Current repo observations:
- Core business logic is already present, but several server actions still mix validation, Prisma access, redirects, and domain rules in one file
- Raw environment access exists in `src/lib/db.ts` and `src/lib/public-content.ts`
- Automated tests currently cover shared library logic, not the critical action flows
- There is no CI workflow in `.github/workflows/` yet
- There is no dedicated background job foundation, logger abstraction, analytics abstraction, or error-reporting abstraction yet

Known files involved from the start:
- Auth: `src/auth.ts`, `src/actions/auth.ts`, `src/lib/session.ts`, `src/lib/validators.ts`
- Builder: `src/actions/builds.ts`, `src/lib/build-editor.ts`, `src/lib/compatibility.ts`
- Forum: `src/actions/forum.ts`
- Public content and DB: `src/lib/public-content.ts`, `src/lib/db.ts`
- Infra: `package.json`, `vitest.config.ts`, `.env.example`

Implementation rule:
- Before making any Next.js 16 structural change, check the relevant docs in `node_modules/next/dist/docs/`.

## Phase 1 - Audit And Decision Log

Objective:
- Map the current architecture and lock in the target boundaries before refactoring.

Checklist:
- [ ] Inventory every Prisma touchpoint in auth, builder, forum, and public-content flows
- [ ] Inventory every place that reads `process.env` directly
- [ ] Inventory every redirect-heavy server action and mark which parts are transport logic versus business logic
- [ ] Identify which shared rules already belong in reusable services (`compatibility`, build persistence, auth lookup, forum mutations)
- [ ] Record the target module split for each domain:
  - auth service
  - build service
  - forum service
  - public content/query service
  - infrastructure utilities (env, logging, analytics, errors, jobs)
- [ ] Write down refactor constraints so behavior does not change during extraction

Deliverables:
- A short architecture note in the repo or in an internal planning file
- A file-level map of which modules will stay action-only, service-only, or data-access-only

Verification:
- Every critical flow has an owner module before extraction begins

## Phase 2 - Runtime Configuration And Env Safety

Objective:
- Replace ad hoc env usage with validated runtime configuration.

Checklist:
- [ ] Add a dedicated env module such as `src/lib/env.ts` using `zod`
- [ ] Validate required variables from `.env.example` (`AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SHADOW_DATABASE_URL`)
- [ ] Decide which vars are required in all environments versus local/dev-only
- [ ] Replace direct `process.env` reads in `src/lib/db.ts` with the env module
- [ ] Replace direct `process.env` reads in `src/lib/public-content.ts` with the env module
- [ ] Ensure startup fails fast when critical env values are missing or malformed
- [ ] Keep error messages explicit enough that local setup failures are easy to fix
- [ ] Update `.env.example` if any new Milestone 1 infra vars are introduced

Deliverables:
- Centralized validated env access
- No critical runtime dependency reading raw env values directly in feature code

Verification:
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] App fails early with a clear error if a required env var is removed

## Phase 3 - Extract Domain Services And Data Boundaries

Objective:
- Make actions thin and move reusable product logic into stable modules.

Checklist:
- [ ] Create a service layer directory or equivalent structure for reusable domain logic
- [ ] Extract auth user lookup and registration persistence from `src/actions/auth.ts`
- [ ] Extract build persistence, ownership checks, and status transitions from `src/actions/builds.ts`
- [ ] Extract forum question creation, answer creation, vote handling, and solved-answer updates from `src/actions/forum.ts`
- [ ] Keep redirects and form parsing in actions only where possible
- [ ] Keep Prisma access inside service/data modules instead of scattering it across actions
- [ ] Standardize return shapes for service methods so actions can consistently redirect or return field errors
- [ ] Preserve existing behavior while moving logic; do not change product rules in this milestone unless required for correctness

Deliverables:
- Thin server actions
- Reusable service modules for auth, builder, and forum flows
- Clear separation between validation, domain logic, data access, and redirect logic

Verification:
- [ ] `src/actions/auth.ts` primarily orchestrates validation plus redirects
- [ ] `src/actions/builds.ts` no longer owns the full persistence workflow directly
- [ ] `src/actions/forum.ts` no longer owns the full mutation workflow directly

## Phase 4 - Test Baseline For Critical Flows

Objective:
- Move from library-only tests to coverage of the flows that can break the product.

Current baseline:
- Existing tests are limited to `src/lib/public-content.test.ts`, `src/lib/build-editor.test.ts`, and `src/lib/compatibility.test.ts`

Checklist:
- [ ] Decide the Milestone 1 testing approach: service-level tests with mocks first, then integration tests where useful
- [ ] Add shared Vitest test utilities for mocking Prisma, auth/session, redirects, and cache revalidation helpers
- [ ] Add tests for auth registration success, duplicate email rejection, and invalid login handling
- [ ] Add tests for build save flow, build completion blocking, ownership checks, and visibility toggling
- [ ] Add tests for forum question creation, answer creation, vote toggling, and solved-answer authorization
- [ ] Add tests for session guard helpers if behavior is moved or expanded
- [ ] Keep the existing lib tests passing during refactors
- [ ] Make sure test names match user-facing behaviors, not just function internals

Deliverables:
- Coverage for the current critical baseline flows
- Shared test helpers that later milestones can reuse

Verification:
- [ ] `npm run test`
- [ ] Critical auth/build/forum flows are covered by automated tests

## Phase 5 - Background Job Foundation

Objective:
- Create the minimum job infrastructure needed before pricing refresh and benchmark ingestion arrive.

Recommended default:
- Start with an app-owned job foundation inside the repo rather than introducing external queue infrastructure immediately.

Checklist:
- [ ] Define the job model needed for Milestone 1 foundation work (job name, payload, status, attempts, timestamps, last error)
- [ ] Decide whether the initial version uses a database-backed job table, scheduled runner, or a simpler cron-triggered worker contract
- [ ] Create a small job runner abstraction with typed handlers
- [ ] Add one manual execution path for local development and admin-triggered tasks later
- [ ] Add basic retry and failure recording behavior
- [ ] Add logging hooks for job start, success, failure, and duration
- [ ] Document how future jobs such as pricing refresh and benchmark sync will plug into the system

Deliverables:
- A real background-job foundation, even if only one placeholder job exists initially
- A documented path for scheduled and manual execution

Verification:
- [ ] A sample job can be queued or invoked and produce inspectable logs/results
- [ ] Failure state is visible and retryable

## Phase 6 - Logging, Analytics, And Error Reporting Interfaces

Objective:
- Introduce observability contracts before the app grows more complex.

Checklist:
- [ ] Add a logger utility with consistent structured methods (`info`, `warn`, `error`)
- [ ] Add an analytics interface with a no-op or console-backed default implementation
- [ ] Add an error-reporting interface with a no-op provider first if no external service is chosen yet
- [ ] Instrument auth, builder, forum, and background-job flows at the service boundary
- [ ] Capture enough context to debug failures without leaking secrets or raw passwords
- [ ] Define event naming conventions so later product analytics stay consistent
- [ ] Document where infrastructure logging ends and product analytics begins

Deliverables:
- Shared observability interfaces
- Initial instrumentation on the highest-risk mutation flows

Verification:
- [ ] Mutations and jobs emit structured logs
- [ ] Analytics/event calls are centralized and replaceable
- [ ] Error reporting calls can be enabled later without rewriting business logic

## Phase 7 - CI And Quality Gates

Objective:
- Turn local quality checks into enforceable repo rules.

Checklist:
- [ ] Add a CI workflow under `.github/workflows/`
- [ ] Run dependency install, Prisma client generation, lint, typecheck, tests, and production build in CI
- [ ] Cache dependencies where practical to keep runs reasonable
- [ ] Ensure the workflow handles the current Prisma/Next/Vitest setup correctly
- [ ] Decide whether CI should use a real Postgres service for any integration coverage added in this milestone
- [ ] Fail the pipeline on any lint, type, test, or build regression
- [ ] Document the expected pre-merge command sequence for local development

Deliverables:
- A working CI pipeline that protects the codebase

Verification:
- [ ] CI passes on the current default branch state after Milestone 1 changes land
- [ ] Local and CI command expectations match

## Phase 8 - Milestone 1 Cleanup And Exit Check

Objective:
- Close the milestone cleanly and confirm the repo is ready for Milestone 2.

Checklist:
- [ ] Remove temporary refactor scaffolding that is no longer needed
- [ ] Update `README.md` where setup, architecture, or command expectations changed
- [ ] Confirm every extracted service is used by the existing UI without behavior regressions
- [ ] Confirm tests, typecheck, lint, and build pass from a clean install
- [ ] Re-read `milestones.md` and ensure Milestone 1 exit criteria are now true
- [ ] Write down follow-up items that belong to Milestone 2 instead of sneaking them into Milestone 1

Exit criteria:
- [ ] Core flows have automated coverage and pass in CI
- [ ] Runtime configuration fails fast when env values are missing or invalid
- [ ] Background work can be scheduled without ad hoc scripts
- [ ] Shared product logic is not trapped inside page components or oversized actions

## Recommended File Targets

Likely files to add:
- `src/lib/env.ts`
- `src/lib/logger.ts`
- `src/lib/analytics.ts`
- `src/lib/error-reporting.ts`
- `src/lib/jobs/*`
- `src/services/auth/*`
- `src/services/builds/*`
- `src/services/forum/*`
- test helpers under `src/test/*` or a similar location
- `.github/workflows/ci.yml`

Likely files to modify:
- `src/auth.ts`
- `src/actions/auth.ts`
- `src/actions/builds.ts`
- `src/actions/forum.ts`
- `src/lib/db.ts`
- `src/lib/public-content.ts`
- `vitest.config.ts`
- `README.md`
- `.env.example`

## Suggested Execution Order

Do the milestone in this order:
1. Phase 1 audit and module-boundary decisions
2. Phase 2 env safety
3. Phase 3 service extraction
4. Phase 4 tests for critical flows
5. Phase 5 job foundation
6. Phase 6 logging, analytics, and error reporting
7. Phase 7 CI
8. Phase 8 cleanup and exit validation

## Done Means Done

Milestone 1 is complete only when the following command set is reliable:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

And when the repo has:
- validated env access
- thin actions and reusable services
- coverage for critical baseline flows
- a job foundation
- basic observability contracts
- a working CI pipeline
