-- CreateTable
CREATE TABLE "gold_analysis" (
    "id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "based_on_price_timestamp" TIMESTAMP(3) NOT NULL,
    "based_on_news_window" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_version" TEXT,
    "input_hash" TEXT NOT NULL,
    "run_window" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_error" TEXT,

    CONSTRAINT "gold_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gold_analysis_generated_at_idx" ON "gold_analysis"("generated_at" DESC);

-- CreateIndex
CREATE INDEX "gold_analysis_run_window_generated_at_idx" ON "gold_analysis"("run_window", "generated_at" DESC);
