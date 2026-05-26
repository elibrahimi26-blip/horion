import { db } from "@/lib/db";

const exerciseInclude = {
  muscles: {
    include: { muscleGroup: true },
  },
} as const;

export async function listExercisesForAdmin() {
  return db.exercise.findMany({
    orderBy: { name: "asc" },
    include: exerciseInclude,
  });
}

export async function listActiveExercises() {
  return db.exercise.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    include: exerciseInclude,
  });
}

export async function getExerciseById(id: string) {
  return db.exercise.findUnique({
    where: { id },
    include: exerciseInclude,
  });
}

export async function listMuscleGroups() {
  return db.muscleGroup.findMany({
    orderBy: [{ bodyPart: "asc" }, { name: "asc" }],
  });
}

export type ExerciseWithMuscles = Awaited<
  ReturnType<typeof listActiveExercises>
>[number];
