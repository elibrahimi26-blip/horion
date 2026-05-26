"use client";

import { useEffect, useRef } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (event: "release", cb: () => void) => void;
};

type WakeLockApi = {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
};

// Empêche l'écran de s'éteindre tant que le hook est actif.
// Support Chrome / Edge / Safari iOS 16.4+. Échoue silencieusement
// sur les navigateurs non compatibles.
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined") return;
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockApi })
      .wakeLock;
    if (!wakeLock) return;

    let cancelled = false;

    async function acquire() {
      try {
        const sentinel = await wakeLock!.request("screen");
        if (cancelled) {
          sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          sentinelRef.current = null;
        });
      } catch {
        // Permission refusée ou non supporté : on ignore
      }
    }

    acquire();

    // Re-acquérir le wake lock quand l'onglet redevient visible
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !sentinelRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [enabled]);
}
