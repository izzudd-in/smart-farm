-- CreateEnum
CREATE TYPE "FeedStockAdjustmentType" AS ENUM ('OPENING', 'INCREASE', 'DECREASE');

-- CreateTable
CREATE TABLE "FeedPurchase" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "purchasedAt" DATE NOT NULL,
    "quantityKg" DECIMAL(14,3) NOT NULL,
    "unitPricePerKg" DECIMAL(14,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "supplier" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedStockAdjustment" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "occurredAt" DATE NOT NULL,
    "type" "FeedStockAdjustmentType" NOT NULL,
    "quantityKg" DECIMAL(14,3) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "openingKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedStockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedPurchase_farmId_purchasedAt_idx" ON "FeedPurchase"("farmId", "purchasedAt");

-- CreateIndex
CREATE INDEX "FeedPurchase_ingredientId_purchasedAt_idx" ON "FeedPurchase"("ingredientId", "purchasedAt");

-- CreateIndex
CREATE INDEX "FeedPurchase_createdById_idx" ON "FeedPurchase"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "FeedStockAdjustment_openingKey_key" ON "FeedStockAdjustment"("openingKey");

-- CreateIndex
CREATE INDEX "FeedStockAdjustment_farmId_occurredAt_idx" ON "FeedStockAdjustment"("farmId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedStockAdjustment_ingredientId_occurredAt_idx" ON "FeedStockAdjustment"("ingredientId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedStockAdjustment_ingredientId_type_idx" ON "FeedStockAdjustment"("ingredientId", "type");

-- CreateIndex
CREATE INDEX "FeedStockAdjustment_createdById_idx" ON "FeedStockAdjustment"("createdById");

-- AddForeignKey
ALTER TABLE "FeedPurchase" ADD CONSTRAINT "FeedPurchase_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPurchase" ADD CONSTRAINT "FeedPurchase_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPurchase" ADD CONSTRAINT "FeedPurchase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedStockAdjustment" ADD CONSTRAINT "FeedStockAdjustment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedStockAdjustment" ADD CONSTRAINT "FeedStockAdjustment_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedStockAdjustment" ADD CONSTRAINT "FeedStockAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
