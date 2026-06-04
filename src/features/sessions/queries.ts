import { db } from "@/lib/db";

export type LastSet = {
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
};

// Pour chaque exercice, renvoie le DERNIER set complété par cet utilisateur
// (toutes sessions confondues). Utilisé pour pré-remplir les inputs poids/reps
// lors d'une nouvelle séance — l'utilisateur n'a qu'à confirmer.
//
// Implémentation : Prisma distinct + orderBy id desc.
// Les cuids sont lexicographiquement triables par date de création, donc
// id desc = chronologique récent en premier. distinct prend le 1er par exerciseId.
export async function getLastSetsForExercises(
  userId: string,
  exerciseIds: string[],
): Promise<Record<string, LastSet>> {
  if (exerciseIds.length === 0) return {};

  const rows = await db.sessionSet.findMany({
    where: {
      exerciseId: { in: exerciseIds },
      completed: true,
      session: { userId },
    },
    distinct: ["exerciseId"],
    orderBy: { id: "desc" },
    select: {
      exerciseId: true,
      weightKg: true,
      reps: true,
      durationSec: true,
    },
  });

  return Object.fromEntries(
    rows.map((r) => [
      r.exerciseId,
      { weightKg: r.weightKg, reps: r.reps, durationSec: r.durationSec },
    ]),
  );
}

// N dernières séances terminées de l'utilisateur, dédupliquées par workoutId
// (1 entrée par workout — celle de la dernière séance). Utilisé par la
// section "Reprendre" du dashboard.
export async function getRecentlyUsedWorkouts(userId: string, limit = 3) {
  const sessions = await db.workoutSession.findMany({
    where: { userId, endedAt: { not: null } },
    distinct: ["workoutId"],
    orderBy: { endedAt: "desc" },
    take: limit,
    select: {
      id: true,
      endedAt: true,
      durationSec: true,
      workout: {
        select: {
          id: true,
          name: true,
          deletedAt: true,
        },
      },
    },
  });

  return sessions
    .filter((s) => s.workout.deletedAt === null)
    .map((s) => ({
      sessionId: s.id,
      workoutId: s.workout.id,
      workoutName: s.workout.name,
      endedAt: s.endedAt!,
      durationSec: s.durationSec,
    }));
}
