# RigSense — Project Issues Log

> Audit performed on 2026-04-22. Covers code quality, bugs, lint/type errors, test failures, security, and architecture concerns.

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical / Bug | 5 |
| 🟠 Warning / Code Smell | 10 |
| 🟡 Minor / Cleanup | 7 |

---

## 🔴 Critical / Bugs

### 1. `switch` Fall-Through in `saveBuildAction` — Silent Case Leaking

**File:** `src/actions/builds.ts` (lines 62–82)

The `switch` on `result.status` has **no `break` statements** between cases. Although `builderRedirect()` and `redirect()` throw (via Next.js `redirect()` internally), this is a fragile pattern:

- If `result.status` is `"completion-blocked"`, execution calls `revalidatePath` 4 times, then `builderRedirect(...)`. If `builderRedirect` ever stops throwing for any reason, execution **falls through** into `"saved"/"completed"` and duplicates all `revalidatePath` calls.
- TypeScript won't warn because the function return type is `void`, not `never` from the callers' perspective.

```ts
// Current (dangerous):
case "invalid-part-selection":
  builderRedirect(buildId, "invalid-part-selection");
case "seed-parts-required":          // ← falls through if above doesn't throw
  builderRedirect(buildId, "seed-parts-required");
```

**Fix:** Add explicit `break` (or `return`) after each case, or refactor to `if/else if`.

---

### 2. Forum Vote Test Failure — Missing `prisma.user` Mock

**File:** `src/services/forum/service.test.ts` (line 127)  
**Service:** `src/services/forum/service.ts` (line 257)

The test `"toggles an existing vote off when the same vote is submitted again"` fails at runtime with:

```
TypeError: Cannot read properties of undefined (reading 'update')
```

The `prismaMock` in the test file does **not** mock `prisma.user`, but `voteAnswer()` calls `prisma.user.update(...)` inside a `$transaction` to adjust the author's reputation score. The mock setup needs:

```ts
prismaMock: {
  // ... existing mocks
  user: {
    update: vi.fn(),
  },
}
```

And the `$transaction` mock needs to execute the transaction array or resolve properly.

---

### 3. Prisma Client Binary Target Mismatch

**Test output** (unhandled rejection):

```
PrismaClientInitializationError: Prisma Client was generated for "debian-openssl-3.0.x",
but the actual deployment required "windows".
```

The `prisma/schema.prisma` generator block is missing `binaryTargets`:

```prisma
generator client {
  provider      = "prisma-client-js"
  // Missing: binaryTargets = ["native"]
}
```

This causes a runtime crash when the Prisma Client is instantiated on Windows. Running `prisma generate` after adding `binaryTargets = ["native"]` resolves it.

---

### 4. Unsafe `mockBuild` Non-Null Assertion in Build Detail Page

**File:** `src/app/builds/[id]/page.tsx` (line 96)

```ts
const mockBuild = fallbackBuild!;
```

When `dbBuild` is truthy, `fallbackBuild` is `null`. The `!` assertion is **incorrect** in that branch — `mockBuild` will be `null` despite the assertion. Later uses of `mockBuild` (lines 106, 112, 113) are guarded by `dbBuild ? ... : mockBuild...`, so it doesn't crash *today*, but:

- The variable name and non-null assertion are misleading.
- Any future code using `mockBuild` without the `dbBuild` guard will crash.

**Fix:** Remove the non-null assertion; use `fallbackBuild` directly in the ternary branches.

---

### 5. Duplicate & Conflicting `PricingService` Classes

Two completely separate `PricingService` implementations exist:

| File | Approach |
|------|----------|
| `src/services/pricingService.ts` | Web scraping (Newegg, Amazon, BestBuy, B&H) with in-memory cache |
| `src/lib/pricing/service.ts` | Provider-based architecture using `PricingProvider` interface + DB persistence |

Both export a singleton `pricingService`. The job registry (`src/lib/jobs/registry.ts`) imports from `@/lib/pricing/service`, while `src/services/priceUpdateJob.ts` imports from `@/services/pricingService`. These two systems are incompatible:

- The scraping service has `getPartPrice(slug, category)` → returns `PriceData`.
- The provider-based service has `refreshPartPricing(partId)` → returns `void` and persists to DB.

This means the `PriceUpdateJob` class and the job registry's `priceRefreshJob` call entirely different services with different APIs. One of these needs to be removed or they need to be unified.

---

## 🟠 Warnings / Code Smells

### 6. ESLint Errors — 12 Errors, 8 Warnings

**Full lint output (12 errors):**

| File | Rule | Issue |
|------|------|-------|
| `src/app/users/[id]/page.tsx:94` | `react/no-unescaped-entities` | Unescaped `'` in JSX |
| `src/app/users/[id]/page.tsx:28` | `@next/next/no-img-element` | Raw `<img>` instead of `next/image` |
| `src/components/builder/builder-workbench.tsx:251` (×2) | `@typescript-eslint/no-explicit-any` | `as any` casts |
| `src/lib/jobs/registry.ts:25` | `@typescript-eslint/no-explicit-any` | `payload: any` |
| `src/lib/pricing/service.ts:38` | `@typescript-eslint/no-explicit-any` | `tx: any` |
| `src/lib/public-content.ts` (×6) | `@typescript-eslint/no-explicit-any` | Multiple `any` types |
| `src/services/recommendations/service.ts:51` | `@typescript-eslint/no-explicit-any` | `as any` cast |

**Warnings (8):** Unused variables in `builder-workbench.tsx` (`isSaving`, `lastSaved`, `setLastSaved`, `requestAutosave`, `index`), unused import in `compare/page.tsx` (`notFound`), unused import in `recommendations/service.test.ts` (`emptyBuildSelections`).

---

### 7. Dead Code — Autosave Implementation Abandoned

**File:** `src/components/builder/builder-workbench.tsx` (lines 351–375)

The variables `isSaving`, `lastSaved`, `setLastSaved`, and the entire `requestAutosave` callback are declared but **never used**. The function body contains only comments explaining why autosave doesn't work with redirect-based server actions. This is dead code that should either be implemented or removed.

---

### 8. `formatRelativeTime` — Incorrect Threshold Logic

**File:** `src/lib/format.ts` (lines 24–36)

```ts
if (Math.abs(diffInDays) > 0) return rtf.format(diffInDays, "day");
```

`Math.abs(diffInDays) > 0` is true for *any* non-zero value, including when `diffInDays` is rounded from a few hours. This means a 2-hour-old timestamp would show "today" (days=0 rounds to 0, but then falls through). However, a 12-hour-old timestamp rounds `diffInDays` to 1, returning "yesterday" instead of "12 hours ago". The thresholds should use absolute hour/minute cutoffs, not rounded day values.

---

### 9. `shadowDatabaseUrl` Deprecated in Prisma 6.x

**File:** `prisma/schema.prisma` (line 9)

```prisma
datasource db {
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

Prisma 6.x deprecated `shadowDatabaseUrl` in the datasource block. This generates a deprecation warning on every migration run. It should be removed or migrated to the new CLI flag approach.

---

### 10. `console.log`/`console.warn`/`console.error` Used Directly in Services

**Files:**
- `src/services/pricingService.ts` — 6 instances of `console.log/warn/error`
- `src/services/priceUpdateJob.ts` — 4 instances of `console.log/error`

The project has a structured `logger` module (`src/lib/logger.ts`). These services bypass it, losing structured JSON logging, level filtering, and test silencing.

---

### 11. `.env` File Present in Working Tree

**File:** `.env` (contains `AUTH_SECRET`, `DATABASE_URL`)

While `.gitignore` has `.env*`, the `.env` file exists in the project root. Running `git log` shows it was never committed, but its presence is risky — a force-add or gitignore change could leak credentials. The `AUTH_SECRET` value (`rigsense-dev-secret`) is also far too short/predictable for any non-local environment.

---

### 12. `@types/cheerio` is Deprecated

**File:** `package.json` (line 31)

```json
"@types/cheerio": "^0.22.35"
```

Cheerio 1.x ships its own TypeScript types. The separate `@types/cheerio` package is outdated and may conflict with the bundled types. It should be removed.

---

### 13. Missing `break`/`return` After Validation Failure in `saveBuildAction`

**File:** `src/actions/builds.ts` (lines 42–48)

```ts
if (!selections) {
  builderRedirect(buildId, "invalid-build-data");
}

if (!metadata.success) {
  builderRedirect(buildId, "title-required");
}

const validSelections = selections;      // ← TypeScript thinks this could be null
const validMetadata = metadata.data;
```

`builderRedirect` calls `redirect()` which throws, so this works at runtime. But TypeScript can't narrow `selections` after the guard because `builderRedirect` returns `never` but has no explicit `return` type annotation on line 18. The signature `function builderRedirect(...): never` is correct, but the downstream code on line 50 (`const validSelections = selections`) doesn't benefit from narrowing — `selections` could still be `null` from TS's perspective if `builderRedirect` signature changes.

---

### 14. `user.id` Not Guaranteed on `requireUser` Return Type

**File:** `src/lib/session.ts` (lines 5–13)

```ts
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}
```

The returned `session.user` type is `DefaultSession["user"] & { id: string }` (from the type declaration), but the `id` field is populated via the JWT callback. If the JWT callback doesn't fire (e.g., session corruption), `user.id` could be undefined at runtime despite the TypeScript type saying otherwise. This is an edge case, but callers like `saveBuildAction` pass `user.id` directly to DB queries without null checks.

---

### 15. Recommendation Engine Runs on Every Render in Builder

**File:** `src/components/builder/builder-workbench.tsx` (lines 547–560)

`getRecommendations(...)` is called inline during render for **every slot section** (7 slots × 2 calls each = up to 14 calls). Each call runs `analyzeBuild()` for every candidate part. This is a pure computation that happens on every keystroke/selection change since it depends on `selectedParts` which is derived from `selections` state.

This should be memoized with `useMemo` to avoid unnecessary recomputation on unrelated re-renders.

---

## 🟡 Minor / Cleanup

### 16. Typo: "scrapapers" → "scrapers"

**File:** `src/services/pricingService.ts` (line 377)

```ts
console.warn(`All scrapapers failed for ${partSlug}, using manual fallback`);
//                ^^^^^^^^^^
```

---

### 17. Unused `notFound` Import

**File:** `src/app/compare/page.tsx` (line 2)

```ts
import { notFound } from "next/navigation";  // never used
```

---

### 18. Unused `emptyBuildSelections` Import in Test

**File:** `src/services/recommendations/service.test.ts` (line 3)

```ts
import { emptyBuildSelections } from "@/lib/build-editor";  // never used
```

---

### 19. `test-permissions.txt` — Stale File

**File:** `test-permissions.txt` (root)

This file appears to be a leftover from a permissions test. It should be removed or added to `.gitignore`.

---

### 20. `dev.log` Committed/Present in Root

**File:** `dev.log` (root, 1015 bytes)

A development log file exists in the project root. This should be gitignored and removed from version control.

---

### 21. Missing `lock` File

No `package-lock.json` or equivalent lock file exists in the repository root. This means `npm install` may resolve different dependency versions across environments, leading to non-reproducible builds.

---

### 22. `jsx` Compiler Option Set to `react-jsx`

**File:** `tsconfig.json` (line 14)

```json
"jsx": "react-jsx"
```

Next.js 16 typically uses `"jsx": "preserve"` and handles JSX transformation itself. Using `"react-jsx"` may cause conflicts with Next.js's own JSX handling depending on the build pipeline. The standard Next.js tsconfig uses `"preserve"`.

---

## Verification Commands Used

```bash
# TypeScript (passes clean)
node node_modules\typescript\bin\tsc --noEmit

# ESLint (12 errors, 8 warnings)
npx eslint .

# Vitest (1 failed test, 1 unhandled error)
npx vitest run
```
