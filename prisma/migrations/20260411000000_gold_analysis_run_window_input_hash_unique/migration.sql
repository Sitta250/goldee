-- Dedupe any accidental duplicate (run_window, input_hash) before unique index.
-- Keeps the row with the latest generated_at per pair.
DELETE FROM "gold_analysis" a
USING "gold_analysis" b
WHERE a."run_window" = b."run_window"
  AND a."input_hash" = b."input_hash"
  AND a."generated_at" < b."generated_at";

DELETE FROM "gold_analysis" a
USING "gold_analysis" b
WHERE a."run_window" = b."run_window"
  AND a."input_hash" = b."input_hash"
  AND a."id" > b."id"
  AND a."generated_at" = b."generated_at";

-- CreateIndex
CREATE UNIQUE INDEX "gold_analysis_run_window_input_hash_key" ON "gold_analysis"("run_window", "input_hash");
