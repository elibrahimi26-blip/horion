// Service worker minimal pour Horion.
// - Permet l'installation PWA (browsers exigent un SW actif)
// - Cache "network-first" pour les navigations (fallback hors-ligne)
// - Cache "cache-first" pour les assets statiques (_next/static, icons)
//
// La synchronisation des séances hors-ligne est gérée côté React via
// IndexedDB (voir useOfflineQueue) — pas par ce SW.

const CACHE_VERSION = "horion-v1";
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
