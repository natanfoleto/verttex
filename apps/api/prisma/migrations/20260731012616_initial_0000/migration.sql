-- AlterTable
ALTER TABLE "marketplace_settings" ADD COLUMN     "carouselAutoplay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "carouselIntervalSeconds" INTEGER NOT NULL DEFAULT 5;
