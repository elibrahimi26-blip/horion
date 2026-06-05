"use client";

// Notification locale via Web Notifications API (pas le Push web, qui passe
// par un serveur). Utilisé pour alerter en local quand un événement client
// se produit, ex : fin du timer de repos.
//
// Différence avec /features/push : le push web nécessite VAPID + service
// worker + subscription serveur. Ici on déclenche directement côté client.

let permissionPromise: Promise<NotificationPermission> | null = null;

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  // Cache la promesse pour éviter les multiples requestPermission en parallèle.
  if (!permissionPromise) {
    permissionPromise = Notification.requestPermission().finally(() => {
      permissionPromise = null;
    });
  }
  return permissionPromise;
}

export async function showLocalNotification(
  title: string,
  options: NotificationOptions = {},
): Promise<void> {
  const permission = await ensureNotificationPermission();
  if (permission !== "granted") return;

  // Préférer le service worker s'il est dispo (notif persistante, fonctionne
  // si l'onglet est en arrière-plan).
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        badge: "/icon-192.png",
        icon: "/icon-192.png",
        ...options,
      });
      return;
    } catch {
      // fallback en notif simple
    }
  }

  // Fallback : Notification directe (l'onglet doit être actif pour la voir).
  try {
    new Notification(title, options);
  } catch {
    // ignore
  }
}
