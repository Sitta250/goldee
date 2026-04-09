# Fix 9 — Strengthen visual hierarchy (price dominant)

**Phase:** 2 (should build next)  
**Theme:** Design — scan in 2 seconds

## Problem

Secondary sections compete with the main price; AI block can visually overpower or underwhelm inconsistently.

## Goal

- **Price** is the dominant visual element (size, weight, contrast).  
- **Day-over-day / session movement** is second.  
- **AI rationale** is short and scannable (headings + bullets — **Fix 3**).  
- Articles, FAQ, chart chrome look clearly **secondary** (lighter weight, smaller headings, more whitespace separation).

## Start here (codebase)

- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`components/home/DailySummaryCard.tsx`](components/home/DailySummaryCard.tsx)
- [`components/articles/ArticleGrid.tsx`](components/articles/ArticleGrid.tsx) — section headers
- [`app/globals.css`](app/globals.css) — tokens if any

## Implementation plan

1. **Define a type scale** for home: e.g. `text-4xl` for main price, `text-xl` for movement, `text-base` for rationale body, `text-sm` for meta.
2. **Apply** to PriceHero first; then tune GoldAnalysisCard so card border/heading doesn’t rival price numerals.
3. **Section spacing**: increase margin-top before articles/FAQ so cognitive break is clear.
4. **Color**: use gold/brand accent for price; neutral grays for secondary; avoid loud backgrounds on non-price cards.

## Dependencies

- **Fix 3** (AI structure), **Fix 6** (order).

## Verify

- Squint test: eye goes to price first, then green/red movement, then bullets.
- Compare before/after screenshots mobile + desktop.
