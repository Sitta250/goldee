# Goldee — page load performance implementation

**Goal:** Faster TTFB, fewer duplicate DB calls per request, smoother navigations, lighter first paint.

**Stack context:** Next.js 15 App Router, Prisma + Postgres (e.g. Neon), React 19.

**Key files:** `app/layout.tsx`, `app/page.tsx`, `lib/queries/prices.ts`, `lib/queries/homepage.ts`, `components/chart/TradingViewChart.tsx`, `components/ui/LoadingSkeleton.tsx`.

---

## Step 1 — Deduplicate Prisma reads with React `cache()`

1. Open `lib/queries/prices.ts`.
2. Add: `import { cache } from 'react'`.
3. Wrap **`getLatestSnapshot`** (and ideally **`getPreviousSnapshot`**) with `cache()` so results are memoized per request.
   - Pattern: `export const getLatestSnapshot = cache(async () => { ... })`, or a cached inner implementation with a stable exported API.
4. Ensure **all** server call sites import from this module so deduplication applies:
   - `app/layout.tsx` — `getLatestSnapshot`
   - `lib/queries/homepage.ts` — `getLatestSnapshot` / `getPreviousSnapshot`
   - `app/calculator/page.tsx` — `getLatestSnapshot`
   - Any other server components importing these functions
5. **Optional:** Replace separate latest + previous calls with **one** `findMany` ordered by `fetchedAt: 'desc'`, `take: 2`, split into latest/previous in JS. Keep a cached `getLatestSnapshot` for layout-only callers.

**Verify:** With Prisma query logging in dev, load `/` once — you should **not** see two identical queries for the latest snapshot in the same request.

---

## Step 2 — Add global route loading UI

1. Create `app/loading.tsx` (App Router convention).
2. Render a lightweight placeholder for the **page** segment during navigations (root layout still provides header/footer).
3. Reuse patterns from `components/ui/LoadingSkeleton.tsx` for consistency.
4. Prefer a Server Component unless client behavior is required.

**Verify:** Navigate between `/`, `/history`, `/articles` — an immediate loading state appears instead of a long blank stall.

---

## Step 3 — Stream the homepage with `Suspense`

1. Open `app/page.tsx` — it currently awaits `getHomepageData()` as one block.
2. Split into:
   - **Above-the-fold:** e.g. `PriceHero`, `NoPriceData`, optional `CalculatorPreview` and chart wrapper — keep data dependencies clear.
   - **Below-the-fold:** e.g. `DailySummaryCard`, `GoldAnalysisCard`, `ArticleGrid` + header, `FaqSection` — use **async Server Components** that fetch only what they need, or small parallel data functions.
3. Wrap below-the-fold sections in `<Suspense fallback={...}>` using `LoadingSkeleton.tsx` where appropriate.
4. Keep `export const revalidate = 300` and existing metadata on `app/page.tsx`.

**Verify:** With throttled network, hero HTML appears before lower sections complete.

---

## Step 4 — Dynamic import for TradingView chart

1. In `app/page.tsx` and `app/history/page.tsx`, replace static import of `TradingViewChart` with `next/dynamic`:

   ```ts
   import dynamic from 'next/dynamic'

   const TradingViewChart = dynamic(
     () =>
       import('@/components/chart/TradingViewChart').then((m) => m.TradingViewChart),
     { ssr: false, loading: () => <ChartSkeleton /> },
   )
   ```

2. Import `ChartSkeleton` from `@/components/ui/LoadingSkeleton`.
3. **Optional:** Defer script injection until the chart container is in viewport (`IntersectionObserver` + `rootMargin`).

**Verify:** `npm run build` succeeds; chart works; initial JS is smaller on routes that include the chart.

---

## Step 5 — Trim Google font weights

1. Open `app/layout.tsx` — `Sarabun` from `next/font/google`.
2. Audit which font weights the UI actually uses (often 400, 600, 700).
3. Remove unused entries from `weight: [...]`.
4. Keep `subsets: ['thai', 'latin']` unless there is a deliberate change.

**Verify:** No visual regression on Thai text; slightly lower font payload in Lighthouse.

---

## Step 6 — Production follow-ups (if still slow)

1. **Database:** Use Neon **pooler** URL (or Prisma Accelerate / Data Proxy) for serverless.
2. **History:** If `/history` TTFB is high, review indexes on snapshot table columns used in `lib/queries/history.ts` (`capturedAt`, `fetchedAt`, ordering filters).

---

## Step 7 — Regression check

1. Run `npm run build` — zero errors.
2. Manually test: `/`, `/history`, `/calculator`, `/articles`, one article detail page.
3. Optional: Lighthouse mobile on `/` and `/history`.

---

## Files likely touched

- `lib/queries/prices.ts` — `cache()` (+ optional merged query)
- `app/page.tsx` — Suspense, dynamic chart
- `app/history/page.tsx` — dynamic chart
- `app/loading.tsx` — **new**
- `app/layout.tsx` — font weights only
- Optional small components for homepage sections if `page.tsx` needs to stay readable

**Constraints:** Do not change unrelated features, ads, or business logic. Keep diffs minimal and idiomatic for Next.js 15 App Router.

---

## Prompt snippet (for Claude)

Point Claude at this file, e.g.:

> Read and implement `docs/performance-implementation.md` step by step in order. Minimal diffs; preserve behavior and copy. After each step, list changed files and how to verify. Run `npm run build` at the end and fix any issues you introduce.
