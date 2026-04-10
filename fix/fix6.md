# Fix 6 — Reduce homepage clutter (order: decide first, read later)

**Phase:** 1 (must fix now)  
**Theme:** Focus — articles and FAQ are secondary

## Problem

Articles, FAQ, chart, and secondary modules compete with the decision-critical block (price, movement, rationale, calculator).

## Goal

Clear order:

1. Price + movement + timestamps  
2. Rationale (compact or full per **Fix 3**)  
3. Calculator entry (**Fix 5**)  
4. Chart / TradingView (if kept)  
5. **Then** articles  
6. **Then** FAQ and other supporting content

## Start here (codebase)

- [`app/page.tsx`](app/page.tsx)
- Section components: `ArticleGrid`, `FaqSection`, `TradingViewChart`, `DailySummaryCard`, `GoldAnalysisCard`, `Divider`

## Implementation plan

1. **Reorder sections** in `app/page.tsx` to match the list above; remove redundant dividers if they add noise.
2. **Collapse or shorten** intermediate cards: e.g. merge daily summary into hero area if it duplicates movement (avoid three boxes saying similar things).
3. **Articles**: keep `ArticlesSectionHeader` + grid but only **after** primary actions.
4. **FAQ**: move to bottom; optional accordion to reduce vertical space.
5. **Streaming/Suspense** (if present): align fallbacks so skeleton order matches final order (**Fix 4** UX).

## Dependencies

- **Fix 4**, **Fix 5**, **Fix 8**, **Fix 9**.

## Verify

- Scroll depth to “first article title” increases (price block comes first).
- No duplicate metrics in adjacent cards without clear distinction.
