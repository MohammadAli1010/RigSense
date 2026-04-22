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

## Remaining Items for Future Action
- Unify the duplicate Pricing Services (Issue #5). This requires structural changes to the background jobs and DB schema integration.
- Remove deprecated shadowDatabaseUrl in Prisma and dead Autosave code in the Builder.
- ESLint checks and strict typing on `public-content.ts` (the `any` types).
