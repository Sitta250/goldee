import { NextRequest } from 'next/server'

/**
 * Shared auth check for scheduler/admin ingestion endpoints.
 * Accepts Authorization: Bearer <CRON_SECRET>.
 */
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authorization = req.headers.get('authorization')
  return authorization === `Bearer ${secret}`
}
