"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  useOfflineQueue,
  useSessionPendingSets,
} from "@/hooks/use-offline-queue";
import {
  formatDuration,
  useElapsedSeconds,
  useRestTimer,
} from "@/hooks/use-timer";
import {
  cancelSessionAction,
  endSessionAction,
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

type LastSet = {
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
};

type Props = {
  workout: { id: string; name: string };
  exercises: ExerciseLine[];
  sessionId: string;
  sessionStartedAt: string; // ISO string from server
  existingSets: ExistingSet[];
  lastSets: Record<string, LastSet>;
};

export function RunSession({
  workout,
  exercises,
  sessionId,
  sessionStartedAt,
  existingSets,
  lastSets,
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

  // Prédictions : valeurs serveur (dernière fois) + mises à jour au fur et
  // à mesure des séries validées dans la session courante.
  const [predictions, setPredictions] =
    useState<Record<string, LastSet>>(lastSets);

  useWakeLock(true);
  const elapsed = useElapsedSeconds(startedAt);
  const rest = useRestTimer();
  const { saveSet, pendingCount, isOnline } = useOfflineQueue();
  const queuedForSession = useSessionPendingSets(sessionId);

  // Merge des sets en queue (créés hors-ligne lors d'une précédente
  // visite) dans la map completed au montage.
  useEffect(() => {
    if (queuedForSession.length === 0) return;
    setCompleted((prev) => {
      const next = { ...prev };
      for (const q of queuedForSession) {
        const cur = next[q.exerciseId] ?? 0;
        if (q.setNumber > cur) next[q.exerciseId] = q.setNumber;
      }
      return next;
    });
  }, [queuedForSession]);

  const current = exercises[currentIdx];

  // Reset les inputs quand on change d'exercice : on pré-remplit avec
  // la prédiction (dernière performance), sinon avec la cible définie
  // dans le workout, sinon vide.
  useEffect(() => {
    if (!current) return;
    const pred = predictions[current.exerciseId];
    const predWeight = pred?.weightKg;
    const predRepsOrDuration = current.isCardio ? pred?.durationSec : pred?.reps;

    if (predWeight != null) {
      setWeightInput(String(predWeight));
    } else if (current.targetWeightKg !== null) {
      setWeightInput(String(current.targetWeightKg));
    } else {
      setWeightInput("");
    }

    setRepsInput(predRepsOrDuration != null ? String(predRepsOrDuration) : "");
    setSaveError(null);
    // On exclut volontairement `predictions` des deps : on ne veut pas
    // re-fill les inputs à chaque set validé, juste au changement d'exo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        await saveSet({
          sessionId,
          exerciseId: current.exerciseId,
          setNumber: nextSetNumber,
          weightKg,
          reps: current.isCardio ? null : repsOrDuration,
          durationSec: current.isCardio ? repsOrDuration : null,
        });

        // Avance le compteur que la série soit partie au serveur ou
        // mise en queue : dans les deux cas elle est durablement enregistrée.
        setCompleted({
          ...completed,
          [current.exerciseId]: nextSetNumber,
        });

        // Met à jour la prédiction avec la valeur qu'on vient de saisir
        // → la prochaine série du même exo (ou la prochaine séance) repartira
        // de cette valeur.
        setPredictions((prev) => ({
          ...prev,
          [current.exerciseId]: {
            weightKg,
            reps: current.isCardio ? null : repsOrDuration,
            durationSec: current.isCardio ? repsOrDuration : null,
          },
        }));

        if (current.restSeconds && nextSetNumber < current.targetSets) {
          rest.start(current.restSeconds);
        }
      } catch (e) {
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
        <div className="space-y-1">
          <h2 className="text-xl font-bold">{workout.name}</h2>
          <p className="text-sm tabular-nums text-muted-foreground">
            Session en cours · {formatDuration(elapsed)}
          </p>
          {!isOnline || pendingCount > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {!isOnline ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                  Hors-ligne — sauvegarde locale active
                </span>
              ) : null}
              {pendingCount > 0 ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                  {pendingCount} série{pendingCount > 1 ? "s" : ""} en attente de sync
                </span>
              ) : null}
            </div>
          ) : null}
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
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Série {nextSetNumber}</p>
              {(() => {
                const pred = predictions[current.exerciseId];
                if (!pred || pred.weightKg == null) return null;
                const rpd = current.isCardio ? pred.durationSec : pred.reps;
                const label = current.isCardio
                  ? `${pred.weightKg} kg · ${rpd ?? "?"} s`
                  : `${pred.weightKg} kg × ${rpd ?? "?"}`;
                return (
                  <span className="text-xs text-muted-foreground">
                    Dernière fois : <span className="font-medium">{label}</span>
                  </span>
                );
              })()}
            </div>

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
                  max={500}
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
                  min={1}
                  max={current.isCardio ? 7200 : 200}
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {saveError ? (
              <p className="text-xs text-destructive">{saveError}</p>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              disabled={pending || !repsInput.trim() || Number(repsInput) <= 0}
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
