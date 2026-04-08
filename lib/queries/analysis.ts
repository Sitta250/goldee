/**
 * Queries for persisted GoldAnalysis records.
 * Always reads from the DB — never triggers a live LLM call.
 */

import { db }                     from '@/lib/db'
import type { GoldAnalysisRecord, GoldAnalysisPayload, RunWindow } from '@/types/analysis'

function toRecord(row: {
  id:                    string
  generatedAt:           Date
  basedOnPriceTimestamp: Date
  basedOnNewsWindow:     string
  modelName:             string
  modelVersion:          string | null
  inputHash:             string
  runWindow:             string
  payload:               unknown
  isValid:               boolean
  validationError:       string | null
}): GoldAnalysisRecord {
  return {
    id:                    row.id,
    generatedAt:           row.generatedAt,
    basedOnPriceTimestamp: row.basedOnPriceTimestamp,
    basedOnNewsWindow:     row.basedOnNewsWindow,
    modelName:             row.modelName,
    modelVersion:          row.modelVersion,
    inputHash:             row.inputHash,
    runWindow:             row.runWindow as RunWindow,
    payload:               row.payload as GoldAnalysisPayload,
    isValid:               row.isValid,
    validationError:       row.validationError,
  }
}

/** Latest analysis record where isValid = true (most recent generatedAt) */
export async function getLatestAnalysis(): Promise<GoldAnalysisRecord | null> {
  const row = await db.goldAnalysis.findFirst({
    where:   { isValid: true },
    orderBy: { generatedAt: 'desc' },
  })
  return row ? toRecord(row) : null
}

/** Latest valid analysis for a specific run window */
export async function getLatestAnalysisByWindow(
  window: RunWindow,
): Promise<GoldAnalysisRecord | null> {
  const row = await db.goldAnalysis.findFirst({
    where:   { runWindow: window, isValid: true },
    orderBy: { generatedAt: 'desc' },
  })
  return row ? toRecord(row) : null
}
