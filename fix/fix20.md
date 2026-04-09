# Fix 20 — Consistency checks before render

**Phase:** 2 / engineering  
**Theme:** Trust — catch drift before users see it

## Problem

Silent mismatches between hero, AI, and summaries slip to production.

## Goal

Before rendering the homepage (server):

- Displayed prices match the **latest snapshot** identity chosen for this request.  
- AI rationale (if shown) references the **same** snapshot id or equivalent hash.  
- Timestamps are **not** older than a defined staleness budget unless fallback UI (**Fix 21**).  
- Deltas were computed from the **documented** baselines (**Fix 10**).

## Start here (codebase)

- [`app/page.tsx`](app/page.tsx) or a small `lib/home/validate-homepage-data.ts`
- [`lib/queries/homepage.ts`](lib/queries/homepage.ts)
- [`lib/queries/analysis.ts`](lib/queries/analysis.ts)

## Implementation plan

1. **Define** `HomepagePayload` with `snapshotId`, `analysisSnapshotId` (or embedded snapshot hash).
2. **Implement** `assertHomepageConsistency(payload)`:
   - throws or returns `{ ok: false, reason }` in production prefer **soft fail** → trigger fallback, not 500.
3. **Checks**: numeric tolerance (e.g. epsilon) for floats; strict equality for ids.
4. **Logging**: `console.error` / structured log with reason in production for monitoring.
5. **Tests**: vitest table of matching/mismatching fixtures.

## Dependencies

- **Fix 1**, **Fix 19** make this tractable.

## Verify

- Intentionally break a test fixture → fallback or error path triggers; no contradictory numbers on page.
