-- AlterTable
ALTER TABLE "Exercise"
ADD COLUMN "nameFr" TEXT,
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "equipment" TEXT,
ADD COLUMN "level" TEXT,
ADD COLUMN "force" TEXT,
ADD COLUMN "mechanic" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "imagePaths" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_externalId_key" ON "Exercise"("externalId");

-- CreateIndex
CREATE INDEX "Exercise_isVisible_idx" ON "Exercise"("isVisible");
