# Fix 14 — Disclaimer placement (trust first, legal clarity second)

**Phase:** 2 (should build next)  
**Theme:** Trust — disclaimer supports, not replaces accuracy

## Problem

Disclaimer can feel like the site is dodging responsibility; or it appears before users see trustworthy data.

## Goal

Order of trust:

1. **Accurate, labeled data** (source + times — **Fix 12**, **Fix 2**)  
2. **Useful explanation** (AI — **Fix 3**, **Fix 13**)  
3. **Clear disclaimer** (not investment advice, data delays, etc.)

Disclaimer must not be the first thing users read; it is not a substitute for fixing mismatches (**Fix 1**, **Fix 20**).

## Start here (codebase)

- [`components/layout/Footer.tsx`](components/layout/Footer.tsx)
- Any `Disclaimer` or legal components; grep `ไม่ใช่คำแนะนำ`, `disclaimer`, `ความเสี่ยง`

## Implementation plan

1. **Locate** all disclaimer copy and its visual prominence (size, color, position).
2. **Move** primary disclaimer to footer or collapsible “ข้อมูลสำคัญ” below main content — not above hero.
3. **Short inline microcopy** (optional): one neutral line near price: `ราคาอ้างอิงจากแหล่งประกาศ — ไม่ใช่คำแนะนำการลงทุน` only if it fits product/legal; avoid duplicating long text.
4. **Tone edit**: ensure disclaimer reads as transparency, not defensive wall of text (legal review).

## Dependencies

- Best after **Fix 1–3** so main content earns trust.

## Verify

- First screen shows data before any long legal block.
- Legal stakeholder approves moved/compressed copy.
