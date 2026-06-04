import webpush from "web-push";
import { db } from "@/lib/db";

// Pas d'import @/lib/env volontairement : ça forcerait la validation Zod
// des env vars requises au moment du build Docker (où elles ne sont pas
// passées au stage "builder"). Cf. fix du Dockerfile post-PR #9.
// Les VAPID keys étant entièrement optionnelles, on les lit directement
// depuis process.env au runtime.

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:contact@horion.app",
    publicKey,
    privateKey,
  );
  vapidConfigured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

// Envoie une push notification à toutes les subscriptions actives d'un user.
// Best-effort : ne throw jamais (les notifs en BD sont source de vérité).
// Les subscriptions expirées (404/410) sont supprimées automatiquement.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configureVapid()) return;

  const subs = await db.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  if (subs.length === 0) return;

  const stringPayload = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          stringPayload,
        );
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (status === 404 || status === 410) {
          await db.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        } else {
          console.error("[push] send failed", { endpoint: sub.endpoint, err });
        }
      }
    }),
  );
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
