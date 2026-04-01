#!/usr/bin/env node

const fs = require('fs')

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/map-goldapi-to-ingest.js <input.json> <output.json>')
}

const raw = fs.readFileSync(inputPath, 'utf8')
const row = JSON.parse(raw)

if (!row || typeof row !== 'object') {
  throw new Error('GoldAPI payload is not an object')
}

const toNum = (value, field) => {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${field}: ${JSON.stringify(value)}`)
  }
  return num
}

const timestampValue = row.timestamp ?? row.ts ?? row.updatedAt ?? row.time
const timestampMs =
  typeof timestampValue === 'number'
    ? (timestampValue > 1e12 ? timestampValue : timestampValue * 1000)
    : Date.parse(String(timestampValue ?? ''))

if (!Number.isFinite(timestampMs)) {
  throw new Error(`Missing/invalid timestamp in GoldAPI payload: ${JSON.stringify(timestampValue)}`)
}

const asTime = new Date(timestampMs).toISOString()

// GoldAPI commonly returns XAU/THB in THB per troy ounce.
// Convert to THB per 1 baht-weight (15.244g), then approximate 96.5% local pricing.
const TROY_OUNCE_GRAMS = 31.1034768
const BAHT_WEIGHT_GRAMS = 15.244
const PURITY_96_5 = 0.965

const pricePerOunceThb = toNum(row.price ?? row.ask ?? row.bid, 'price')
const perBahtWeight = (pricePerOunceThb / (TROY_OUNCE_GRAMS / BAHT_WEIGHT_GRAMS)) * PURITY_96_5

const round10 = (n) => Math.round(n / 10) * 10
const baseBarSell = round10(perBahtWeight)
const baseBarBuy = baseBarSell - 100
const ornamentBuy = baseBarBuy - 900
const ornamentSell = baseBarSell + 700

const payload = {
  source: 'goldapi',
  asTime,
  seq: String(row.timestamp ?? row.request_id ?? row.requestId ?? asTime),
  barBuy: baseBarBuy,
  barSell: baseBarSell,
  ornamentBuy,
  ornamentSell,
  fetchedAt: new Date().toISOString(),
}

for (const field of ['barBuy', 'barSell', 'ornamentBuy', 'ornamentSell']) {
  const val = payload[field]
  if (!Number.isFinite(val) || val <= 0) {
    throw new Error(`Mapped field ${field} is invalid: ${val}`)
  }
}

if (payload.barBuy >= payload.barSell) {
  throw new Error('Mapped barBuy must be less than barSell')
}
if (payload.ornamentBuy >= payload.ornamentSell) {
  throw new Error('Mapped ornamentBuy must be less than ornamentSell')
}

fs.writeFileSync(outputPath, JSON.stringify(payload))
console.log(
  `Normalized source=${payload.source} seq=${payload.seq} asTime=${payload.asTime} barSell=${payload.barSell}`,
)
