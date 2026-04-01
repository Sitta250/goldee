# Goldee — ราคาทองวันนี้

Real-time Thai gold price tracker. Fetches live prices from สมาคมค้าทองคำ (YGTA), stores them every 5 minutes, and displays them on a clean consumer-facing website.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma 5 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Deployment | Vercel + external scheduler (recommended), or Railway |
| Data source | สมาคมค้าทองคำ YGTA JSON API |

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL project (free tier works)
- npm

### 1. Clone and install

```bash
git clone <your-repo-url>
cd goldee
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set the required values:

```env
# From your Neon project dashboard → Connection Details
# Use the POOLED string (port 6543) for DATABASE_URL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/neondb?sslmode=require&pgbouncer=true"

# Use the DIRECT / unpooled string (port 5432) for migrations
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST:5432/neondb?sslmode=require"

# Generate with: openssl rand -hex 32
CRON_SECRET="your-random-secret-here"

# Use 'mock' for local dev — no external network calls
GOLD_PROVIDER="mock"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Goldee"
```

> **Why two connection strings?**
> Neon provides a pooled URL (port 6543, via PgBouncer) for runtime queries, and a direct URL (port 5432) for schema migrations. Use the pooled one for `DATABASE_URL` and the direct one for `DATABASE_URL_UNPOOLED`.

---

## Database Migration

### ISP port-blocking note

Many home ISPs block outbound port 5432. Prisma migrations connect via `DATABASE_URL_UNPOOLED` (port 5432).

**If you see `P1001: Can't reach database server at ep-xxx:5432`:**
Switch to a mobile hotspot for migration and seed commands, then switch back. Regular `npm run dev` (port 6543) is unaffected.

### Run migrations

```bash
npx prisma migrate dev
```

Creates all tables and indexes. Run once on initial setup; run again after any schema changes.

### Seed the database

```bash
npm run db:seed
```

Populates the database with:
- 168 mock price snapshots (one week of 5-minute intervals)
- 1 daily summary card
- 3 sample articles
- 5 FAQ items
- 1 SiteSettings row

After seeding, every page shows real-looking data.

### Inspect data (optional)

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`.

---

## Running in Development

```bash
npm run dev
```

App runs at `http://localhost:3000`.

`GOLD_PROVIDER=mock` (the default) generates deterministic fake prices locally — no external calls, no hotspot needed. Prices vary by time of day so the chart always has data.

### Test the ingestion pipeline

Dev-only trigger (no auth required):
```bash
curl http://localhost:3000/api/gold/trigger
```

Admin trigger (works in all environments, requires `CRON_SECRET`):
```bash
curl -H "Authorization: Bearer <your-CRON_SECRET>" \
     http://localhost:3000/api/admin/run-fetch
```

Expected response when a new price is inserted:
```json
{ "ok": true, "status": "inserted", "snapshotId": "...", "barSell": 47500, "durationMs": 85 }
```

Expected response when price is unchanged (duplicate):
```json
{ "ok": true, "status": "skipped", "reason": "All four prices match the most recent snapshot" }
```

---

## Gold Price Source Integration

### Mock mode (default)

`GOLD_PROVIDER=mock` — safe for development and CI. Prices are deterministic per 5-minute bucket so the deduplication logic behaves realistically.

### Real YGTA data locally

To receive real prices from สมาคมค้าทองคำ on your local machine, add both to `.env`:

```env
GOLD_PROVIDER="ygta"
GOLD_API_URL="https://www.goldtraders.or.th/UpdatePriceList.aspx"
```

> **Dev fallback:** If `GOLD_PROVIDER=ygta` but `GOLD_API_URL` is not set, the app automatically falls back to MockProvider in development and logs a warning. In production, the hardcoded endpoint is always used.

### If YGTA changes their API format

All field name aliases and the endpoint URL are isolated at the top of `lib/ingestion/providers/ygta.provider.ts` in `FIELD_ALIASES` and `YGTA_DEFAULT_URL`. Update those constants — no logic changes needed. All parsing helpers are exported so they can be unit-tested without hitting the network.

### Adding a new provider

1. Create `lib/ingestion/providers/your-source.provider.ts`
2. Implement the `GoldPriceProvider` interface (`lib/ingestion/types.ts`)
3. Register it in `lib/ingestion/providers/index.ts`
4. Set `GOLD_PROVIDER=your-source` in `.env`

All parsing must stay server-side only. Never import provider files in client components.

---

## Deployment

### Cheapest reliable option for this codebase

For this exact Next.js + Prisma + Neon setup, the cheapest reliable 5-minute path is:

- **Vercel + external scheduler + Neon**

Why this is the recommendation:
- Vercel Hobby does **not** support a 5-minute cron schedule
- Railway is reliable, but is typically a higher fixed monthly cost than Vercel Hobby + external scheduler
- The app has secure scheduler endpoints: `/api/scheduler/ingest` (canonical) and `/api/scheduler/fetch` (legacy)

### Recommended setup: Vercel + external scheduler + Neon

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "production deployment"
git push origin main
```

### Step 2 — Import in Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — the first deploy may fail until env vars are set

### Step 3 — Set environment variables

Vercel → your project → **Settings → Environment Variables**:

| Variable | Value | Note |
|---|---|---|
| `DATABASE_URL` | Neon pooled URL (port 6543) | Runtime queries |
| `DATABASE_URL_UNPOOLED` | Neon direct URL (port 5432) | Migrations only |
| `CRON_SECRET` | Random 32-byte hex string | Must match your local `.env` |
| `GOLD_PROVIDER` | `ygta` | Use `mock` for preview deployments |
| `GOLD_API_URL` | `https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false` | YGTA endpoint |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Used in sitemap and OG metadata |
| `NEXT_PUBLIC_SITE_NAME` | `Goldee` | |

Set all variables for **Production** environment. For **Preview** deployments, set `GOLD_PROVIDER=mock` to avoid sending real traffic from preview branches.

### Step 4 — Redeploy

After setting env vars: **Deployments → ⋯ → Redeploy**

### Step 5 — Run production migrations

From your local machine (use hotspot if port 5432 is blocked):

```bash
DATABASE_URL_UNPOOLED="<your-neon-direct-url>" npx prisma migrate deploy
```

`migrate deploy` applies pending migrations non-destructively — safe for production.

### Step 6 — Seed production (optional, first deploy only)

```bash
DATABASE_URL="<pooled-url>" \
DATABASE_URL_UNPOOLED="<direct-url>" \
npm run db:seed
```

The scheduler job will populate real price data automatically within 5 minutes; seed only if you want articles and FAQ items to appear immediately.

### Step 7 — Configure external scheduler (every 5 minutes)

Use **GitHub Actions** as the default scheduler for Vercel Hobby.

This repo includes `.github/workflows/scheduler-fetch.yml` with:
- `schedule`: every 5 minutes (`*/5 * * * *`)
- `workflow_dispatch`: manual run support
- `GET` to `YGTA_API_URL` (upstream source)
- normalize payload into `source`, `asTime`, `seq`, prices, and `fetchedAt`
- `POST` to `SCHEDULER_INGEST_URL` with `Authorization: Bearer ${CRON_SECRET}`
- explicit failure on non-200 responses
- fetch + ingest response logging for debugging

#### Add required GitHub secrets

In GitHub: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Add:
- `YGTA_API_URL` = `https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false`
- `SCHEDULER_INGEST_URL` = `https://your-domain.com/api/scheduler/ingest`
- `CRON_SECRET` = same value as Vercel `CRON_SECRET`

#### Enable the workflow

- Commit and push `.github/workflows/scheduler-fetch.yml` to your default branch
- In GitHub: **Actions** tab → open **Scheduler Fetch** workflow
- Confirm scheduled runs appear (GitHub may take a few minutes before first scheduled execution)

#### Test manual dispatch

- In GitHub: **Actions → Scheduler Fetch → Run workflow**
- Choose branch (usually `main`) and click **Run workflow**
- Open the run logs:
  - verify YGTA fetch `HTTP status: 200`
  - verify ingest `HTTP status: 200`
  - inspect ingest JSON response body (`inserted` or `skipped`)

---

## Scheduler Setup (5-minute fetch)

- `/api/scheduler/ingest` is the canonical endpoint for scheduler pushes
- `/api/scheduler/fetch` remains available as a legacy pull-based endpoint
- `/api/cron/fetch-gold-price` remains supported as a legacy path
- Auth uses: `Authorization: Bearer <CRON_SECRET>`
- 5-minute schedule (`*/5 * * * *`) is fully compatible with this ingestion flow
- For Vercel Hobby, use an external scheduler (GitHub Actions recommended)

**Verify scheduler ingest endpoint:**
```bash
curl -X POST \
     -H "Authorization: Bearer <CRON_SECRET>" \
     -H "Content-Type: application/json" \
     --data '{"source":"ygta","asTime":"2026-04-01T09:36:00","seq":"test-1","barBuy":49200,"barSell":49300,"ornamentBuy":48300,"ornamentSell":50000,"fetchedAt":"2026-04-01T09:36:30Z"}' \
     https://your-domain.com/api/scheduler/ingest
```

**Manual trigger in production:**
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
     https://your-domain.vercel.app/api/admin/run-fetch
```

---

## Data Storage & Scaling

### How deduplication works

Before inserting, the ingestion pipeline compares incoming prices against the most recent snapshot:
- If all four prices match (and announcement numbers match when both are present) → no new row; `lastSeenAt` is updated on the existing row
- If any price differs OR the announcement number changed → new row inserted

YGTA announces prices roughly twice per trading day. During stable periods, most 5-minute cron runs produce zero new rows. The `fetchedAt → lastSeenAt` window on each row records exactly how long that price was valid.

### Retention policy (planned, not yet implemented)

At ~2–24 new rows per trading day, the table grows slowly. When it becomes large:

| Data age | Recommended granularity | Action |
|---|---|---|
| < 30 days | 5-minute (current) | Keep all rows |
| 30 days – 1 year | Hourly | Aggregate → delete raw rows |
| > 1 year | Daily | Aggregate → delete hourly rows |

The queries in `lib/queries/history.ts` are written for this path:
- `getHistoryChartData()` downsamples to ≤200 points regardless of row count
- When you build an hourly/daily aggregate table, replace the `findMany` body for long ranges (`'6M'`, `'1Y'`, `'All'`) without changing the output type (`HistoryChartPoint[]`)

### What is never stored

- Raw API response bodies — `rawPayload` column is always NULL
- User sessions, page views, or click events
- Any personal or identifying data

---

## Troubleshooting

**`P1001: Can't reach database server at :5432`**
Your ISP blocks port 5432. Use a mobile hotspot for `prisma migrate dev` and `db:seed`. Normal dev (`npm run dev`) uses port 6543 and is unaffected.

**`Unknown GOLD_PROVIDER`**
`GOLD_PROVIDER` is missing from `.env`. Add `GOLD_PROVIDER="mock"`.

**`CRON_SECRET is not set`**
Add `CRON_SECRET="your-secret"` to `.env`. Required by `/api/admin/run-fetch` and the cron endpoint.

**Pages show empty states after deploy**
The DB has no snapshots. Either run `db:seed` or wait for the first cron run, or manually trigger:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://your-domain.com/api/admin/run-fetch
```

**Article cover images not loading**
Add your image CDN to `next.config.ts`:
```ts
remotePatterns: [{ protocol: 'https', hostname: 'your-cdn.com' }]
```

**Scheduler not running every 5 minutes**
- Confirm external scheduler frequency is `*/5 * * * *`
- Confirm `YGTA_API_URL` and `SCHEDULER_INGEST_URL` GitHub secrets are set correctly
- Confirm ingest URL is `https://your-domain.com/api/scheduler/ingest`
- Confirm header is `Authorization: Bearer <CRON_SECRET>` for ingest requests
- `CRON_SECRET` must match Vercel environment variables

**Chart shows old data after price update**
The history API route has a 4-minute `Cache-Control`. Wait up to 4 minutes or force a new deploy to invalidate the edge cache.

**TypeScript errors after `prisma migrate dev`**
Run `npm run db:generate` to regenerate the Prisma client types.

---

## Project Structure

```
app/
  page.tsx                        Homepage — live prices, chart, articles, FAQ
  history/page.tsx                Price history with timeframe filters
  calculator/page.tsx             Gold value calculator
  articles/page.tsx               Article listing with category filter
  articles/[slug]/page.tsx        Article detail with related articles
  about/page.tsx                  About / methodology page
  not-found.tsx                   Custom 404
  robots.ts                       /robots.txt
  sitemap.ts                      /sitemap.xml
  api/
    scheduler/ingest/             Canonical scheduler ingest endpoint (auth-gated POST)
    scheduler/fetch/              Legacy pull-based scheduler endpoint
    cron/fetch-gold-price/        Legacy cron endpoint (kept for compatibility)
    admin/run-fetch/              Manual trigger — auth-gated, any environment
    prices/history/               Client chart data (cached 4 min at edge)
    gold/trigger/                 Dev-only trigger — blocked in production
    gold/fetch/                   Internal fetch+persist — auth-gated POST
    cron/                         Legacy cron path — kept for compatibility

lib/
  db.ts                           Prisma singleton (hot-reload safe)
  ingestion/
    ingestion.service.ts          Main pipeline: fetch → validate → dedupe → persist
    providers/
      ygta.provider.ts            YGTA real data, defensive JSON parsing
      mock.provider.ts            Deterministic fake prices for dev/CI
      index.ts                    Provider registry + dev fallback
    validate.ts                   Price range and spread validation
    dedupe.ts                     Duplicate detection, lastSeenAt update
    persist.ts                    DB insert
    retry.ts                      Exponential backoff wrapper
    types.ts                      NormalizedGoldPrice, GoldPriceProvider interfaces
  queries/                        Typed server-side Prisma query functions
  utils/
    format.ts                     Thai locale number/date formatters
    trend.ts                      Price change calculation, gold value formula
    metadata.ts                   Shared OG + Twitter Card metadata builder

components/
  layout/                         Header, Footer, Container
  price/                          PriceHero, LastUpdated
  chart/                          TrendChart (client), TimeframeSelector
  history/                        HistoryChart (client), StatCards, HistoryTable
  calculator/                     GoldCalculator (client), CalculatorPreview
  articles/                       ArticleGrid, FeaturedArticleCard, ArticleBody
  ads/                            AdBanner, AdRectangle, AdSidebar, AdFooter
  home/                           DailySummaryCard, FaqSection
  ui/                             Badge, Divider, SectionHeading, ContentSection

types/                            Shared TypeScript interfaces
prisma/
  schema.prisma                   Database schema with indexes
  seed.ts                         Development seed data
```
