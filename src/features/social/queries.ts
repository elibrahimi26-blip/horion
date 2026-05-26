import { db } from "@/lib/db";

export async function listPublicWorkouts(viewerId: string) {
  const workouts = await db.workout.findMany({
    where: { visibility: "PUBLIC", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, username: true } },
      _count: { select: { likes: true, saves: true, sessions: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { _count: { select: { exercises: true } } },
      },
      likes: {
        where: { userId: viewerId },
        select: { userId: true },
      },
      saves: {
        where: { userId: viewerId },
        select: { userId: true },
      },
    },
  });

  return workouts.map((w) => ({
    ...w,
    likedByMe: w.likes.length > 0,
    savedByMe: w.saves.length > 0,
  }));
}

export async function getWorkoutSocialState(
  workoutId: string,
  viewerId: string,
) {
  const [likeCount, saveCount, myLike, mySave] = await Promise.all([
    db.workoutLike.count({ where: { workoutId } }),
    db.workoutSave.count({ where: { workoutId } }),
    db.workoutLike.findUnique({
      where: { workoutId_userId: { workoutId, userId: viewerId } },
      select: { userId: true },
    }),
    db.workoutSave.findUnique({
      where: { workoutId_userId: { workoutId, userId: viewerId } },
      select: { userId: true },
    }),
  ]);

  return {
    likeCount,
    saveCount,
    likedByMe: !!myLike,
    savedByMe: !!mySave,
  };
}

export type PublicWorkoutCard = Awaited<
  ReturnType<typeof listPublicWorkouts>
>[number];
