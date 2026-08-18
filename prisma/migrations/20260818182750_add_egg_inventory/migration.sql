-- CreateEnum
CREATE TYPE "EggStockAdjustmentType" AS ENUM ('OPENING', 'INCREASE', 'DECREASE');

-- CreateTable
CREATE TABLE "EggStockAdjustment" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "occurredAt" DATE NOT NULL,
    "type" "EggStockAdjustmentType" NOT NULL,
    "quantityKg" DECIMAL(14,3) NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "openingKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggStockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EggStockAdjustment_openingKey_key" ON "EggStockAdjustment"("openingKey");

-- CreateIndex
CREATE INDEX "EggStockAdjustment_farmId_occurredAt_idx" ON "EggStockAdjustment"("farmId", "occurredAt");

-- CreateIndex
CREATE INDEX "EggStockAdjustment_farmId_type_idx" ON "EggStockAdjustment"("farmId", "type");

-- CreateIndex
CREATE INDEX "EggStockAdjustment_createdById_idx" ON "EggStockAdjustment"("createdById");

-- AddForeignKey
ALTER TABLE "EggStockAdjustment" ADD CONSTRAINT "EggStockAdjustment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggStockAdjustment" ADD CONSTRAINT "EggStockAdjustment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
