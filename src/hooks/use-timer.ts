"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ════════════════════════════════════════════════════════
// 1) Chrono total séance — pausable + persistant
// ════════════════════════════════════════════════════════

// État stocké en localStorage pour survivre aux refresh.
type SessionTimerStored = {
  pausedAt: number | null;        // timestamp de la pause en cours (null si en train de tourner)
  totalPausedMs: number;          // somme des durées de pause cumulées
};

function storageKey(sessionId: string): string {
  return `horion:timer:${sessionId}`;
}

function readStored(sessionId: string): SessionTimerStored {
  if (typeof window === "undefined") {
    return { pausedAt: null, totalPausedMs: 0 };
  }
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (!raw) return { pausedAt: null, totalPausedMs: 0 };
    const parsed = JSON.parse(raw) as SessionTimerStored;
    return {
      pausedAt: typeof parsed.pausedAt === "number" ? parsed.pausedAt : null,
      totalPausedMs: typeof parsed.totalPausedMs === "number" ? parsed.totalPausedMs : 0,
    };
  } catch {
    return { pausedAt: null, totalPausedMs: 0 };
  }
}

function writeStored(sessionId: string, value: SessionTimerStored) {
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(value));
  } catch {
    // ignore
  }
}

export type SessionTimer = {
  elapsedSec: number;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
};

// Chrono qui compte depuis startedAt avec pause possible.
// L'état pause est persisté en localStorage (clé par sessionId).
export function useSessionTimer(
  sessionId: string,
  startedAt: Date | null,
): SessionTimer {
  const [state, setState] = useState<SessionTimerStored>({
    pausedAt: null,
    totalPausedMs: 0,
  });
  const [now, setNow] = useState(() => Date.now());

  // Charger le state depuis localStorage au mount + à chaque sessionId change.
  useEffect(() => {
    setState(readStored(sessionId));
  }, [sessionId]);

  // Tick chaque seconde si non-paused.
  useEffect(() => {
    if (!startedAt) return;
    if (state.pausedAt !== null) return; // en pause → pas besoin de tick
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt, state.pausedAt]);

  const pause = useCallback(() => {
    setState((prev) => {
      if (prev.pausedAt !== null) return prev;
      const next = { ...prev, pausedAt: Date.now() };
      writeStored(sessionId, next);
      return next;
    });
  }, [sessionId]);

  const resume = useCallback(() => {
    setState((prev) => {
      if (prev.pausedAt === null) return prev;
      const addedPaused = Date.now() - prev.pausedAt;
      const next: SessionTimerStored = {
        pausedAt: null,
        totalPausedMs: prev.totalPausedMs + addedPaused,
      };
      writeStored(sessionId, next);
      return next;
    });
  }, [sessionId]);

  if (!startedAt) {
    return { elapsedSec: 0, isPaused: false, pause, resume };
  }

  const referenceNow = state.pausedAt !== null ? state.pausedAt : now;
  const elapsedMs = referenceNow - startedAt.getTime() - state.totalPausedMs;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));

  return {
    elapsedSec,
    isPaused: state.pausedAt !== null,
    pause,
    resume,
  };
}

// ════════════════════════════════════════════════════════
// 2) Timer de repos — compte à rebours configurable
// ════════════════════════════════════════════════════════

export type RestTimerState = "idle" | "running" | "paused" | "finished";

export type RestTimer = {
  remaining: number;
  initial: number;
  state: RestTimerState;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  adjust: (deltaSec: number) => void;
  stop: () => void;
};

type RestOptions = {
  onFinish?: () => void;
};

export function useRestTimer(opts: RestOptions = {}): RestTimer {
  const [remaining, setRemaining] = useState(0);
  const [initial, setInitial] = useState(0);
  const [state, setState] = useState<RestTimerState>("idle");
  const onFinishRef = useRef(opts.onFinish);
  onFinishRef.current = opts.onFinish;

  useEffect(() => {
    if (state !== "running") return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setState("finished");
          onFinishRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const start = useCallback((seconds: number) => {
    const s = Math.max(1, Math.floor(seconds));
    setInitial(s);
    setRemaining(s);
    setState("running");
  }, []);

  const pause = useCallback(() => {
    setState((s) => (s === "running" ? "paused" : s));
  }, []);

  const resume = useCallback(() => {
    setState((s) => (s === "paused" && remaining > 0 ? "running" : s));
  }, [remaining]);

  const reset = useCallback(() => {
    if (initial > 0) {
      setRemaining(initial);
      setState("running");
    }
  }, [initial]);

  const adjust = useCallback((deltaSec: number) => {
    setRemaining((r) => Math.max(0, r + deltaSec));
  }, []);

  const stop = useCallback(() => {
    setRemaining(0);
    setInitial(0);
    setState("idle");
  }, []);

  return { remaining, initial, state, start, pause, resume, reset, adjust, stop };
}

// ════════════════════════════════════════════════════════
// 3) Re-export du formatter pour ne pas casser les imports
// ════════════════════════════════════════════════════════

export { formatDurationHMS as formatDuration } from "@/lib/format";

// Compat legacy
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
