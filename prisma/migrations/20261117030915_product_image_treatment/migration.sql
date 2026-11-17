-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "backdrop" TEXT,
ADD COLUMN     "compositeUrl" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "originalUrl" TEXT,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN     "treatment" TEXT NOT NULL DEFAULT 'original',
ADD COLUMN     "whiteBackground" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "width" INTEGER;
