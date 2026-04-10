/**
 * Asserts at least 2 GoldAnalysis rows were written during the previous
 * Asia/Bangkok calendar day (expected: morning + evening cron).
 *
 * Env: DATABASE_URL (Neon pooled URL is fine for this read).
 *
 * GitHub Actions: set secret DATABASE_URL; schedule e.g. 5 17 * * * UTC (~00:05 ICT).
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'

const TZ = 'Asia/Bangkok'

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

function bangkokYmd(d: Date): string {
  return d.toLocaleDateString('en-CA', {
    timeZone:     TZ,
    year:         'numeric',
    month:        '2-digit',
    day:          '2-digit',
  })
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const now                  = new Date()
  const todayYmd             = bangkokYmd(now)
  const todayStartBangkok    = new Date(`${todayYmd}T00:00:00+07:00`)
  const yesterdayStartBangkok = new Date(todayStartBangkok.getTime() - 24 * 60 * 60 * 1_000)

  const prisma = new PrismaClient()
  try {
    const count = await prisma.goldAnalysis.count({
      where: {
        generatedAt: {
          gte: yesterdayStartBangkok,
          lt:  todayStartBangkok,
        },
      },
    })

    const ymd = bangkokYmd(yesterdayStartBangkok)
    console.log(
      `GoldAnalysis count for ICT calendar day ${ymd} (exclusive [start, nextDay)): ${count}`,
    )

    if (count < 2) {
      console.error(
        `Expected at least 2 rows (morning + evening). Got ${count}. Check Vercel/GitHub analysis crons.`,
      )
      process.exit(1)
    }

    console.log('OK — daily analysis cadence met.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
