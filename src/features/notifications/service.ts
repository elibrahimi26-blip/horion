import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/features/push/service";

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      url: params.url ?? null,
    },
  });

  // Push web : best-effort, ne bloque pas si la sub est expirée.
  void sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    url: params.url,
    tag: params.type,
  });

  return notification;
}
