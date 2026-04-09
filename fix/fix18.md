# Fix 18 — “What to watch today” (compact context strip)

**Phase:** 3 (growth)  
**Theme:** Engagement — site feels daily-useful

## Problem

Users lack a scannable list of macro/domestic factors that contextualize today’s move.

## Goal

A small section under the rationale (or inside **Fix 3** structure as `สิ่งที่ต้องจับตา` expansion) covering themes such as:

- USD / Fed (only if in inputs)  
- Geopolitical risk (only if in inputs)  
- Thai baht  
- Global gold trend  
- Domestic price rounds / สมาคมประกาศ

## Start here (codebase)

- [`components/home/GoldAnalysisCard.tsx`](components/home/GoldAnalysisCard.tsx) — or new `WatchTodayStrip.tsx`
- [`lib/analysis/summarize-gemini.ts`](lib/analysis/summarize-gemini.ts) — structured bullets from news + spot + fx
- [`types/analysis.ts`](types/analysis.ts) — optional `watchItems: string[]`

## Implementation plan

1. **Decide**: embed in AI output (**Fix 3**) vs separate component fed by same analysis JSON.
2. **Prompt**: require 3–5 bullets max; each bullet maps to one input category; omit category if no data (**Fix 13**).
3. **UI**: horizontal chips on mobile or vertical list; icons optional (keep lightweight).
4. **Stale handling**: if analysis older than X hours, show muted state or hide strip (**Fix 21**).

## Dependencies

- **Fix 3**, **Fix 13**; news/fx fetch pipeline must exist or bullets come from price-only.

## Verify

- With news off, strip still shows 2–3 useful domestic/price items, not empty.
