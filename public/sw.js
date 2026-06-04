// Service worker minimal pour Horion.
// - Permet l'installation PWA (browsers exigent un SW actif)
// - Cache "network-first" pour les navigations (fallback hors-ligne)
// - Cache "cache-first" pour les assets statiques (_next/static, icons)
//
// La synchronisation des séances hors-ligne est gérée côté React via
// IndexedDB (voir useOfflineQueue) — pas par ce SW.

// Bump à chaque release qui change le CSS/JS shippé pour purger les caches
// clients (sinon les utilisateurs gardent l'ancienne UI tant qu'ils ne
// vident pas leur cache manuellement).
const CACHE_VERSION = "horion-v3-push";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Nettoie les caches d'anciennes versions
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET (POST/PUT/DELETE des server actions)
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne cache pas les API routes ni les server actions
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first pour les assets immutables Next.js
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Network-first pour les pages (avec fallback cache si offline)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (res.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            "<h1>Hors-ligne</h1><p>Cette page n'a pas pu être récupérée.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
  }
});

// ────── PUSH NOTIFICATIONS ──────
// Reçoit le payload JSON envoyé par web-push côté serveur :
// { title, body?, url?, tag? }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data ? event.data.text() : "Horion" };
  }

  const title = data.title || "Horion";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "horion-notification",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clic sur la notif → focus l'onglet existant ou ouvre une nouvelle fenêtre
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // ignore (cross-origin or unsupported)
            }
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
