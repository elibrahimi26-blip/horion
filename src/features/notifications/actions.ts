"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Marque la notif comme lue puis redirige vers son URL si présente.
// Utilisé par le bouton-formulaire sur chaque ligne de notif.
export async function openNotificationAction(notificationId: string) {
  const session = await requireUser();

  const notif = await db.notification.findFirst({
    where: { id: notificationId, userId: session.user.id },
    select: { url: true },
  });

  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");

  if (notif?.url) {
    redirect(notif.url);
  }
  redirect("/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireUser();
  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}
