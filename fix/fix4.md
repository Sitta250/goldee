# Fix 4 — Homepage answers the user in ~5 seconds (above the fold)

**Phase:** 1 (must fix now)  
**Theme:** Utility — fast decision

## Problem

Users must scroll or parse clutter before they get buy/sell, changes, time, rationale, and calculator entry.

## Goal

Above the fold, immediately show:

- Current **buy** and **sell** (clear which is which — bar and/or jewelry as product requires)
- Change vs **previous update**
- Change vs **yesterday** (or last trading day — define precisely)
- **Last updated** time(s)
- **One-line** rationale (or first line of structured AI — see **Fix 3**)
- Clear **calculator** entry point

## Start here (codebase)

- [`app/page.tsx`](app/page.tsx) — section order
- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`components/calculator/CalculatorPreview.tsx`](components/calculator/CalculatorPreview.tsx)
- [`lib/queries/homepage.ts`](lib/queries/homepage.ts) — ensure data for “yesterday” delta exists or add query

## Implementation plan

1. **Define “yesterday”** for Thai gold context (calendar day UTC+7 vs last two snapshots — document in code comment).
2. **Extend homepage data** (or hero props) to include `changeFromYesterday` (and any missing jewelry/bar breakdown) in one object (**Fix 19**).
3. **Reorder `app/page.tsx`**: hero → compact movement row (previous update + yesterday + optional 7d teaser) → one-line rationale strip or collapsed AI summary → calculator CTA → chart → rest.
4. **Mobile viewport check**: first screen shows price + movement + time without scrolling (use typical iPhone viewport in devtools).
5. **Wire calculator**: prominent link/button “คำนวณมูลค่าทอง” above the fold (coordinates with **Fix 5**).

## Dependencies

- **Fix 6** (clutter), **Fix 8** (mobile), **Fix 10** (movement labels), **Fix 19** (shared model).

## Verify

- New user on phone sees buy/sell, both deltas, timestamp, rationale teaser, calculator link without scrolling.
- Desktop keeps the same information hierarchy at the top.
