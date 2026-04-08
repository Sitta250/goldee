/**
 * Fetches expert gold commentary from an allowlist of authoritative sources.
 *
 * Only sources on EXPERT_ALLOWLIST are accepted — this prevents random blog
 * posts or social content from being treated as expert opinion.
 */

import type { ExpertItem } from '@/types/analysis'

// ─── Allowlist ────────────────────────────────────────────────────────────────
// Only these sources are trusted as expert commentary.
// authority: 0–10; higher = more weight in the ranking step.

interface ExpertSource {
  name:      string
  rssUrl:    string
  authority: number
}

const EXPERT_SOURCES: ExpertSource[] = [
  {
    name:      'World Gold Council',
    rssUrl:    'https://www.gold.org/goldhub/gold-focus/rss.xml',
    authority: 10,
  },
  {
    name:      'Kitco Commentary',
    rssUrl:    'https://www.kitco.com/rss/commentary.rss',
    authority: 8,
  },
  {
    name:      'BullionVault Research',
    rssUrl:    'https://www.bullionvault.com/gold-news/rss.do',
    authority: 7,
  },
]

export const EXPERT_SOURCE_NAMES = new Set(EXPERT_SOURCES.map((s) => s.name))

// ─── Minimal RSS parser (same approach as fetch-global-news) ──────────────────

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`,
    'i',
  )
  const m = re.exec(xml)
  if (!m) return ''
  return (m[1] ?? m[2] ?? '').trim()
}

function parseExpertItems(xml: string, src: ExpertSource): ExpertItem[] {
  const items: ExpertItem[] = []
  const rawItems = xml.split(/<item[\s>]/i).slice(1)

  for (const raw of rawItems) {
    const title      = extractTag(raw, 'title')
    const desc       = extractTag(raw, 'description')
    const link       = extractTag(raw, 'link')
    const pubDateStr = extractTag(raw, 'pubDate')
    const author     = extractTag(raw, 'author') ||
                       extractTag(raw, 'dc:creator') ||
                       src.name

    if (!title || !link) continue

    const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date()
    if (isNaN(publishedAt.getTime())) continue

    const quote = stripHtml(desc).slice(0, 400)
    if (!quote) continue

    items.push({
      expert:         author,
      source:         src.name,
      quote,
      url:            link,
      publishedAt,
      authorityScore: src.authority,
    })
  }

  return items
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchExpertCommentary(): Promise<ExpertItem[]> {
  const results = await Promise.allSettled(
    EXPERT_SOURCES.map((src) => fetchExpertSource(src)),
  )

  const items: ExpertItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value)
  }
  return items
}

async function fetchExpertSource(src: ExpertSource): Promise<ExpertItem[]> {
  const res = await fetch(src.rssUrl, {
    headers: { 'User-Agent': 'Goldee/1.0 (+https://goldee.app)' },
    next:    { revalidate: 3600 },  // cache 1 hour
  })

  if (!res.ok) throw new Error(`Expert RSS failed: ${src.rssUrl} → ${res.status}`)

  const xml = await res.text()
  return parseExpertItems(xml, src)
}
