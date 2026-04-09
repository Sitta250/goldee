# Fix 7 — Remove unfinished UI from production

**Phase:** 1 (must fix now)  
**Theme:** Trust — no placeholders

## Problem

Placeholder ads, dummy labels, and mock text signal an unfinished product and erode trust.

## Goal

Production builds show **no** obvious placeholders. Either real ad slots (env-gated), empty/minimal neutral chrome, or remove components until ready.

## Start here (codebase)

- [`components/ads/AdBanner.tsx`](components/ads/AdBanner.tsx)
- [`components/ads/AdFooter.tsx`](components/ads/AdFooter.tsx)
- [`components/ads/AdSidebar.tsx`](components/ads/AdSidebar.tsx)
- [`components/ads/AdRectangle.tsx`](components/ads/AdRectangle.tsx)
- [`app/layout.tsx`](app/layout.tsx), [`app/page.tsx`](app/page.tsx) — where ads are composed
- Grep: `TODO`, `PLACEHOLDER`, `AD SLOT`, `[ AD`, `mock`

## Implementation plan

1. **Grep** the repo for placeholder strings and TODOs visible in UI.
2. **Choose a strategy**:
   - **A)** Remove ad components from layout/pages for v1 production; or  
   - **B)** Gate with `NEXT_PUBLIC_ADS_ENABLED` — when false, render `null` (no gray boxes); or  
   - **C)** Replace placeholders with subtle single-line “พื้นที่โฆษณา” only if legally needed — prefer A/B.
3. **Clean dummy copy** in any remaining components.
4. **Ensure** `next build` and visual check of `/`, `/articles`, `/calculator` show no bracket placeholders.

## Dependencies

None (can ship early).

## Verify

- No `[ AD SLOT` or equivalent in HTML output.
- Stakeholder sign-off if ads are removed vs env-gated.
