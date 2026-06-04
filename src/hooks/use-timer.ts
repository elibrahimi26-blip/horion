"use client";

import { useEffect, useRef, useState } from "react";

// Chrono qui compte depuis une date de départ.
export function useElapsedSeconds(startedAt: Date | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));
}

// Minuteur de repos en compte à rebours.
export function useRestTimer() {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function start(seconds: number) {
    setRemaining(seconds);
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    setRemaining(0);
  }

  return { remaining, running, start, stop };
}

// Ré-export pour ne pas casser les imports existants ; canonique = lib/format.
export { formatDurationHMS as formatDuration } from "@/lib/format";
