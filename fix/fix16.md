# Fix 16 — Segment users (paths for fast check, beginners, followers)

**Phase:** 3 (growth)  
**Theme:** IA — not one-size-fits-all

## Problem

Fast-check users, beginners, and active followers want different depth and entry points.

## Goal

Clear entry paths, for example:

- `เช็คราคาเร็ว` — minimal home / deep link  
- `วิเคราะห์วันนี้` — scroll to or dedicated section with AI + “what to watch” (**Fix 18**)  
- `คำนวณทองของฉัน` — `/calculator` with beginner copy

## Start here (codebase)

- [`components/layout/NavLinks.tsx`](components/layout/NavLinks.tsx), [`MobileNav.tsx`](components/layout/MobileNav.tsx)
- [`app/page.tsx`](app/page.tsx) — anchors: `id="analysis"`, `id="calculator-teaser"`
- Optional new routes: `app/quick/page.tsx` (ultra-minimal) — only if justified

## Implementation plan

1. **Add hash targets** on home for analysis and calculator sections (`id` + scroll-margin for sticky header).
2. **Nav or hero chips**: three links — `/` (or `/quick`), `#analysis` or `/` with query `?focus=analysis`, `/calculator`.
3. **Beginner path**: optional `/guide` or expand [`app/about/page.tsx`](app/about/page.tsx) with “เริ่มต้นใช้งาน” (if about exists).
4. **Analytics** (optional): UTM or internal event on chip clicks to validate usage.
5. **Avoid clutter**: on mobile, use compact segmented control or single row of text links (**Fix 8**).

## Dependencies

- **Fix 4–6** for sensible landing layout before adding more nav items.

## Verify

- Each persona can reach their goal in ≤2 taps from home.
- Keyboard and screen reader: links descriptive.
