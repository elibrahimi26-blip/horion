import { db } from "@/lib/db";

export async function listNotifications(userId: string, limit = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, readAt: null },
  });
}
