-- CreateIndex
CREATE UNIQUE INDEX "gold_price_snapshot_source_announcement_number_captured_at_key"
ON "gold_price_snapshot"("source", "announcement_number", "captured_at");
