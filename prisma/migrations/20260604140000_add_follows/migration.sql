-- Ajoute la valeur NEW_FOLLOWER à l'enum NotificationType.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_FOLLOWER';

-- Table Follow : relation asymétrique (follower suit following).
CREATE TABLE IF NOT EXISTS "Follow" (
  "followerId"  TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Follow_pkey" PRIMARY KEY ("followerId", "followingId"),
  CONSTRAINT "Follow_follower_fkey"  FOREIGN KEY ("followerId")  REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Follow_following_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");
CREATE INDEX IF NOT EXISTS "Follow_followerId_idx"  ON "Follow"("followerId");
