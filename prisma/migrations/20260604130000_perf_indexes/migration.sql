-- Sprint perf 1 : indexes manquants identifiés à l'audit.
-- Tous ces indexes ciblent des colonnes filtrées ou triées en hot path
-- (stats, liste paginée, fix N+1 messagerie).

CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_lastLoginAt_idx" ON "User"("lastLoginAt");

CREATE INDEX IF NOT EXISTS "WorkoutSession_userId_endedAt_idx"
  ON "WorkoutSession"("userId", "endedAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "PrivateMessage_threadId_readAt_idx"
  ON "PrivateMessage"("threadId", "readAt");
