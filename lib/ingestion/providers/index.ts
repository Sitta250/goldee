import type { GoldPriceProvider } from '../types'
import { MockProvider }  from './mock.provider'
import { YgtaProvider }  from './ygta.provider'

// ─── Provider registry ────────────────────────────────────────────────────────
// To add a new gold price source:
//   1. Create lib/ingestion/providers/your-source.provider.ts
//   2. Implement the GoldPriceProvider interface
//   3. Add an entry here
//   4. Set GOLD_PROVIDER=your-source in .env / Vercel environment variables

const REGISTRY: Record<string, GoldPriceProvider> = {
  mock: new MockProvider(),
  ygta: new YgtaProvider(),
}

/**
 * Returns the active provider based on the GOLD_PROVIDER environment variable.
 *
 * Resolution order:
 *   1. Read GOLD_PROVIDER (default: 'mock')
 *   2. In development: if provider is 'ygta' but GOLD_API_URL is not explicitly
 *      set, warn and fall back to MockProvider — avoids accidental live traffic
 *      from dev machines and keeps the cron runnable without an internet connection.
 *   3. In production: use the configured provider as-is; GOLD_API_URL can be
 *      omitted because YgtaProvider has a hardcoded fallback endpoint.
 *
 * To use real YGTA data locally:
 *   Set GOLD_PROVIDER=ygta AND GOLD_API_URL=https://www.goldtraders.or.th/UpdatePriceList.aspx
 *   in your .env file. The explicit URL signals intentional real-data dev mode.
 */
export function getActiveProvider(): GoldPriceProvider {
  const key = (process.env.GOLD_PROVIDER ?? 'mock').toLowerCase().trim()

  // ── Development fallback ──────────────────────────────────────────────────
  // If a developer sets GOLD_PROVIDER=ygta without also setting GOLD_API_URL,
  // it probably means they copied the .env.example without fully reading it.
  // Fall back silently in that case rather than firing real requests or crashing.
  if (
    key === 'ygta' &&
    !process.env.GOLD_API_URL &&
    process.env.NODE_ENV !== 'production'
  ) {
    console.warn(
      '[providers] GOLD_PROVIDER=ygta but GOLD_API_URL is not set. ' +
      'Falling back to MockProvider for local development. ' +
      'To use real YGTA data locally, add GOLD_API_URL to your .env file:\n' +
      '  GOLD_API_URL=https://www.goldtraders.or.th/UpdatePriceList.aspx',
    )
    return REGISTRY.mock
  }

  const provider = REGISTRY[key]
  if (!provider) {
    const valid = Object.keys(REGISTRY).join(' | ')
    throw new Error(
      `Unknown GOLD_PROVIDER="${key}". Valid options: ${valid}. ` +
      'Check your .env file (or Vercel Environment Variables in production).',
    )
  }

  return provider
}

export { MockProvider, YgtaProvider }
