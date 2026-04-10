/**
 * Verifies Gemini analysis visibility rules for the homepage:
 * 1) Optional HTTP call to GET /api/admin/run-analysis?force=1 (status + isValid).
 * 2) DB: latest valid vs any GoldAnalysis, freshness vs latest GoldPriceSnapshot (24h rule).
 *
 * Env (from .env.local / .env):
 *   DATABASE_URL        — required for DB section
 *   CRON_SECRET         — required for API section
 *   VERIFY_ANALYSIS_URL — optional base URL, e.g. http://localhost:3000 (no trailing slash)
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const HARD_STALE_MS = 24 * 60 * 60 * 1_000

function loadEnvFile(name: string) {
  const p = resolve(process.cwd(), name)
  if (!existsSync(p)) return
  const text = readFileSync(p, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

async function verifyApi(): Promise<void> {
  const base = process.env.VERIFY_ANALYSIS_URL?.replace(/\/$/, '')
  const secret = process.env.CRON_SECRET
  console.log('\n── API: GET /api/admin/run-analysis?force=1 ──')
  if (!base || !secret) {
    console.log(
      'Skipped. Set VERIFY_ANALYSIS_URL (e.g. http://localhost:3000) and CRON_SECRET,',
    )
    console.log('start `npm run dev`, then re-run this script.')
    return
  }
  const url = `${base}/api/admin/run-analysis?force=1`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  const body = (await res.json()) as Record<string, unknown>
  console.log(`HTTP ${res.status}`)
  console.log(JSON.stringify(body, null, 2))
  const isValid = body.isValid
  const status = body.status
  if (status === 'inserted' && isValid === true) {
    console.log('OK: inserted + isValid — homepage will show GoldAnalysisCard (if fresh ≤24h).')
  } else if (status === 'fallback' || isValid === false) {
    console.log(
      'Note: isValid false / fallback — getLatestAnalysis() ignores this row; UI shows placeholder.',
    )
  } else if (status === 'skipped') {
    console.log('Note: skipped (idempotency). No new row; existing valid row still applies.')
  } else if (status === 'error') {
    console.log('Note: error — no row written.')
  }
}

async function verifyDb(): Promise<void> {
  console.log('\n── DB: snapshot vs analysis freshness (24h rule) ──')
  if (!process.env.DATABASE_URL) {
    console.log('Skipped — DATABASE_URL not set.')
    return
  }
  const prisma = new PrismaClient()
  try {
    const snapshot = await prisma.goldPriceSnapshot.findFirst({
      orderBy: { fetchedAt: 'desc' },
      select: { id: true, fetchedAt: true },
    })
    const latestValid = await prisma.goldAnalysis.findFirst({
      where: { isValid: true },
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        generatedAt: true,
        basedOnPriceTimestamp: true,
        isValid: true,
        validationError: true,
      },
    })
    const latestAny = await prisma.goldAnalysis.findFirst({
      orderBy: { generatedAt: 'desc' },
      select: {
        id: true,
        generatedAt: true,
        basedOnPriceTimestamp: true,
        isValid: true,
        validationError: true,
      },
    })

    if (!snapshot) {
      console.log('No GoldPriceSnapshot rows — hero empty; analysis N/A.')
      return
    }
    console.log(`Latest snapshot: id=${snapshot.id} fetchedAt=${snapshot.fetchedAt.toISOString()}`)

    if (!latestAny) {
      console.log('No GoldAnalysis rows — homepage shows AnalysisUnavailableCard.')
      return
    }
    console.log(
      `Latest analysis (any): id=${latestAny.id} isValid=${latestAny.isValid} generatedAt=${latestAny.generatedAt.toISOString()}`,
    )
    if (!latestAny.isValid && latestAny.validationError) {
      const err = latestAny.validationError
      console.log(
        `  validationError: ${err.length > 200 ? `${err.slice(0, 200)}…` : err}`,
      )
    }

    if (!latestValid) {
      console.log(
        'No row with isValid=true — getLatestAnalysis() returns null; UI shows placeholder.',
      )
      return
    }
    console.log(
      `Latest valid analysis: id=${latestValid.id} basedOnPriceTimestamp=${latestValid.basedOnPriceTimestamp.toISOString()}`,
    )

    const gapMs = Math.abs(
      snapshot.fetchedAt.getTime() - latestValid.basedOnPriceTimestamp.getTime(),
    )
    const gapH = Math.round(gapMs / 3_600_000)
    console.log(`Gap (|snapshot.fetchedAt − basedOnPriceTimestamp|): ${gapH} h (${gapMs} ms)`)
    if (gapMs > HARD_STALE_MS) {
      console.log(
        `FAIL vs homepage rule: gap > 24h — validateAnalysisForSnapshot() returns null; AI card hidden.`,
      )
    } else {
      console.log(`OK: gap ≤ 24h — AI teaser + GoldAnalysisCard can render.`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

function printCardDistinction(): void {
  console.log('\n── UI card distinction (homepage) ──')
  console.log(
    'GoldAnalysisCard + RationaleTeaserStrip: persisted Gemini output in table `GoldAnalysis`',
  )
  console.log(
    '  (only rows with isValid=true, and ≤24h vs latest snapshot — see lib/queries/homepage.ts).',
  )
  console.log(
    'DailySummaryCard: table `dailySummary` (seed / separate pipeline — not the Gemini analysis job).',
  )
}

async function main() {
  console.log('Goldee — verify Gemini analysis visibility')
  printCardDistinction()
  await verifyDb()
  await verifyApi()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
