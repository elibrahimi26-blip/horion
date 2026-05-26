"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  archiveExerciseAction,
  restoreExerciseAction,
} from "@/features/exercises/actions";

type Props = {
  exercise: {
    id: string;
    name: string;
    isCardio: boolean;
    archivedAt: Date | null;
    muscles: {
      isPrimary: boolean;
      muscleGroup: { id: string; slug: string; name: string };
    }[];
  };
};

export function ExerciseRow({ exercise }: Props) {
  const [pending, startTransition] = useTransition();

  const primary = exercise.muscles.find((m) => m.isPrimary)?.muscleGroup;
  const secondary = exercise.muscles
    .filter((m) => !m.isPrimary)
    .map((m) => m.muscleGroup.name);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
      <div className="space-y-1">
        <p className="font-medium">
          {exercise.name}
          {exercise.isCardio ? (
            <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
              cardio
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {primary?.name ?? "Aucun muscle"}
          {secondary.length > 0 ? ` · ${secondary.join(", ")}` : ""}
        </p>
      </div>

      <div className="flex gap-2">
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
