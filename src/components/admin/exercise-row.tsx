"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveExerciseAction,
  restoreExerciseAction,
  setExerciseNameFrAction,
  setExerciseVisibilityAction,
} from "@/features/exercises/actions";

type Props = {
  exercise: {
    id: string;
    name: string;
    nameFr: string | null;
    externalId: string | null;
    isCardio: boolean;
    isVisible: boolean;
    archivedAt: Date | null;
    imagePaths: string[];
    muscles: {
      isPrimary: boolean;
      muscleGroup: { id: string; slug: string; name: string };
    }[];
  };
};

function NameFrInput({
  exerciseId,
  initial,
}: {
  exerciseId: string;
  initial: string | null;
}) {
  const action = setExerciseNameFrAction.bind(null, exerciseId);
  const [, formAction] = useFormState(action, { status: "idle" });
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="text"
        name="nameFr"
        defaultValue={initial ?? ""}
        placeholder="Nom français…"
        className="w-48 rounded border px-2 py-1 text-sm"
        maxLength={80}
      />
      <NameFrSubmit />
    </form>
  );
}

function NameFrSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="ghost" disabled={pending}>
      {pending ? "…" : "FR"}
    </Button>
  );
}

export function ExerciseRow({ exercise }: Props) {
  const [pending, startTransition] = useTransition();

  const primary = exercise.muscles.find((m) => m.isPrimary)?.muscleGroup;
  const secondary = exercise.muscles
    .filter((m) => !m.isPrimary)
    .map((m) => m.muscleGroup.name);

  const thumbPath = exercise.imagePaths[0];
  const displayName = exercise.nameFr ?? exercise.name;
  const isImported = exercise.externalId !== null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
      <div className="flex items-center gap-3">
        {thumbPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/exercise-images/${thumbPath}`}
            alt=""
            className="h-12 w-12 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-muted" aria-hidden />
        )}

        <div className="space-y-1">
          <p className="font-medium">
            {displayName}
            {exercise.isCardio ? (
              <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
                cardio
              </span>
            ) : null}
            {isImported ? (
              <span className="ml-2 rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-900">
                yuhonas
              </span>
            ) : null}
            {!exercise.isVisible && !exercise.archivedAt ? (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                caché
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {exercise.nameFr ? (
              <span className="mr-2 italic">({exercise.name})</span>
            ) : null}
            {primary?.name ?? "Aucun muscle"}
            {secondary.length > 0 ? ` · ${secondary.join(", ")}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isImported && !exercise.archivedAt ? (
          <NameFrInput exerciseId={exercise.id} initial={exercise.nameFr} />
        ) : null}

        {!exercise.archivedAt ? (
          <Button
            size="sm"
            variant={exercise.isVisible ? "outline" : "default"}
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                setExerciseVisibilityAction(exercise.id, !exercise.isVisible),
              )
            }
          >
            {exercise.isVisible ? "Cacher" : "Activer"}
          </Button>
        ) : null}

        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/exercises/${exercise.id}`}>Éditer</Link>
        </Button>

        {exercise.archivedAt ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => restoreExerciseAction(exercise.id))}
          >
            Restaurer
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => archiveExerciseAction(exercise.id))}
          >
            Archiver
          </Button>
        )}
      </div>
    </div>
  );
}
