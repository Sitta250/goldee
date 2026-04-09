# Fix 15 — Meaningful price alerts (retention feature)

**Phase:** 3 (growth)  
**Theme:** Feature — bring users back

## Problem

No way for users to get notified when price hits a target, moves by X baht, or on key update windows.

## Goal

Product direction (implement incrementally):

- Notify when price **hits user target**  
- Notify when price **changes by more than X baht** (per gram/baht weight — define unit)  
- Optional: **morning/evening** digest tied to actual announcement patterns  
- Optional: **unusual volatility** flag vs recent variance

## Engineering reality check

Requires: **identity** (auth or device token), **storage** (targets, preferences), **delivery** (email, LINE, push — pick one for MVP), **jobs** (cron or queue comparing latest snapshot to rules).

## Start here (codebase)

- [`prisma/schema.prisma`](prisma/schema.prisma) — extend with `AlertRule`, `User` or anonymous `AlertSubscription`
- Cron: [`app/api/cron/`](app/api/cron/) or existing scheduler routes
- Latest price: [`lib/queries/prices.ts`](lib/queries/prices.ts)

## Implementation plan (MVP → full)

1. **Choose MVP channel**: e.g. email via Resend, or “copy link to LINE” deferred — document decision in PR.
2. **Schema**: `alert_type`, `threshold`, `reference_price`, `created_at`, `last_triggered_at`, optional `user_id` / `email` / `push_subscription`.
3. **API**: CRUD for rules (authenticated or magic-link minimal auth).
4. **Worker**: after each ingest or on 5m cron, evaluate rules against latest snapshot; send notification; dedupe (cooldown).
5. **UI**: simple page or modal from home “แจ้งเตือนราคา” with 2–3 presets + custom threshold.
6. **Phase 2**: time windows, volatility (rolling stdev on last N points from history query).

## Dependencies

- **Fix 1** / **Fix 19** — alerts must use same canonical price fields.

## Verify

- E2E: create rule → inject price change in dev → one notification fired, no spam loop.
