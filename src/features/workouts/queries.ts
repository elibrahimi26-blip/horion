import { db } from "@/lib/db";

// Liste des séances de l'utilisateur, avec compteurs et nb d'exos
// de la version courante.
export async function listMyWorkouts(userId: string) {
  return db.workout.findMany({
    where: { authorId: userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { sessions: true, likes: true, saves: true },
      },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          _count: { select: { exercises: true } },
        },
      },
    },
  });
}

export async function listSavedWorkouts(userId: string) {
  const saves = await db.workoutSave.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      workout: {
        include: {
          author: { select: { id: true, username: true } },
          _count: {
            select: { sessions: true, likes: true, saves: true },
          },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: {
              _count: { select: { exercises: true } },
            },
          },
        },
      },
    },
  });
  // Filtre côté JS les séances supprimées ou rendues privées
  return saves
    .map((s) => s.workout)
    .filter((w) => !w.deletedAt && w.visibility === "PUBLIC");
}

export async function getWorkoutWithCurrentVersion(
  workoutId: string,
  viewerId: string,
) {
  const workout = await db.workout.findUnique({
    where: { id: workoutId },
    include: {
      author: { select: { id: true, username: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
            include: {
              exercise: {
                include: {
                  muscles: { include: { muscleGroup: true } },
                },
              },
            },
          },
        },
      },
      _count: { select: { likes: true, saves: true } },
    },
  });

  if (!workout || workout.deletedAt) return null;

  const isAuthor = workout.authorId === viewerId;
  const isPublic = workout.visibility === "PUBLIC";

  if (!isAuthor && !isPublic) return null;

  return workout;
}

export type WorkoutListItem = Awaited<ReturnType<typeof listMyWorkouts>>[number];
