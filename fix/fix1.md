# Fix 1 — Canonical pricing data across hero, AI, trend, and history

**Phase:** 1 (must fix now)  
**Theme:** Trust — numbers must agree everywhere

## Problem

Hero price cards, AI rationale, trend sections, and history may use different snapshots, caches, or baselines. Users lose trust when displayed values disagree.

## Goal

- One **canonical** pricing snapshot (or derived view) drives all consumer-facing numbers on a given page load.
- AI summaries must not read from stale or parallel caches that diverge from what the hero shows.
- If validation detects mismatch, the page fails **safely** (no contradictory numbers).

## Start here (codebase)

- [`lib/queries/homepage.ts`](lib/queries/homepage.ts) — composite homepage data
- [`lib/queries/prices.ts`](lib/queries/prices.ts) — snapshots, summaries, trends
- [`lib/queries/analysis.ts`](lib/queries/analysis.ts) — AI / analysis records
- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`components/home/DailySummaryCard.tsx`](components/home/DailySummaryCard.tsx)
- [`types/gold.ts`](types/gold.ts), [`types/analysis.ts`](types/analysis.ts)

## Implementation plan

1. **Trace data flow** for one homepage request: list every query and which snapshot IDs or timestamps each UI block uses.
2. **Define a single source of truth** for “current price row” for the homepage — typically the latest `GoldPriceSnapshot` used by `PriceHero`, keyed by `id` or `fetchedAt` / `capturedAt`.
3. **Tie analysis to that snapshot**: ensure `getLatestAnalysis()` (or equivalent) is selected/joined so the analysis record documents the same snapshot the hero uses, or pass `snapshotId` explicitly into whatever renders AI text.
4. **Remove parallel “truth” paths**: if any component calls its own price fetch for the same semantic meaning, replace with props from the page-level canonical object.
5. **Add a server-side validation step** before render (see also [`fix20.md`](fix20.md)): compare hero numbers vs analysis-linked snapshot fields; on failure, log and enter safe fallback (see [`fix21.md`](fix21.md)).
6. **History page**: clarify that history table/chart is historical — hero on `/history` should still use the same “latest” snapshot as home if you show “current” anywhere; do not mix “latest” with “last row of table” without labeling.

## Dependencies

- Strongly coupled with **Fix 19** (shared pricing model) and **Fix 20** (consistency checks).

## Verify

- Load `/` with DevTools or server logs: one logical “latest price” identity used by hero + analysis card.
- Spot-check: bar buy/sell and jewelry lines match the snapshot backing the AI block for the same request.
