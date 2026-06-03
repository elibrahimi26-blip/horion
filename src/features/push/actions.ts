"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

export async function subscribeToPushAction(payload: PushSubscriptionPayload) {
  const session = await requireUser();

  if (
    !payload?.endpoint ||
    !payload.keys?.p256dh ||
    !payload.keys?.auth ||
    typeof payload.endpoint !== "string"
  ) {
    throw new Error("Subscription payload invalide");
  }

  await db.pushSubscription.upsert({
    where: { endpoint: payload.endpoint },
    create: {
      userId: session.user.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      userAgent: payload.userAgent ?? null,
    },
    update: {
      userId: session.user.id,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
      userAgent: payload.userAgent ?? null,
    },
  });

  return { ok: true };
}

export async function unsubscribeFromPushAction(endpoint: string) {
  const session = await requireUser();
  if (!endpoint || typeof endpoint !== "string") return { ok: false };

  await db.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return { ok: true };
}
