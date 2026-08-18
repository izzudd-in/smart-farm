-- CreateEnum
CREATE TYPE "RoutineCostCategory" AS ENUM ('SALARY', 'ELECTRICITY', 'WATER', 'INTERNET', 'RENT', 'SECURITY', 'OTHER');

-- CreateTable
CREATE TABLE "RoutineCost" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "category" "RoutineCostCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineCost_farmId_periodStart_periodEnd_idx" ON "RoutineCost"("farmId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "RoutineCost_farmId_category_idx" ON "RoutineCost"("farmId", "category");

-- CreateIndex
CREATE INDEX "RoutineCost_createdById_idx" ON "RoutineCost"("createdById");

-- AddForeignKey
ALTER TABLE "RoutineCost" ADD CONSTRAINT "RoutineCost_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineCost" ADD CONSTRAINT "RoutineCost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
