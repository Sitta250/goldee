import { ValidationError } from './validate'

interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  label?: string
  /** Prefix for log lines; default `ingestion` → `[ingestion/myLabel]`. */
  logNamespace?: string
  /**
   * Return false to abort retries immediately.
   * Default: never retry ValidationErrors (deterministic — retrying won't help).
   */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Retry a fallible async operation with exponential back-off.
 *
 * Delays: 1s → 2s → 4s (baseDelayMs doubles each attempt).
 * ValidationErrors are never retried — they're deterministic failures that
 * more attempts won't fix.
 */
export async function withRetry<T>(
  fn:      () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts   = 3,
    baseDelayMs   = 1_000,
    label         = 'operation',
    logNamespace  = 'ingestion',
    shouldRetry   = (err) => !(err instanceof ValidationError),
  } = options

  let lastError!: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      const isLast     = attempt === maxAttempts
      const willRetry  = !isLast && shouldRetry(lastError, attempt)

      if (!willRetry) break

      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      console.warn(
        `[${logNamespace}/${label}] attempt ${attempt}/${maxAttempts} failed: ` +
        `${lastError.message} — retrying in ${delayMs}ms`,
      )
      await sleep(delayMs)
    }
  }

  throw lastError
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
