-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kandangId" TEXT NOT NULL,
    "flockId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "saleableEgg" DOUBLE PRECISION,
    "damagedEgg" DOUBLE PRECISION,
    "feedUsed" DOUBLE PRECISION,
    "mortality" INTEGER,
    "incidentalExpense" DECIMAL(14,2),
    "incidentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReport_operatorId_date_idx" ON "DailyReport"("operatorId", "date");

-- CreateIndex
CREATE INDEX "DailyReport_flockId_date_idx" ON "DailyReport"("flockId", "date");

-- CreateIndex
CREATE INDEX "DailyReport_kandangId_date_idx" ON "DailyReport"("kandangId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_date_kandangId_key" ON "DailyReport"("date", "kandangId");

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_kandangId_fkey" FOREIGN KEY ("kandangId") REFERENCES "Kandang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "Flock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
