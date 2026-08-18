-- CreateTable
CREATE TABLE "FeedIngredient" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "currentPricePerKg" DECIMAL(14,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedFormula" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedFormulaItem" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "FeedFormulaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedIngredient_farmId_isActive_idx" ON "FeedIngredient"("farmId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeedIngredient_farmId_name_key" ON "FeedIngredient"("farmId", "name");

-- CreateIndex
CREATE INDEX "FeedFormula_farmId_isActive_idx" ON "FeedFormula"("farmId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeedFormula_farmId_name_key" ON "FeedFormula"("farmId", "name");

-- CreateIndex
CREATE INDEX "FeedFormulaItem_ingredientId_idx" ON "FeedFormulaItem"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedFormulaItem_formulaId_ingredientId_key" ON "FeedFormulaItem"("formulaId", "ingredientId");

-- AddForeignKey
ALTER TABLE "FeedIngredient" ADD CONSTRAINT "FeedIngredient_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFormula" ADD CONSTRAINT "FeedFormula_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFormulaItem" ADD CONSTRAINT "FeedFormulaItem_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "FeedFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedFormulaItem" ADD CONSTRAINT "FeedFormulaItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
