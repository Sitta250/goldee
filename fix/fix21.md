# Fix 21 — Fallback states (stale / missing / untrusted data)

**Phase:** 2 / engineering  
**Theme:** Trust — never show broken or contradictory UI

## Problem

When data is stale, missing, or AI can’t be trusted, the UI may still show partial or wrong content.

## Goal

- Safe fallback states with clear Thai messaging, e.g.  
  - `กำลังอัปเดตราคาล่าสุด`  
  - `ข้อมูลวิเคราะห์ยังไม่พร้อมใช้งาน`  
- **Hide** AI block if it fails validation (**Fix 20**) or confidence/input rules fail (**Fix 13**).  
- Do **not** show contradictory numbers — prefer hiding a secondary widget over lying.

## Start here (codebase)

- [`components/home/NoPriceData.tsx`](components/home/NoPriceData.tsx)
- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`app/page.tsx`](app/page.tsx)
- [`lib/queries/homepage.ts`](lib/queries/homepage.ts)

## Implementation plan

1. **Enumerate states**: `no_snapshot`, `stale_snapshot`, `analysis_missing`, `analysis_invalid`, `partial_currency_rate`.
2. **UI components**: small presentational `DataStaleBanner`, `AnalysisUnavailableCard` with consistent styling.
3. **Wire** from `getHomepageData` or page-level: if `validation !== ok`, pass flags to components.
4. **Staleness threshold**: e.g. if `fetchedAt` older than 2× expected ingest interval, show stale warning (**Fix 2** alignment).
5. **Calculator**: if no price, keep existing no-price state; ensure no NaN in inputs.

## Dependencies

- **Fix 20** for validation signals; works with **Fix 1**, **Fix 13**.

## Verify

- Simulate null snapshot, old snapshot, missing analysis in dev — each state shows one clear message, no mixed numbers.
- `npm run build` and smoke test `/`.
