/**
 * Fetches gold-related news from public RSS feeds.
 * No additional API keys required — only GEMINI_API_KEY is needed for this feature.
 *
 * Extend NEWS_SOURCES to add more feeds.
 */

import type { NewsItem } from '@/types/analysis'

// ─── Source configuration ─────────────────────────────────────────────────────

interface NewsSource {
  name:      string
  url:       string
  authority: number   // 0–10 score used by rank-news
}

const NEWS_SOURCES: NewsSource[] = [
  {
    name:      'Kitco',
    url:       'https://www.kitco.com/rss/all.rss',
    authority: 9,
  },
  {
    name:      'Reuters Commodities',
    url:       'https://feeds.reuters.com/reuters/businessNews',
    authority: 10,
  },
  {
    name:      'MarketWatch Commodities',
    url:       'https://feeds.marketwatch.com/marketwatch/realtimeheadlines',
    authority: 8,
  },
]

// Keywords that signal gold relevance
const GOLD_KEYWORDS = [
  'gold', 'xau', 'bullion', 'precious metal', 'spot price',
  'federal reserve', 'fed rate', 'inflation', 'dollar index',
  'safe haven', 'geopolitical', 'ทองคำ',
]

// ─── Minimal RSS parser ───────────────────────────────────────────────────────
// We avoid adding an XML-parsing dependency by extracting the handful of tags
// we need from the predictable RSS 2.0 structure.

interface RawRssItem {
  title:       string
  description: string
  link:        string
  pubDate:     string
}

function extractTagContent(xml: string, tag: string): string {
  // Handle both <tag>content</tag> and <![CDATA[content]]> forms
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i')
  const m  = re.exec(xml)
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

function parseRssItems(xml: string, sourceName: string, authority: number): NewsItem[] {
  const items: NewsItem[] = []

  // Split on <item> boundaries
  const rawItems = xml.split(/<item[\s>]/i).slice(1)

  for (const raw of rawItems) {
    const title       = extractTagContent(raw, 'title')
    const description = extractTagContent(raw, 'description')
    const link        = extractTagContent(raw, 'link')
    const pubDateStr  = extractTagContent(raw, 'pubDate')

    if (!title || !link) continue

    const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date()
    if (isNaN(publishedAt.getTime())) continue

    // Only keep items mentioning gold or related macro terms
    const text = (title + ' ' + description).toLowerCase()
    const relevant = GOLD_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()))
    if (!relevant) continue

    items.push({
      title,
      summary:        stripHtml(description).slice(0, 500),
      url:            link,
      source:         sourceName,
      publishedAt,
      relevanceScore: authority,   // initial score; rank-news will refine
    })
  }

  return items
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch raw news items from all configured RSS sources (runs in parallel). */
export async function fetchGlobalNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map((src) => fetchSource(src)),
  )

  const items: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }

  return items
}

async function fetchSource(src: NewsSource): Promise<NewsItem[]> {
  const res = await fetch(src.url, {
    headers: { 'User-Agent': 'Goldee/1.0 (+https://goldee.app)' },
    next:    { revalidate: 1800 },  // cache 30 min
  })

  if (!res.ok) throw new Error(`RSS fetch failed: ${src.url} → ${res.status}`)

  const xml = await res.text()
  return parseRssItems(xml, src.name, src.authority)
}
