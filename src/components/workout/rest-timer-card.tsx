"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RestTimer as RestTimerHook } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";

type Props = {
  timer: RestTimerHook;
  defaultSeconds: number; // valeur par défaut si lancement manuel
};

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RestTimerCard({ timer, defaultSeconds }: Props) {
  const [flashing, setFlashing] = useState(false);

  // Flash visuel quand le timer arrive à 0.
  useEffect(() => {
    if (timer.state !== "finished") return;
    setFlashing(true);
    const id = setTimeout(() => setFlashing(false), 3000);
    return () => clearTimeout(id);
  }, [timer.state]);

  // État "idle" : bouton pour lancer manuellement.
  if (timer.state === "idle") {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => timer.start(defaultSeconds)}
      >
        <Play className="mr-2 h-4 w-4" />
        Démarrer un temps de pause ({Math.round(defaultSeconds / 60) || 1} min)
      </Button>
    );
  }

  const isFinished = timer.state === "finished";

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border-2 p-4 transition-colors duration-500",
        isFinished
          ? flashing
            ? "border-green-500 bg-green-500/20 animate-pulse"
            : "border-green-500 bg-green-50 dark:bg-green-950/20"
          : "border-primary bg-primary/5",
      )}
      role="timer"
      aria-live="polite"
    >
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Temps de pause
        </p>
        <p
          className={cn(
            "mt-1 text-5xl font-bold tabular-nums",
            isFinished && "text-green-600 dark:text-green-400",
          )}
        >
          {format(timer.remaining)}
        </p>
        {isFinished ? (
          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
            ✓ Repos terminé — c&apos;est reparti !
          </p>
        ) : null}
      </div>

      {!isFinished ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => timer.adjust(-30)}
              disabled={timer.remaining <= 30}
            >
              −30 s
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => timer.adjust(30)}
            >
              +30 s
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {timer.state === "running" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={timer.pause}
              >
                <Pause className="mr-1.5 h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={timer.resume}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Reprendre
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={timer.reset}
              aria-label="Réinitialiser"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={timer.stop}
              aria-label="Passer le repos"
            >
              <SkipForward className="mr-1.5 h-4 w-4" />
              Passer
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => timer.start(defaultSeconds)}
          >
            Relancer un repos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={timer.stop}
          >
            Masquer
          </Button>
        </div>
      )}
    </div>
  );
}
