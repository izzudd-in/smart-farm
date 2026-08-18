-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "discountPerKg" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggPrice" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "pricePerKg" DECIMAL(14,2) NOT NULL,
    "effectiveAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EggPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_farmId_isActive_idx" ON "Customer"("farmId", "isActive");

-- CreateIndex
CREATE INDEX "Customer_farmId_name_idx" ON "Customer"("farmId", "name");

-- CreateIndex
CREATE INDEX "EggPrice_farmId_effectiveAt_idx" ON "EggPrice"("farmId", "effectiveAt");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggPrice" ADD CONSTRAINT "EggPrice_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
