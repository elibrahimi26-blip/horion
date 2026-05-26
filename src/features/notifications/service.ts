import type { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  url?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      url: params.url ?? null,
    },
  });
}
