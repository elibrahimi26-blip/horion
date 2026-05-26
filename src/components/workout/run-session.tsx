"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  formatDuration,
  useElapsedSeconds,
  useRestTimer,
} from "@/hooks/use-timer";
import {
  cancelSessionAction,
  endSessionAction,
  saveSetAction,
} from "@/features/sessions/actions";

type ExerciseLine = {
  id: string;
  exerciseId: string;
  name: string;
  isCardio: boolean;
  targetSets: number;
  targetReps: string | null;
  targetWeightKg: number | null;
  restSeconds: number | null;
  notes: string | null;
};

type ExistingSet = {
  exerciseId: string;
  setNumber: number;
};

type Props = {
  workout: { id: string; name: string };
  exercises: ExerciseLine[];
  sessionId: string;
  sessionStartedAt: string; // ISO string from server
  existingSets: ExistingSet[];
};

export function RunSession({
  workout,
  exercises,
  sessionId,
  sessionStartedAt,
  existingSets,
}: Props) {
  const router = useRouter();
  const startedAt = new Date(sessionStartedAt);

  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const s of existingSets) {
      const prev = map[s.exerciseId] ?? 0;
      if (s.setNumber > prev) map[s.exerciseId] = s.setNumber;
    }
    return map;
  });

  const findFirstIncomplete = () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]!;
      const done = completed[ex.exerciseId] ?? 0;
      if (done < ex.targetSets) return i;
    }
    return Math.max(0, exercises.length - 1);
  };

  const [currentIdx, setCurrentIdx] = useState(findFirstIncomplete());
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [endNotes, setEndNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useWakeLock(true);
  const elapsed = useElapsedSeconds(startedAt);
  const rest = useRestTimer();

  const current = exercises[currentIdx];

  // Reset les inputs quand on change d'exercice
  useEffect(() => {
    if (!current) return;
    setWeightInput(
      current.targetWeightKg !== null ? String(current.targetWeightKg) : "",
    );
    setRepsInput("");
    setSaveError(null);
  }, [currentIdx, current?.targetWeightKg]);

  if (!current) {
    return <p className="text-sm text-muted-foreground">Aucun exercice.</p>;
  }

  const doneSets = completed[current.exerciseId] ?? 0;
  const nextSetNumber = doneSets + 1;
  const isExerciseDone = doneSets >= current.targetSets;
  const allDone = exercises.every(
    (ex) => (completed[ex.exerciseId] ?? 0) >= ex.targetSets,
  );

  function validateSet() {
    if (!current) return;
    const weightKg = weightInput.trim() ? Number(weightInput) : null;
    const repsOrDuration = repsInput.trim() ? Number(repsInput) : null;

    setSaveError(null);

    startTransition(async () => {
      try {
        await saveSetAction({
          sessionId,
          exerciseId: current.exerciseId,
          setNumber: nextSetNumber,
          weightKg,
          reps: current.isCardio ? null : repsOrDuration,
          durationSec: current.isCardio ? repsOrDuration : null,
        });

        setCompleted({
          ...completed,
          [current.exerciseId]: nextSetNumber,
        });

        // Démarre le repos si défini et qu'il reste des séries
        if (current.restSeconds && nextSetNumber < current.targetSets) {
          rest.start(current.restSeconds);
        }
      } catch (e) {
        // TODO commit 3 : offline queue (IndexedDB) au lieu d'erreur visible
        const msg = e instanceof Error ? e.message : "Erreur d'enregistrement";
        setSaveError(`${msg} — réessaie dans un instant.`);
      }
    });
  }

  function goToExercise(idx: number) {
    setCurrentIdx(idx);
    rest.stop();
  }

  function endSession() {
    if (!confirm("Terminer la séance ?")) return;
    startTransition(async () => {
      await endSessionAction(sessionId, endNotes.trim() || null);
      router.push(`/workouts/${workout.id}`);
    });
  }

  function cancelSession() {
    if (
      !confirm(
        "Annuler la séance ? Toutes les séries déjà enregistrées seront supprimées.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      await cancelSessionAction(sessionId);
      router.push(`/workouts/${workout.id}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{workout.name}</h2>
          <p className="text-sm tabular-nums text-muted-foreground">
            Session en cours · {formatDuration(elapsed)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={cancelSession}
          >
            Annuler
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={endSession}
          >
            Terminer
          </Button>
        </div>
      </div>

      {/* Rest timer */}
      {rest.running ? (
        <div className="rounded-md border-2 border-primary bg-primary/5 p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground">Repos</p>
          <p className="text-5xl font-bold tabular-nums">{rest.remaining}s</p>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={rest.stop}
          >
            Passer le repos
          </Button>
        </div>
      ) : null}

      {/* Current exercise */}
      <div className="space-y-4 rounded-md border p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">
              Exercice {currentIdx + 1} / {exercises.length}
            </p>
            <h3 className="text-2xl font-bold">{current.name}</h3>
            {current.isCardio ? (
              <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
                cardio
              </span>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="font-medium tabular-nums">
              {doneSets} / {current.targetSets} séries
            </p>
            <p className="text-xs text-muted-foreground">
              Cible : {current.targetReps ?? "—"}
              {current.targetWeightKg !== null
                ? ` @ ${current.targetWeightKg} kg`
                : ""}
            </p>
          </div>
        </div>

        {current.notes ? (
          <p className="text-xs italic text-muted-foreground">{current.notes}</p>
        ) : null}

        {!isExerciseDone ? (
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Série {nextSetNumber}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="weight" className="text-xs">
                  Poids (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.5"
                  min={0}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reps" className="text-xs">
                  {current.isCardio ? "Durée (sec)" : "Reps"}
                </Label>
                <Input
                  id="reps"
                  type="number"
                  min={0}
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>

            {saveError ? (
              <p className="text-xs text-destructive">{saveError}</p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={pending}
              onClick={validateSet}
            >
              {pending ? "Enregistrement…" : "Série terminée"}
            </Button>
          </div>
        ) : (
          <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-900">
            ✓ Toutes les séries de cet exercice sont validées.
          </div>
        )}
      </div>

      {/* Nav prev/next */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === 0 || pending}
          onClick={() => goToExercise(currentIdx - 1)}
        >
          ← Précédent
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIdx === exercises.length - 1 || pending}
          onClick={() => goToExercise(currentIdx + 1)}
        >
          Suivant →
        </Button>
      </div>

      {/* Progress overview */}
      <div className="space-y-2 rounded-md border p-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Progression
        </p>
        <div className="space-y-1">
          {exercises.map((ex, i) => {
            const done = completed[ex.exerciseId] ?? 0;
            const isCurrent = i === currentIdx;
            const isComplete = done >= ex.targetSets;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => goToExercise(i)}
                className={
                  "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors " +
                  (isCurrent
                    ? "bg-accent font-medium"
                    : "hover:bg-accent/50")
                }
              >
                <span>
                  {i + 1}. {ex.name}
                </span>
                <span
                  className={
                    isComplete
                      ? "tabular-nums text-green-600"
                      : "tabular-nums text-muted-foreground"
                  }
                >
                  {done}/{ex.targetSets}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* End session block */}
      {allDone ? (
        <div className="space-y-3 rounded-md border-2 border-green-200 bg-green-50/40 p-4">
          <p className="text-sm font-medium text-green-900">
            ✓ Tous les exercices sont terminés. Bonne séance !
          </p>
          <Textarea
            placeholder="Notes sur cette séance (optionnel)…"
            value={endNotes}
            onChange={(e) => setEndNotes(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <Button
            className="w-full"
            size="lg"
            disabled={pending}
            onClick={endSession}
          >
            {pending ? "Enregistrement…" : "Terminer et enregistrer"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
