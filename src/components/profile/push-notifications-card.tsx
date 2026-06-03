"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/features/push/actions";

type Status =
  | "loading"
  | "unsupported"
  | "blocked"
  | "available"
  | "subscribed"
  | "no-server-key";

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(cleaned);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export function PushNotificationsCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        if (!cancelled) setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("blocked");
        return;
      }

      try {
        const res = await fetch("/api/push/vapid-public-key");
        if (res.status === 503) {
          if (!cancelled) setStatus("no-server-key");
          return;
        }
        if (!res.ok) throw new Error("VAPID key fetch failed");

        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "subscribed" : "available");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("available");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEnable() {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "available");
        return;
      }

      const res = await fetch("/api/push/vapid-public-key");
      if (!res.ok) throw new Error("Impossible de récupérer la clé serveur");
      const { publicKey } = (await res.json()) as { publicKey: string };

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJSON = sub.toJSON();
      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        throw new Error("Subscription incomplète");
      }

      startTransition(async () => {
        await subscribeToPushAction({
          endpoint: subJSON.endpoint!,
          keys: {
            p256dh: subJSON.keys!.p256dh!,
            auth: subJSON.keys!.auth!,
          },
          userAgent: navigator.userAgent,
        });
        setStatus("subscribed");
      });
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Échec de l'activation des notifications",
      );
    }
  }

  async function handleDisable() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setStatus("available");
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      startTransition(async () => {
        await unsubscribeFromPushAction(endpoint);
        setStatus("available");
      });
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Échec de la désactivation",
      );
    }
  }

  return (
    <div className="rounded-md border p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === "subscribed" ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold">Notifications push</p>
            <p className="text-xs text-muted-foreground">
              {status === "subscribed"
                ? "Tu reçois les notifications sur ce navigateur."
                : "Sois alerté en temps réel même quand Horion est fermé."}
            </p>
          </div>

          {status === "loading" ? (
            <p className="text-xs text-muted-foreground">Vérification…</p>
          ) : null}

          {status === "unsupported" ? (
            <p className="text-xs text-muted-foreground">
              Ce navigateur ne supporte pas les notifications push.
            </p>
          ) : null}

          {status === "no-server-key" ? (
            <p className="text-xs text-muted-foreground">
              Les notifications push ne sont pas encore configurées côté serveur.
            </p>
          ) : null}

          {status === "blocked" ? (
            <p className="text-xs text-destructive">
              Notifications bloquées. Autorise-les dans les paramètres du navigateur.
            </p>
          ) : null}

          {status === "available" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleEnable}
              disabled={pending}
            >
              <Bell className="mr-2 h-4 w-4" />
              {pending ? "Activation…" : "Activer les notifications"}
            </Button>
          ) : null}

          {status === "subscribed" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDisable}
              disabled={pending}
            >
              <BellOff className="mr-2 h-4 w-4" />
              {pending ? "Désactivation…" : "Désactiver"}
            </Button>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
