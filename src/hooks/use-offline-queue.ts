"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveSetAction } from "@/features/sessions/actions";
import type { SetLogInput } from "@/features/sessions/schemas";
import {
  enqueueSet,
  getQueue,
  getQueueForSession,
  removeFromQueue,
  type StoredSet,
} from "@/lib/offline-queue";

type SaveResult = { queued: boolean };

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const flushingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const queue = await getQueue();
      setPendingCount(queue.length);
    } catch {
      // IndexedDB indisponible : ignore
    }
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      const queue = await getQueue();
      for (const item of queue) {
        try {
          await saveSetAction({
            sessionId: item.sessionId,
            exerciseId: item.exerciseId,
            setNumber: item.setNumber,
            weightKg: item.weightKg,
            reps: item.reps,
            durationSec: item.durationSec,
          });
          await removeFromQueue(item.id);
        } catch {
          // Probablement encore offline ou session déjà terminée — on stoppe
          break;
        }
      }
      await refreshCount();
    } finally {
      flushingRef.current = false;
    }
  }, [refreshCount]);

  // Init au montage + flush si online
  useEffect(() => {
    refreshCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushQueue();
    }
  }, [refreshCount, flushQueue]);

  // Listeners online/offline
  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      flushQueue();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushQueue]);

  // saveSet : tente le réseau, fallback queue. Toujours réussit
  // (sauf si IndexedDB indisponible — cas extrême).
  const saveSet = useCallback(
    async (input: SetLogInput): Promise<SaveResult> => {
      if (isOnline) {
        try {
          await saveSetAction(input);
          // Profite du retour réseau pour flush si pending
          if (pendingCount > 0) flushQueue();
          return { queued: false };
        } catch {
          // Échec malgré navigator.onLine === true : on bascule en queue
        }
      }
      try {
        await enqueueSet({
          sessionId: input.sessionId,
          exerciseId: input.exerciseId,
          setNumber: input.setNumber,
          weightKg: input.weightKg ?? null,
          reps: input.reps ?? null,
          durationSec: input.durationSec ?? null,
          createdAt: Date.now(),
        });
        await refreshCount();
        return { queued: true };
      } catch (error) {
        // Dernier recours : on relance pour que l'UI puisse afficher l'erreur
        throw error;
      }
    },
    [isOnline, pendingCount, flushQueue, refreshCount],
  );

  return { saveSet, pendingCount, isOnline, flushQueue };
}

// Hook utilitaire pour récupérer les sets en attente d'une session
// donnée (pour merger avec les sets serveur au montage).
export function useSessionPendingSets(sessionId: string) {
  const [items, setItems] = useState<StoredSet[]>([]);

  useEffect(() => {
    let cancelled = false;
    getQueueForSession(sessionId)
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return items;
}
