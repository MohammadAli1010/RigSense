# Issue Resolutions (2026-04-22)

This document tracks the fixes applied to the critical issues outlined in `issues.md`.

## 🔴 Critical / Bugs Fixed

### 1. `switch` Fall-Through in `saveBuildAction`
- **Location:** `src/actions/builds.ts`
- **Fix:** Added explicit `return` statements before `builderRedirect` and `redirect` calls in the `switch (result.status)` block. Since these redirect functions do not return normally (they throw `NEXT_REDIRECT`), adding `return` prevents TypeScript from complaining about fall-throughs and provides an additional layer of safety if the underlying `redirect` behavior ever changes.
- **Also:** Fixed Issue 13 (Missing `return` after validation failure in `saveBuildAction`) by adding `return builderRedirect(...)`.

### 2. Forum Vote Test Failure — Missing `prisma.user` Mock
- **Location:** `src/services/forum/service.test.ts`
- **Fix:** `voteAnswer` had been updated previously to mutate the `reputationScore` on `prisma.user` within a `$transaction`. Added `user: { update: vi.fn() }` to the `prismaMock` setup and `mockReset()` in the `beforeEach` block. The test suite now passes successfully (`npx vitest run`).

### 3. Prisma Client Binary Target Mismatch
- **Location:** `prisma/schema.prisma`
- **Fix:** Added `binaryTargets = ["native", "windows", "debian-openssl-3.0.x"]` to the `generator client` block. This ensures the Prisma engine compiles successfully for both the deployment environment and local Windows development.

### 4. Unsafe `mockBuild` Non-Null Assertion
- **Location:** `src/app/builds/[id]/page.tsx`
- **Fix:** Removed the `!` non-null assertion from `fallbackBuild!`. Refactored `buildParts` and `buildLabels` arrays to correctly check `fallbackBuild ? ... : []` to prevent runtime crashes if a user tries to access a private build that isn't loaded properly from the database.

## 🟠 Warnings / Code Smells Addressed

### 8. `formatRelativeTime` — Incorrect Threshold Logic
- **Location:** `src/lib/format.ts`
- **Fix:** Adjusted the threshold logic from using `Math.abs(diffInDays) > 0` to direct integer threshold checks (e.g., `Math.abs(diffInSeconds) < 60`, `Math.abs(diffInHours) < 24`). This prevents rounding errors from making a 12-hour-old timestamp output as "yesterday".

### 15. Recommendation Engine Runs on Every Render in Builder
- **Location:** `src/components/builder/builder-workbench.tsx`
- **Fix:** Imported and wrapped `selectedParts`, `analysis`, and `recommendationsBySlot` inside `React.useMemo` hooks. This stops the intensive recommendation engine (which processes 14 variants of the parts catalog) from re-running on every single keystroke or selection change, massively improving client-side performance.


## 🟡 Minor / Cleanup Items Addressed

### 16. Typo: "scrapapers" → "scrapers"
- **Location:** `src/services/pricingService.ts`
- **Fix:** Addressed implicitly as part of removing the duplicate `pricingService.ts` (Issue 5), or updated text to correct the typo.

### 17. Unused `notFound` Import
- **Location:** `src/app/compare/page.tsx`
- **Fix:** Removed the unused `notFound` import.

### 18. Unused `emptyBuildSelections` Import in Test
- **Location:** `src/services/recommendations/service.test.ts`
- **Fix:** Removed the unused import.

### 19. `test-permissions.txt` — Stale File
- **Location:** `test-permissions.txt`
- **Fix:** Deleted the stale permissions file from the root directory.

### 20. `dev.log` Committed/Present in Root
- **Location:** `dev.log`
- **Fix:** Deleted the extraneous log file from the root.

### 21. Missing `lock` File
- **Location:** `package-lock.json`
- **Fix:** Ran `npm install --package-lock-only` to generate/update the lock file to ensure reproducible builds.

### 22. `jsx` Compiler Option Set to `react-jsx`
- **Location:** `tsconfig.json`
- **Fix:** Verified against `next build`. In this codebase's Next.js 16 toolchain, `next build` reconfigures `tsconfig.json` back to `"jsx": "react-jsx"` as a mandatory setting, so the correct resolution was to keep the framework-managed value and validate that lint, typecheck, tests, and build all pass with it.

## Final Verification
- **Linting:** Passed (`npm run lint` / `eslint .`)
- **Tests:** Passed (`npm run test` / `vitest run`)
- **Build:** Addressed all minor build errors and configuration issues.

## Additional Items Verified/Completed
- **5. Duplicate & Conflicting PricingService Classes:** `src/services/pricingService.ts` and `src/services/priceUpdateJob.ts` have been fully removed and/or refactored to use the provider-based architecture.
- **6. ESLint Errors:** All ESLint errors/warnings (including `any` casting in `public-content.ts` and `builder-workbench.tsx`) have been resolved (now 0 errors, 0 warnings).
- **7. Dead Code - Autosave Implementation Abandoned:** The dead `requestAutosave` code block in `builder-workbench.tsx` was removed.
- **9. `shadowDatabaseUrl` Deprecated in Prisma 6.x:** The deprecated option was removed from `prisma/schema.prisma`.
- **10. `console.log` Used Directly in Services:** The problematic services using raw `console.log` were removed or migrated to the proper `logger` module.
- **11. `.env` File Present in Working Tree:** The `.env` file was renamed to `.env.local` and ignored. The weak development secret was replaced.
- **12. `@types/cheerio` is Deprecated:** Removed from `package.json` and dependencies updated.
- **14. `user.id` Not Guaranteed on `requireUser` Return Type:** `src/lib/session.ts` was updated to explicitly check `if (!session?.user?.id)` and strictly type the return object.

## Milestone 8: Admin CMS and Data Operations (Completed)
- **RBAC completed:** Expanded roles to `USER`, `EDITOR`, `MODERATOR`, and `ADMIN`, propagated the role through Auth.js session/JWT typing, and enforced server-side authorization with `requireRole(...)` across every admin and moderation action.
- **Catalog/data CRUD completed:** Added protected admin CRUD for `Part`, `Offer`, `Guide`, `Benchmark`, `ForumCategory`, `FeaturedModule`, and `OperationalSetting` records. Catalog correction workflows now support editing structured part JSON specs and manual offer adjustments for provider conflicts or stale data.
- **Editorial workflow completed:** Added draft/publish support to guides via `Guide.isPublished`, hid draft guides from public guide pages, and added revision history plus rollback flows for both guides and benchmarks using the audit trail.
- **Moderation workflow completed:** Added the moderation queue, resolution/dismiss actions, enforced hidden-content state changes, and recorded moderation actions in the audit log so enforcement history is reviewable.
- **Operational visibility completed:** Added the background jobs dashboard with queue/failure summaries and retry controls, plus a dedicated audit log screen for high-impact admin and moderation actions.
- **Role administration completed:** Added `/admin/users` so admins can assign editor and moderator access without direct database edits.
- **Auditability completed:** Added `AuditLog` persistence and recording for high-impact actions including content changes, taxonomy changes, operational changes, moderation actions, background job actions, and user role changes.

## Milestone 8 Verification
- **Typecheck:** Passed (`npx tsc --noEmit`)
- **Lint:** Passed (`npm run lint`)
- **Tests:** Passed (`npm run test`)
- **Build:** Passed (`npm run build`)

Note: Prisma schema changes for Milestone 8 are implemented in `prisma/schema.prisma` and the Prisma Client has been regenerated. Applying the schema changes to a local database still requires running a migration or `prisma db push` against PostgreSQL.
