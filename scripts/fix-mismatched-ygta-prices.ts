/**
 * fix-mismatched-ygta-prices.ts
 *
 * Deletes YGTA announcement rows that were ingested with a 2026 capturedAt
 * timestamp but carry 2025 prices (announcement numbers "68/xxxx").
 *
 * These rows show up in the 30D history view with ~47k prices because their
 * capturedAt is within the last 30 days, but the actual prices belong to 2025
 * and are ~25k lower than current market values.
 *
 * Usage:
 *   npx tsx scripts/fix-mismatched-ygta-prices.ts
 *   npx tsx scripts/fix-mismatched-ygta-prices.ts --delete
 *
 * Without --delete it runs in dry-run mode (shows what would be removed).
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const DRY_RUN = !process.argv.includes('--delete')

async function main() {
  console.log(DRY_RUN ? '🔍  DRY RUN — no data will be changed' : '🗑  DELETE MODE')
  console.log()

  // Pattern: YGTA "68/xxxx" announcement numbers (year 2568 = 2025) that have
  // a capturedAt in 2026 — their prices (~47k) are correct for 2025 but wrong
  // for the 2026 timestamps they were given at ingest.
  const TARGET_YEAR_PREFIX = '68/'
  const WRONG_FROM_DATE    = new Date('2026-01-01T00:00:00Z')

  const preview = await db.goldPriceSnapshot.findMany({
    where: {
      announcementNumber: { startsWith: TARGET_YEAR_PREFIX },
      capturedAt:         { gte: WRONG_FROM_DATE },
    },
    orderBy: { capturedAt: 'desc' },
    select: {
      id:                 true,
      capturedAt:         true,
      announcementNumber: true,
      goldBarSell:        true,
      source:             true,
    },
  })

  if (preview.length === 0) {
    console.log('✅  No matching rows found. Nothing to do.')
    return
  }

  console.log(`Found ${preview.length} row(s) to remove:\n`)
  for (const r of preview) {
    console.log(
      `  ${r.capturedAt?.toISOString().slice(0, 10)}  #${r.announcementNumber}  ` +
      `sell=${r.goldBarSell}  src=${r.source}  id=${r.id}`,
    )
  }
  console.log()

  if (DRY_RUN) {
    console.log('Run with --delete to remove these rows:')
    console.log('  npx tsx scripts/fix-mismatched-ygta-prices.ts --delete')
    return
  }

  const result = await db.goldPriceSnapshot.deleteMany({
    where: {
      announcementNumber: { startsWith: TARGET_YEAR_PREFIX },
      capturedAt:         { gte: WRONG_FROM_DATE },
    },
  })

  console.log(`✅  Deleted ${result.count} row(s).`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
