import type { GoldPriceProvider } from '../types'
import { MockProvider } from './mock.provider'
import { YgtaProvider } from './ygta.provider'

// ─── Provider registry ────────────────────────────────────────────────────────
// To add a new gold price source:
//   1. Create lib/ingestion/providers/your-source.provider.ts
//   2. Implement the GoldPriceProvider interface
//   3. Add an entry here
//   4. Set GOLD_PROVIDER=your-source in .env

const REGISTRY: Record<string, GoldPriceProvider> = {
  mock: new MockProvider(),
  ygta: new YgtaProvider(),
}

/**
 * Returns the active provider based on the GOLD_PROVIDER environment variable.
 * Defaults to 'mock' when the variable is unset — safe for local development.
 */
export function getActiveProvider(): GoldPriceProvider {
  const key = (process.env.GOLD_PROVIDER ?? 'mock').toLowerCase().trim()
  const provider = REGISTRY[key]

  if (!provider) {
    const valid = Object.keys(REGISTRY).join(' | ')
    throw new Error(
      `Unknown GOLD_PROVIDER="${key}". Valid options: ${valid}. Check your .env file.`,
    )
  }

  return provider
}

export { MockProvider, YgtaProvider }
