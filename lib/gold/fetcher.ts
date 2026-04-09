// ─── Gold price fetcher ───────────────────────────────────────────────────────
// This is the ONLY file that talks to the external data source.
// Swap sources by updating the fetch logic below — nothing else changes.

import { transformYgta } from './transformer'
export type { RawGoldPrice } from './types'

export async function fetchGoldPrice(): Promise<RawGoldPrice> {
  const url = process.env.GOLD_API_URL
  if (!url) throw new Error('GOLD_API_URL environment variable is not set')

  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Gold API responded ${res.status}: ${res.statusText}`)

  const json = await res.json()
  return transformYgta(json)
}
