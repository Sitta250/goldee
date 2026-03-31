-- AlterTable
ALTER TABLE "gold_price_snapshot" ADD COLUMN     "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
