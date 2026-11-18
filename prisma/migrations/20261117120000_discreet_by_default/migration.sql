-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "nickname" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "discreetLabel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plainPackaging" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_nickname_key" ON "Customer"("nickname");

-- CreateIndex (case-insensitive uniqueness)
CREATE UNIQUE INDEX "Customer_nickname_lower_key" ON "Customer" (lower("nickname"));
