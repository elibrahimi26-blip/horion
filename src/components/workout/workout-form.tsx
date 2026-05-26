"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  initialWorkoutState,
  type WorkoutFormState,
} from "@/features/workouts/actions";

type ExerciseOption = {
  id: string;
  name: string;
  isCardio: boolean;
};

export type WorkoutExerciseLine = {
  exerciseId: string;
  exerciseName: string;
  isCardio: boolean;
  targetSets: number;
  targetReps: string;
  targetWeightKg: string;
  restSeconds: string;
  notes: string;
};

type Props = {
  exercises: ExerciseOption[];
  initialValues?: {
    name: string;
    description: string;
    visibility: "PRIVATE" | "PUBLIC";
    lines: WorkoutExerciseLine[];
  };
  action: (
    prev: WorkoutFormState,
    formData: FormData,
  ) => Promise<WorkoutFormState>;
  submitLabel: string;
};

export function WorkoutForm({
  exercises,
  initialValues,
  action,
  submitLabel,
}: Props) {
  const [state, formAction] = useFormState(action, initialWorkoutState);

  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">(
    initialValues?.visibility ?? "PRIVATE",
  );
  const [lines, setLines] = useState<WorkoutExerciseLine[]>(
    initialValues?.lines ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState("");

  function addExercise() {
    const ex = exercises.find((e) => e.id === pickerSelection);
    if (!ex) return;
    setLines([
      ...lines,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        isCardio: ex.isCardio,
        targetSets: 3,
        targetReps: "",
        targetWeightKg: "",
        restSeconds: "",
        notes: "",
      },
    ]);
    setPickerSelection("");
    setPickerOpen(false);
  }

  function updateLine(idx: number, patch: Partial<WorkoutExerciseLine>) {
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function moveLine(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= lines.length) return;
    const arr = [...lines];
    const a = arr[idx];
    const b = arr[next];
    if (!a || !b) return;
    arr[idx] = b;
    arr[next] = a;
    setLines(arr);
  }

  const serialized = lines.map((l, i) => ({
    exerciseId: l.exerciseId,
    orderIndex: i,
    targetSets: l.targetSets,
    targetReps: l.targetReps.trim() || null,
    targetWeightKg: l.targetWeightKg.trim() ? Number(l.targetWeightKg) : null,
    restSeconds: l.restSeconds.trim() ? Number(l.restSeconds) : null,
    notes: l.notes.trim() || null,
  }));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="exercises" value={JSON.stringify(serialized)} />

      <div className="space-y-2">
        <Label htmlFor="name">Nom de la séance *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initialValues?.name}
          maxLength={80}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optionnel)</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          maxLength={2000}
          defaultValue={initialValues?.description}
        />
      </div>

      <div className="space-y-2">
        <Label>Visibilité</Label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="PRIVATE"
              checked={visibility === "PRIVATE"}
              onChange={() => setVisibility("PRIVATE")}
              className="h-4 w-4"
            />
            Privée (seulement toi)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="PUBLIC"
              checked={visibility === "PUBLIC"}
              onChange={() => setVisibility("PUBLIC")}
              className="h-4 w-4"
            />
            Publique (dans le flux social)
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercices *</Label>
          {!pickerOpen ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPickerOpen(true)}
            >
              + Ajouter
            </Button>
          ) : null}
        </div>

        {pickerOpen ? (
          <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-3">
            <select
              value={pickerSelection}
              onChange={(e) => setPickerSelection(e.target.value)}
              className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              aria-label="Choisir un exercice"
            >
              <option value="">— Choisir un exercice —</option>
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                  {ex.isCardio ? " (cardio)" : ""}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              onClick={addExercise}
              disabled={!pickerSelection}
            >
              Ajouter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setPickerOpen(false);
                setPickerSelection("");
              }}
            >
              Annuler
            </Button>
          </div>
        ) : null}

        {lines.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun exercice. Clique sur « + Ajouter » pour en ajouter.
          </p>
        ) : (
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <ExerciseLine
                key={`${line.exerciseId}-${idx}`}
                line={line}
                index={idx}
                total={lines.length}
                onChange={(patch) => updateLine(idx, patch)}
                onRemove={() => removeLine(idx)}
                onMove={(dir) => moveLine(idx, dir)}
              />
            ))}
          </div>
        )}

        {state.fieldErrors?.exercises?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.exercises[0]}
          </p>
        ) : null}
      </div>

      {state.status === "error" && state.error && !state.fieldErrors ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <SubmitButton className="" pendingText="Enregistrement…">
          {submitLabel}
        </SubmitButton>
        <Button type="button" variant="ghost" asChild>
          <Link href="/workouts">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}

function ExerciseLine({
  line,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  line: WorkoutExerciseLine;
  index: number;
  total: number;
  onChange: (patch: Partial<WorkoutExerciseLine>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium">
          {index + 1}. {line.exerciseName}
          {line.isCardio ? (
            <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
              cardio
            </span>
          ) : null}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Monter"
          >
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Descendre"
          >
            ↓
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Supprimer"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Séries</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={line.targetSets}
            onChange={(e) =>
              onChange({ targetSets: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reps</Label>
          <Input
            type="text"
            placeholder={line.isCardio ? "—" : "8-12"}
            value={line.targetReps}
            onChange={(e) => onChange({ targetReps: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Poids (kg)</Label>
          <Input
            type="number"
            step="0.5"
            min={0}
            value={line.targetWeightKg}
            onChange={(e) => onChange({ targetWeightKg: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Repos (sec)</Label>
          <Input
            type="number"
            min={0}
            max={900}
            value={line.restSeconds}
            onChange={(e) => onChange({ restSeconds: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <Label className="text-xs">Notes</Label>
        <Input
          type="text"
          placeholder="Notes pour cet exercice…"
          value={line.notes}
          maxLength={500}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
