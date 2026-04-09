# Fix 5 — Calculator as a core feature (prominence + Thai intents)

**Phase:** 2 (should build next)  
**Theme:** Utility — match real Thai queries

## Problem

Calculator feels secondary. Users think in terms like “ขายทอง 1 บาท ได้เท่าไร” and bullion vs jewelry.

## Goal

- Move calculator access **higher** on the homepage (see **Fix 4**, **Fix 6**).
- Surface **example intents** near the CTA: 1 baht weight sell/buy, bullion vs jewelry estimate (wording only or deep links with query params if supported).
- Visual weight comparable to price block, not a small footer link.

## Start here (codebase)

- [`components/calculator/CalculatorPreview.tsx`](components/calculator/CalculatorPreview.tsx)
- [`app/page.tsx`](app/page.tsx)
- [`app/calculator/page.tsx`](app/calculator/page.tsx)
- [`components/calculator/GoldCalculator.tsx`](components/calculator/GoldCalculator.tsx) — presets if any

## Implementation plan

1. **Promote `CalculatorPreview`** (or replace with a richer “Calculator teaser” card) immediately after hero + rationale teaser on `/`.
2. **Copy**: add 2–3 short Thai lines addressing common questions; link to `/calculator` with optional hash/query for mode (jewelry vs bar) if the calculator supports it — if not, add support minimally (default gold type).
3. **Visual design**: card size, icon, primary button — match importance of price (coordinate **Fix 9** hierarchy).
4. **Avoid duplication**: one strong CTA block; don’t scatter three small calculator links.

## Dependencies

- **Fix 4** for placement; **Fix 11** for copy tone.

## Verify

- Homepage: calculator visible without scrolling on mobile.
- Click path to full calculator is obvious; example intents readable in <5s.
