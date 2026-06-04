-- Renomme memberId/adminId → userAId/userBId pour permettre
-- la messagerie member↔member. Pas de breaking change sur les données
-- existantes : on ne fait que renommer, l'ordre relatif (a vs b) est
-- conservé.

-- DropIndex
DROP INDEX IF EXISTS "PrivateThread_memberId_idx";
DROP INDEX IF EXISTS "PrivateThread_adminId_idx";
DROP INDEX IF EXISTS "PrivateThread_memberId_adminId_key";

-- DropForeignKey
ALTER TABLE "PrivateThread" DROP CONSTRAINT IF EXISTS "PrivateThread_memberId_fkey";
ALTER TABLE "PrivateThread" DROP CONSTRAINT IF EXISTS "PrivateThread_adminId_fkey";

-- RenameColumn
ALTER TABLE "PrivateThread" RENAME COLUMN "memberId" TO "userAId";
ALTER TABLE "PrivateThread" RENAME COLUMN "adminId" TO "userBId";

-- CreateIndex
CREATE INDEX "PrivateThread_userAId_idx" ON "PrivateThread"("userAId");
CREATE INDEX "PrivateThread_userBId_idx" ON "PrivateThread"("userBId");
CREATE UNIQUE INDEX "PrivateThread_userAId_userBId_key" ON "PrivateThread"("userAId", "userBId");

-- AddForeignKey
ALTER TABLE "PrivateThread" ADD CONSTRAINT "PrivateThread_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrivateThread" ADD CONSTRAINT "PrivateThread_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
