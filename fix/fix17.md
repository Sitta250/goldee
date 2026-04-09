# Fix 17 — AI rationale as a product feature (not decoration)

**Phase:** 3 (growth) — overlaps Phase 1 format work  
**Theme:** Product — answer “why / what matters / act or wait”

## Problem

The AI block reads as marketing fluff rather than helping decisions.

## Goal

The section explicitly helps users answer:

- **Why** did price move? (grounded — **Fix 13**)  
- **What matters today?** (bullets — **Fix 3**)  
- **Act now or wait?** (`มุมมองวันนี้` line for buyer/seller/wait — **Fix 3**)

## Start here (codebase)

- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx)
- [`lib/analysis/summarize-gemini.ts`](lib/analysis/summarize-gemini.ts)
- [`app/page.tsx`](app/page.tsx) — placement relative to hero (**Fix 4**)

## Implementation plan

1. **Card title + subhead**: rename to outcome-oriented Thai (e.g. `วิเคราะห์วันนี้: ควรจับตาอะไร`) — coordinate **Fix 11**.
2. **Ensure** the three user questions are answerable from visible content without scrolling inside the card.
3. **Cross-link**: optional “ดูประวัติราคา” to `/history` when trend context helps “wait”.
4. **Empty state**: if analysis missing, show CTA to refresh later — not a blank card (**Fix 21**).
5. **Measure**: optional thumbs up/down or “มีประโยชน์ไหม” later — out of scope unless requested.

## Dependencies

- **Fix 3** (format), **Fix 1** (data tie-in), **Fix 13** (guardrails).

## Verify

- User interview or self-test: three questions answerable in 10s from the card alone.
