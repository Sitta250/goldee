#!/usr/bin/env node

const fs = require('fs')

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/map-chnwt-to-ingest.js <input.json> <output.json>')
}

const raw = fs.readFileSync(inputPath, 'utf8')
const parsed = JSON.parse(raw)

if (!parsed || typeof parsed !== 'object' || !parsed.response || typeof parsed.response !== 'object') {
  throw new Error('CHNWT payload is not in expected shape')
}

const response = parsed.response
const price = response.price
if (!price || typeof price !== 'object') {
  throw new Error('CHNWT payload missing response.price')
}

const toNum = (value, field) => {
  const num = Number(String(value ?? '').replace(/,/g, '').trim())
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${field}: ${JSON.stringify(value)}`)
  }
  return num
}

const updateDate = String(response.update_date ?? '').trim() // dd/mm/yyyy (thai year)
const updateTimeRaw = String(response.update_time ?? '').trim()
if (!updateDate || !updateTimeRaw) {
  throw new Error('CHNWT payload missing update_date/update_time')
}

const timeMatch = updateTimeRaw.match(/(\d{1,2}):(\d{2})/)
if (!timeMatch) {
  throw new Error(`Cannot parse update_time: ${updateTimeRaw}`)
}

const seqMatch = updateTimeRaw.match(/ครั้งที่\s*(\d+)/)
const seq = seqMatch ? seqMatch[1] : ''

const dateParts = updateDate.split('/')
if (dateParts.length !== 3) {
  throw new Error(`Invalid update_date: ${updateDate}`)
}

const day = Number(dateParts[0])
const month = Number(dateParts[1])
let year = Number(dateParts[2])
if (year > 2500) year -= 543 // Buddhist -> CE
if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
  throw new Error(`Invalid update_date numeric parts: ${updateDate}`)
}

const hours = Number(timeMatch[1])
const minutes = Number(timeMatch[2])
const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - (7 * 60 * 60 * 1000)
const asTime = new Date(utcMs).toISOString()

const payload = {
  source: 'chnwt',
  asTime,
  seq: seq || asTime,
  barBuy: toNum(price.gold_bar?.buy, 'gold_bar.buy'),
  barSell: toNum(price.gold_bar?.sell, 'gold_bar.sell'),
  ornamentBuy: toNum(price.gold?.buy, 'gold.buy'),
  ornamentSell: toNum(price.gold?.sell, 'gold.sell'),
  fetchedAt: new Date().toISOString(),
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
