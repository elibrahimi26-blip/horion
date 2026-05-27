"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  type ExerciseFormState,
  initialExerciseState,
} from "@/features/exercises/state";

type MuscleGroup = {
  id: string;
  slug: string;
  name: string;
  bodyPart: string;
};

type ExerciseEditValue = {
  name: string;
  description: string | null;
  isCardio: boolean;
  estimatedSeconds: number | null;
  muscles: { muscleGroupId: string; isPrimary: boolean }[];
};

type Props = {
  muscleGroups: MuscleGroup[];
  exercise?: ExerciseEditValue;
  action: (
    prev: ExerciseFormState,
    formData: FormData,
  ) => Promise<ExerciseFormState>;
  submitLabel: string;
};

export function ExerciseForm({
  muscleGroups,
  exercise,
  action,
  submitLabel,
}: Props) {
  const [state, formAction] = useFormState(action, initialExerciseState);

  const selectedMuscleIds = new Set(
    exercise?.muscles.map((m) => m.muscleGroupId) ?? [],
  );
  const primaryId = exercise?.muscles.find((m) => m.isPrimary)?.muscleGroupId;

  const upper = muscleGroups.filter((m) => m.bodyPart === "upper");
  const core = muscleGroups.filter((m) => m.bodyPart === "core");
  const lower = muscleGroups.filter((m) => m.bodyPart === "lower");

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={exercise?.name}
          maxLength={80}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={exercise?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimatedSeconds">
            Durée estimée (sec, optionnel)
          </Label>
          <Input
            id="estimatedSeconds"
            name="estimatedSeconds"
            type="number"
            min={0}
            defaultValue={exercise?.estimatedSeconds ?? ""}
          />
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            name="isCardio"
            defaultChecked={exercise?.isCardio}
            className="h-4 w-4"
          />
          <span className="text-sm">Exercice cardio</span>
        </label>
      </div>

      <div className="space-y-2">
        <Label>Muscles ciblés *</Label>
        <p className="text-xs text-muted-foreground">
          Coche les muscles travaillés et sélectionne le muscle principal (radio
          à droite).
        </p>
        <div className="grid gap-6 rounded-md border p-4 sm:grid-cols-3">
          <MuscleColumn
            title="Haut du corps"
            muscles={upper}
            selected={selectedMuscleIds}
            primaryId={primaryId}
          />
          <MuscleColumn
            title="Tronc"
            muscles={core}
            selected={selectedMuscleIds}
            primaryId={primaryId}
          />
          <MuscleColumn
            title="Bas du corps"
            muscles={lower}
            selected={selectedMuscleIds}
            primaryId={primaryId}
          />
        </div>
        {state.fieldErrors?.muscles?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.muscles[0]}
          </p>
        ) : null}
      </div>

      {state.status === "error" && state.error && !state.fieldErrors ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <SubmitButton className="" pendingText="Enregistrement…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

function MuscleColumn({
  title,
  muscles,
  selected,
  primaryId,
}: {
  title: string;
  muscles: MuscleGroup[];
  selected: Set<string>;
  primaryId?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">
        {muscles.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <label className="flex flex-1 items-center gap-2">
              <input
                type="checkbox"
                name="muscleIds"
                value={m.id}
                defaultChecked={selected.has(m.id)}
                className="h-4 w-4"
              />
              {m.name}
            </label>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="radio"
                name="primaryMuscleId"
                value={m.id}
                defaultChecked={primaryId === m.id}
                className="h-3 w-3"
              />
              <span>princ.</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
