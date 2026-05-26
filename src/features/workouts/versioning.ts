import { db } from "@/lib/db";
import type { WorkoutFormInput } from "./schemas";

function exerciseCreatePayload(input: WorkoutFormInput["exercises"]) {
  return input.map((ex, i) => ({
    exerciseId: ex.exerciseId,
    orderIndex: i,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps ?? null,
    targetWeightKg: ex.targetWeightKg ?? null,
    restSeconds: ex.restSeconds ?? null,
    notes: ex.notes ?? null,
  }));
}

export async function createWorkout(authorId: string, input: WorkoutFormInput) {
  return db.workout.create({
    data: {
      authorId,
      name: input.name,
      description: input.description ?? null,
      visibility: input.visibility,
      currentVersion: 1,
      versions: {
        create: {
          version: 1,
          name: input.name,
          exercises: { create: exerciseCreatePayload(input.exercises) },
        },
      },
    },
    select: { id: true },
  });
}

// Édition d'une séance : crée une nouvelle version. Les sessions
// existantes pointent toujours vers les versions antérieures → l'historique
// des stats reste intact.
export async function updateWorkoutWithNewVersion(
  workoutId: string,
  authorId: string,
  input: WorkoutFormInput,
) {
  return db.$transaction(async (tx) => {
    const current = await tx.workout.findFirst({
      where: { id: workoutId, authorId, deletedAt: null },
      select: { currentVersion: true },
    });
    if (!current) {
      throw new Error("Workout not found or access denied");
    }

    const newVersion = current.currentVersion + 1;

    await tx.workoutVersion.create({
      data: {
        workoutId,
        version: newVersion,
        name: input.name,
        exercises: { create: exerciseCreatePayload(input.exercises) },
      },
    });

    await tx.workout.update({
      where: { id: workoutId },
      data: {
        name: input.name,
        description: input.description ?? null,
        visibility: input.visibility,
        currentVersion: newVersion,
      },
    });
  });
}
