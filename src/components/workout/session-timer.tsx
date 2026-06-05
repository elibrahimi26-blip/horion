"use client";

import { Pause, Play } from "lucide-react";
import { formatDurationHMS } from "@/lib/format";
import { useSessionTimer } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";

type Props = {
  sessionId: string;
  startedAt: Date;
  onPausedChange?: (paused: boolean) => void;
};

// Barre sticky en haut de l'écran run avec le chrono total + pause.
// Expose isPaused via callback pour permettre au parent de pauser le timer
// de repos en synchro.
export function SessionTimer({ sessionId, startedAt, onPausedChange }: Props) {
  const timer = useSessionTimer(sessionId, startedAt);

  // Notify parent à chaque changement d'état (best-effort, pas critique).
  // Volontairement pas dans un useEffect pour éviter une dépendance circulaire.
  if (onPausedChange) {
    // appel direct : React batchera le render
    queueMicrotask(() => onPausedChange(timer.isPaused));
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-sm",
        timer.isPaused && "bg-amber-100/80 dark:bg-amber-950/30",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Séance
        </span>
        <span
          className={cn(
            "font-bold tabular-nums",
            timer.elapsedSec >= 3600 ? "text-lg" : "text-2xl",
            timer.isPaused && "text-muted-foreground",
          )}
        >
          {formatDurationHMS(timer.elapsedSec)}
        </span>
        {timer.isPaused ? (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100">
            En pause
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={timer.isPaused ? timer.resume : timer.pause}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
          timer.isPaused
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-foreground hover:bg-muted/70",
        )}
        aria-label={timer.isPaused ? "Reprendre la séance" : "Mettre en pause la séance"}
      >
        {timer.isPaused ? (
          <>
            <Play className="h-4 w-4" />
            Reprendre
          </>
        ) : (
          <>
            <Pause className="h-4 w-4" />
            Pause
          </>
        )}
      </button>
    </div>
  );
}
