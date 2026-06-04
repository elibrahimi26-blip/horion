import { db } from "@/lib/db";

export const SOCIAL_PAGE_SIZE = 20;

export async function listPublicWorkouts(
  viewerId: string,
  { take = SOCIAL_PAGE_SIZE, cursor }: { take?: number; cursor?: string } = {},
) {
  const workouts = await db.workout.findMany({
    where: { visibility: "PUBLIC", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: take + 1, // +1 pour détecter s'il reste une page
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

  const hasMore = workouts.length > take;
  const items = hasMore ? workouts.slice(0, take) : workouts;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return {
    items: items.map((w) => ({
      ...w,
      likedByMe: w.likes.length > 0,
      savedByMe: w.saves.length > 0,
    })),
    nextCursor,
  };
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
>["items"][number];
