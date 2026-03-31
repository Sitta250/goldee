-- CreateTable
CREATE TABLE "gold_price_snapshot" (
    "id" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_at" TIMESTAMP(3),
    "source" VARCHAR(50) NOT NULL,
    "source_name" TEXT,
    "announcement_number" TEXT,
    "gold_bar_buy" DECIMAL(10,2) NOT NULL,
    "gold_bar_sell" DECIMAL(10,2) NOT NULL,
    "jewelry_buy" DECIMAL(10,2) NOT NULL,
    "jewelry_sell" DECIMAL(10,2) NOT NULL,
    "spot_gold_usd" DECIMAL(10,4),
    "usd_thb" DECIMAL(8,4),
    "notes" TEXT,
    "raw_payload" JSONB,

    CONSTRAINT "gold_price_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_summary" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title_th" TEXT NOT NULL,
    "summary_th" TEXT NOT NULL,
    "reason_th" TEXT,
    "open_bar_sell" DECIMAL(10,2),
    "close_bar_sell" DECIMAL(10,2),
    "high_bar_sell" DECIMAL(10,2),
    "low_bar_sell" DECIMAL(10,2),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title_th" TEXT NOT NULL,
    "title_en" TEXT,
    "summary_th" TEXT NOT NULL,
    "body_th" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_item" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "site_description" TEXT NOT NULL,
    "default_currency" VARCHAR(10) NOT NULL DEFAULT 'THB',
    "contact_email" TEXT,
    "ad_banner_text" TEXT,
    "ad_rectangle_text" TEXT,
    "ad_sidebar_text" TEXT,
    "ad_footer_text" TEXT,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_status" (
    "id" TEXT NOT NULL,
    "source_name" VARCHAR(50) NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "last_checked_at" TIMESTAMP(3) NOT NULL,
    "last_success_at" TIMESTAMP(3),
    "last_success_price" DECIMAL(10,2),
    "error_message" TEXT,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gold_price_snapshot_fetched_at_idx" ON "gold_price_snapshot"("fetched_at" DESC);

-- CreateIndex
CREATE INDEX "gold_price_snapshot_captured_at_idx" ON "gold_price_snapshot"("captured_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "daily_summary_date_key" ON "daily_summary"("date");

-- CreateIndex
CREATE INDEX "daily_summary_date_idx" ON "daily_summary"("date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");

-- CreateIndex
CREATE INDEX "article_published_at_idx" ON "article"("published_at" DESC);

-- CreateIndex
CREATE INDEX "article_is_published_published_at_idx" ON "article"("is_published", "published_at" DESC);

-- CreateIndex
CREATE INDEX "article_slug_idx" ON "article"("slug");

-- CreateIndex
CREATE INDEX "faq_item_is_published_sort_order_idx" ON "faq_item"("is_published", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "source_status_source_name_key" ON "source_status"("source_name");
