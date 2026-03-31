# Goldee — ราคาทองวันนี้

Consumer-facing Thai gold price website. Mobile-first, calm, and clear.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Prisma · Neon PostgreSQL · Recharts · Vercel

---

## Prerequisites

- Node.js 20+
- pnpm / npm / yarn
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd goldee
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (for migrations) |
| `CRON_SECRET` | Random secret for cron route auth — `openssl rand -hex 32` |
| `GOLD_API_URL` | Your gold price data source URL |
| `GOLD_API_KEY` | API key if required |
| `NEXT_PUBLIC_SITE_URL` | Full URL of your site (used for OG tags) |

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables in Neon)
npm run db:migrate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create and run a new migration |
| `npm run db:push` | Push schema without migration (dev only) |
| `npm run db:studio` | Open Prisma Studio (GUI for the DB) |

---

## Project Structure

```
goldee/
├── app/                    # Next.js App Router pages and API routes
│   ├── layout.tsx          # Root layout with Header, Footer, ad slots
│   ├── page.tsx            # Homepage
│   ├── history/            # Price history page
│   ├── calculator/         # Gold value calculator
│   ├── articles/           # Article listing + single article
│   ├── about/              # About + methodology
│   └── api/
│       ├── cron/           # Vercel cron endpoint (every 5 min)
│       ├── gold/fetch/     # Internal: fetch + store gold price
│       └── prices/history/ # Chart data for client-side timeframe switching
│
├── components/
│   ├── ads/                # Ad slot placeholders (AdBanner, AdRectangle, etc.)
│   ├── articles/           # Article card, grid, body renderer
│   ├── calculator/         # GoldCalculator (client), CalculatorPreview (client)
│   ├── chart/              # TrendChart (client) + TimeframeSelector (client)
│   ├── home/               # DailySummaryCard, FaqSection
│   ├── layout/             # Header, Footer, Container, MobileNav
│   ├── price/              # PriceHero, PriceCard, PriceChange, LastUpdated, PriceTable
│   └── ui/                 # Badge, SectionHeading, Divider, LoadingSkeleton
│
├── lib/
│   ├── db.ts               # Prisma singleton
│   ├── gold/               # fetcher.ts (source abstraction) + transformer.ts
│   ├── queries/            # prices.ts + articles.ts (DB query functions)
│   └── utils/              # format.ts (currency/date) + trend.ts (calculations)
│
├── prisma/
│   └── schema.prisma       # DB schema (GoldPriceSnapshot, Article, DailySummary)
│
├── types/
│   ├── gold.ts             # TypeScript interfaces for price data
│   └── article.ts          # TypeScript interfaces for articles
│
└── vercel.json             # Cron schedule: every 5 minutes
```

---

## Key Design Decisions

### Server components by default
All pages are server components. Only these components are `'use client'`:
- `TrendChart` — Recharts requires browser APIs
- `TimeframeSelector` — user interaction state
- `GoldCalculator` — real-time calculation state
- `CalculatorPreview` — real-time calculation state
- `MobileNav` — menu toggle state

### Data source abstraction
The provider system in `lib/ingestion/providers/` controls which gold price source is used.
Set `GOLD_PROVIDER=mock` (default) for local dev, or `GOLD_PROVIDER=ygta` for production.
To add a new source: implement `GoldPriceProvider`, register it in `providers/index.ts`.

### Cron flow
```
Vercel Cron (every 5 min)
  → GET /api/cron/fetch-gold-price   ← Authorization: Bearer <CRON_SECRET>
  → ingestGoldPrice()
      ├─ getActiveProvider().fetchLatestPrice()   (with 3× retry)
      ├─ validateAndNormalize()                   (throws ValidationError on bad data)
      ├─ checkDuplicate()
      │     duplicate → touchLastSeenAt()  → return 'skipped'
      │     new price → insertSnapshot()   → return 'inserted'
      └─ upsertSourceStatus()                     (always — records ok/error)
```

⚠️ **Vercel Cron only runs on Production deployments.**
Preview deployments do not receive cron calls. Use the admin endpoint for manual testing.

### Ad slots
Four named placeholder components. Replace the `<div>` contents with your ad network script. Sizes are documented in each file.

---

## Deployment to Vercel

### 1. Push to GitHub and import into Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Vercel auto-detects Next.js — no build config needed

### 2. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon direct connection (migrations only) |
| `CRON_SECRET` | ✅ | Random secret — `openssl rand -hex 32` |
| `GOLD_PROVIDER` | ✅ | `mock` for now, `ygta` when implemented |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `https://yourdomain.vercel.app` |
| `GOLD_API_URL` | when live | Confirmed gold price API endpoint |
| `GOLD_API_KEY` | when live | API key if the source requires one |

### 3. Deploy

Click **Deploy**. Vercel reads `vercel.json` and registers the cron job automatically.

### 4. Verify cron is running

- Vercel Dashboard → your project → **Cron Jobs** tab
- Each execution appears with its status, duration, and response body
- Expect `{ "ok": true, "status": "inserted" | "skipped", "durationMs": ... }`

### 5. Manual trigger (any environment)

To fire one ingestion cycle without waiting for cron:

```bash
# Local dev
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     http://localhost:3000/api/admin/run-fetch

# Production (e.g. after an outage)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://yourdomain.vercel.app/api/admin/run-fetch
```

---

## Local Development — Triggering Ingestion Manually

Two options during local dev:

**Option A — No auth required (dev only, blocked in production):**
```bash
# Just open in browser or curl — no token needed
curl http://localhost:3000/api/gold/trigger
```

**Option B — Same endpoint as production admin (requires CRON_SECRET in .env.local):**
```bash
curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" \
     http://localhost:3000/api/admin/run-fetch
```

---

## Adding a Real Gold Price Source

1. Open `lib/ingestion/providers/ygta.provider.ts`
2. Uncomment and implement the fetch + parse block
3. Set `GOLD_PROVIDER=ygta` and `GOLD_API_URL=<confirmed endpoint>` in env vars
4. Test locally with `/api/gold/trigger` or `/api/admin/run-fetch`
5. Monitor first production runs via Vercel Cron logs and `SourceStatus` table

---

## Seeding Articles

Articles are stored in the `article` table. To add one:

```bash
# Open Prisma Studio
npm run db:studio
```

Or use SQL / a seed script. Articles need `published: true` and a `publishedAt` date to appear on the site.

---

## Roadmap

- [ ] Phase 1: DB + cron + real data source
- [ ] Phase 2: Full homepage with live data
- [ ] Phase 3: Supporting pages
- [ ] Phase 4: Polish, SEO, mobile QA
- [ ] Phase 5: Real ads, alerts, admin panel
