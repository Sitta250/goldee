// ─── Gold price fetcher ───────────────────────────────────────────────────────
// This is the ONLY file that talks to the external data source.
// Swap sources by updating the fetch logic below — nothing else changes.

import { transformYgta } from './transformer'
import type { RawGoldPrice } from './types'
export type { RawGoldPrice } from './types'

export async function fetchGoldPrice(): Promise<RawGoldPrice> {
  const url = process.env.GOLD_API_URL
  if (!url) throw new Error('GOLD_API_URL environment variable is not set')

  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer':    'https://www.goldtraders.or.th/',
      'Accept':     'application/json, text/plain, */*',
    },
  })
  if (!res.ok) throw new Error(`YGTA fetch failed: HTTP ${res.status} ${res.statusText}`)

  const json = await res.json()
  return transformYgta(json)
}
