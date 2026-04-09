# Fix 8 — Mobile-first layout (first screen priority)

**Phase:** 2 (should build next)  
**Theme:** UX — most users on phone

## Problem

First screen on mobile feels crowded; critical info doesn’t read in priority order.

## Goal

On a typical phone viewport, first screen prioritizes:

1. Price  
2. Movement (deltas — labeled per **Fix 10**)  
3. Timestamp(s) (**Fix 2**)  
4. Rationale (scannable — **Fix 3**)  
5. Calculator (**Fix 5**)

## Start here (codebase)

- [`components/price/PriceHero.tsx`](components/price/PriceHero.tsx)
- [`app/page.tsx`](app/page.tsx)
- [`components/layout/Container.tsx`](components/layout/Container.tsx)
- Tailwind breakpoints: `sm:`, `lg:` usage across home components

## Implementation plan

1. **Audit** home layout at 375×812: measure what appears above fold; list overflow causes (padding, chart height, duplicate headings).
2. **Reduce vertical padding** on mobile for the hero stack only if it improves fold without hurting touch targets.
3. **Defer heavy blocks**: chart below fold; ensure dynamic chart (**performance doc**) doesn’t reserve 650px before first paint if possible (skeleton height vs content).
4. **Typography scale** on mobile: largest text = price; second = movement; rationale body smaller but readable (16px min for body).
5. **Test** landscape and small Android widths.

## Dependencies

- **Fix 4**, **Fix 6**, **Fix 9**, **Fix 10**.

## Verify

- Lighthouse mobile screenshot / manual: first screen matches priority list.
- No horizontal scroll; tap targets ≥44px where interactive.
