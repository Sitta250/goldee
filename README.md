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
`lib/gold/fetcher.ts` is the **only** file that touches the external gold price API.
To swap data sources: update `fetchGoldPrice()` in that file only.

### Cron flow
```
Vercel Cron → /api/cron (auth check) → /api/gold/fetch → DB insert
```

### Ad slots
Four named placeholder components. Replace the `<div>` contents with your ad network script. Sizes are documented in each file.

---

## Deployment to Vercel

1. Push your code to GitHub
2. Import repo in [Vercel Dashboard](https://vercel.com)
3. Set environment variables in Vercel project settings (same as `.env.local`)
4. Deploy — cron jobs are automatically registered from `vercel.json`

### Verify cron is working

After deploy, check Vercel Dashboard → **Cron Jobs** tab to see execution logs.

---

## Adding a Real Gold Price Source

1. Open `lib/gold/fetcher.ts`
2. Replace the mock implementation with a real `fetch()` call
3. Update `lib/gold/transformer.ts` with the actual response shape
4. Set `GOLD_API_URL` and `GOLD_API_KEY` in environment variables
5. Test with: `curl -H "Authorization: Bearer $CRON_SECRET" https://yoursite.com/api/cron`

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
