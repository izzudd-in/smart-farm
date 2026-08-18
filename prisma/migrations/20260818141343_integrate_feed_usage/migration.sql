-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "feedFormulaId" TEXT,
ADD COLUMN     "feedFormulaNameSnapshot" TEXT;

-- CreateTable
CREATE TABLE "DailyReportFeedItem" (
    "id" TEXT NOT NULL,
    "dailyReportId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "ingredientNameSnapshot" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "DailyReportFeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReportFeedItem_ingredientId_idx" ON "DailyReportFeedItem"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReportFeedItem_dailyReportId_ingredientId_key" ON "DailyReportFeedItem"("dailyReportId", "ingredientId");

-- CreateIndex
CREATE INDEX "DailyReport_feedFormulaId_idx" ON "DailyReport"("feedFormulaId");

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_feedFormulaId_fkey" FOREIGN KEY ("feedFormulaId") REFERENCES "FeedFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportFeedItem" ADD CONSTRAINT "DailyReportFeedItem_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReportFeedItem" ADD CONSTRAINT "DailyReportFeedItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
