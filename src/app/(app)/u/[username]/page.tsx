import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LevelBadge } from "@/components/shared/level-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SocialCard } from "@/components/social/social-card";
import { FollowButton } from "@/components/follows/follow-button";
import { MessageUserButton } from "@/components/messaging/message-user-button";
import { getFollowState } from "@/features/follows/queries";
import { sumUserXp } from "@/features/xp/service";
import { formatDateMonthYear } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      status: true,
      role: true,
    },
  });

  if (!user || user.status !== "ACTIVE") notFound();

  // Redirige vers /profile si c'est soi-même (UX naturelle).
  if (user.id === session.user.id) redirect("/profile");

  const [{ followersCount, followingCount, isFollowing }, totalXp, publicWorkouts] =
    await Promise.all([
      getFollowState(user.id, session.user.id),
      sumUserXp(user.id),
      db.workout.findMany({
        where: {
          authorId: user.id,
          visibility: "PUBLIC",
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: {
          author: { select: { id: true, username: true } },
          _count: { select: { likes: true, saves: true, sessions: true } },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { _count: { select: { exercises: true } } },
          },
          likes: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
          saves: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
        },
      }),
    ]);

  const workouts = publicWorkouts.map((w) => ({
    ...w,
    likedByMe: w.likes.length > 0,
    savedByMe: w.saves.length > 0,
  }));

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header profil */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold">{user.username}</h2>
              <LevelBadge totalXp={totalXp} size="sm" />
              {user.role === "ADMIN" ? (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                  admin
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Membre depuis {formatDateMonthYear(user.createdAt)}
            </p>
            {user.bio ? (
              <p className="pt-1 text-sm">{user.bio}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FollowButton
            targetUserId={user.id}
            isFollowing={isFollowing}
            size="default"
          />
          <MessageUserButton userId={user.id} label="Message" size="default" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
          <Link
            href={`/u/${user.username}/followers`}
            className="rounded-md p-2 transition-colors hover:bg-accent"
          >
            <p className="text-lg font-bold tabular-nums">{followersCount}</p>
            <p className="text-[10px] uppercase text-muted-foreground">
              follower{followersCount > 1 ? "s" : ""}
            </p>
          </Link>
          <Link
            href={`/u/${user.username}/following`}
            className="rounded-md p-2 transition-colors hover:bg-accent"
          >
            <p className="text-lg font-bold tabular-nums">{followingCount}</p>
            <p className="text-[10px] uppercase text-muted-foreground">
              abonnement{followingCount > 1 ? "s" : ""}
            </p>
          </Link>
          <div className="rounded-md p-2">
            <p className="text-lg font-bold tabular-nums">{workouts.length}</p>
            <p className="text-[10px] uppercase text-muted-foreground">
              séance{workouts.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Séances publiques */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Séances partagées
        </h3>
        {workouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-6 w-6" />}
            title="Aucune séance partagée"
            description={`${user.username} n'a pas encore partagé de séance publique.`}
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <SocialCard
                key={w.id}
                workout={w}
                currentUserId={session.user.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
