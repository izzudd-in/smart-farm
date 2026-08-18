-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'PRIMARY',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kandang" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activeFlockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kandang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flock" (
    "id" TEXT NOT NULL,
    "kandangId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "initialPopulation" INTEGER NOT NULL,
    "endedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KandangOperators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KandangOperators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farm_scope_key" ON "Farm"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_code_key" ON "Farm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Kandang_activeFlockId_key" ON "Kandang"("activeFlockId");

-- CreateIndex
CREATE INDEX "Kandang_farmId_idx" ON "Kandang"("farmId");

-- CreateIndex
CREATE INDEX "Kandang_isActive_idx" ON "Kandang"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Kandang_farmId_code_key" ON "Kandang"("farmId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Kandang_farmId_name_key" ON "Kandang"("farmId", "name");

-- CreateIndex
CREATE INDEX "Flock_kandangId_startDate_idx" ON "Flock"("kandangId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Flock_kandangId_name_key" ON "Flock"("kandangId", "name");

-- CreateIndex
CREATE INDEX "_KandangOperators_B_index" ON "_KandangOperators"("B");

-- AddForeignKey
ALTER TABLE "Kandang" ADD CONSTRAINT "Kandang_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kandang" ADD CONSTRAINT "Kandang_activeFlockId_fkey" FOREIGN KEY ("activeFlockId") REFERENCES "Flock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flock" ADD CONSTRAINT "Flock_kandangId_fkey" FOREIGN KEY ("kandangId") REFERENCES "Kandang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KandangOperators" ADD CONSTRAINT "_KandangOperators_A_fkey" FOREIGN KEY ("A") REFERENCES "Kandang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KandangOperators" ADD CONSTRAINT "_KandangOperators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
