import { db } from "@/lib/db";

// État de follow entre viewer et target + compteurs publics du target.
// viewerId optionnel : si non fourni, isFollowing = false (visiteur).
export async function getFollowState(targetId: string, viewerId?: string) {
  const [followersCount, followingCount, isFollowing] = await Promise.all([
    db.follow.count({ where: { followingId: targetId } }),
    db.follow.count({ where: { followerId: targetId } }),
    viewerId && viewerId !== targetId
      ? db.follow
          .findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: targetId,
              },
            },
            select: { followerId: true },
          })
          .then((r) => Boolean(r))
      : Promise.resolve(false),
  ]);

  return { followersCount, followingCount, isFollowing };
}

// Compteurs uniquement (plus rapide quand on n'a pas besoin de l'état viewer).
export async function getFollowCounts(targetId: string) {
  const [followersCount, followingCount] = await Promise.all([
    db.follow.count({ where: { followingId: targetId } }),
    db.follow.count({ where: { followerId: targetId } }),
  ]);
  return { followersCount, followingCount };
}

// Liste des followers d'un user.
export async function listFollowers(targetId: string, viewerId?: string) {
  const follows = await db.follow.findMany({
    where: { followingId: targetId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      follower: {
        select: { id: true, username: true, avatarUrl: true, bio: true },
      },
    },
  });

  if (!viewerId) {
    return follows.map((f) => ({ ...f.follower, isFollowedByViewer: false }));
  }

  // État de follow du viewer vers chacun de ces followers
  const viewerFollows = await db.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: follows.map((f) => f.follower.id) },
    },
    select: { followingId: true },
  });
  const set = new Set(viewerFollows.map((f) => f.followingId));

  return follows.map((f) => ({
    ...f.follower,
    isFollowedByViewer: set.has(f.follower.id),
  }));
}

// Liste des comptes qu'un user suit.
export async function listFollowing(targetId: string, viewerId?: string) {
  const follows = await db.follow.findMany({
    where: { followerId: targetId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      createdAt: true,
      following: {
        select: { id: true, username: true, avatarUrl: true, bio: true },
      },
    },
  });

  if (!viewerId) {
    return follows.map((f) => ({ ...f.following, isFollowedByViewer: false }));
  }

  const viewerFollows = await db.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: follows.map((f) => f.following.id) },
    },
    select: { followingId: true },
  });
  const set = new Set(viewerFollows.map((f) => f.followingId));

  return follows.map((f) => ({
    ...f.following,
    isFollowedByViewer: set.has(f.following.id),
  }));
}
