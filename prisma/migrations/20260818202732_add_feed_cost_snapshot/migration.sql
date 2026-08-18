-- CreateEnum
CREATE TYPE "FeedCostBasis" AS ENUM ('LATEST_PURCHASE', 'MASTER_PRICE');

-- CreateEnum
CREATE TYPE "DailyExpenseCategory" AS ENUM ('MEDICINE_VITAMIN', 'DISINFECTANT', 'OVERTIME', 'MAINTENANCE', 'TRANSPORT', 'EQUIPMENT', 'OTHER');

-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "incidentalExpenseCategory" "DailyExpenseCategory";

-- AlterTable
ALTER TABLE "DailyReportFeedItem" ADD COLUMN     "costBasisSnapshot" "FeedCostBasis",
ADD COLUMN     "unitCostPerKgSnapshot" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "category" "DailyExpenseCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "occurredAt" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyExpense_farmId_occurredAt_idx" ON "DailyExpense"("farmId", "occurredAt");

-- CreateIndex
CREATE INDEX "DailyExpense_farmId_category_occurredAt_idx" ON "DailyExpense"("farmId", "category", "occurredAt");

-- CreateIndex
CREATE INDEX "DailyExpense_createdById_idx" ON "DailyExpense"("createdById");

-- CreateIndex
CREATE INDEX "DailyReport_date_incidentalExpenseCategory_idx" ON "DailyReport"("date", "incidentalExpenseCategory");

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "DailyExpense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
