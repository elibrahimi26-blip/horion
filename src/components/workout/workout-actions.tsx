"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteWorkoutAction,
  setWorkoutVisibilityAction,
} from "@/features/workouts/actions";

type Props = {
  workoutId: string;
  currentVisibility: "PRIVATE" | "PUBLIC";
};

export function WorkoutActions({ workoutId, currentVisibility }: Props) {
  const [pending, startTransition] = useTransition();

  const toggleVisibility = () => {
    const next = currentVisibility === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    startTransition(() => setWorkoutVisibilityAction(workoutId, next));
  };

  const onDelete = () => {
    if (
      !confirm(
        "Supprimer cette séance ? L'historique des sessions effectuées est préservé.",
      )
    ) {
      return;
    }
    startTransition(() => deleteWorkoutAction(workoutId));
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={toggleVisibility}
      >
        {currentVisibility === "PRIVATE" ? "Rendre publique" : "Rendre privée"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={onDelete}
      >
        Supprimer
      </Button>
    </>
  );
}
