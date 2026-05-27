import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpProgress } from "@/components/shared/xp-progress";
import { UserAdminActions } from "@/components/admin/user-admin-actions";
import { listXpEvents, sumUserXp } from "@/features/xp/service";
import { XP_LABELS } from "@/features/xp/events";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      workouts: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          visibility: true,
          currentVersion: true,
          updatedAt: true,
          _count: { select: { sessions: true, likes: true, saves: true } },
        },
      },
      workoutSessions: {
        where: { endedAt: { not: null } },
        orderBy: { endedAt: "desc" },
        take: 10,
        select: {
          id: true,
          endedAt: true,
          durationSec: true,
          workout: { select: { id: true, name: true } },
        },
      },
      bodyWeights: {
        orderBy: { recordedAt: "desc" },
        take: 5,
        select: { id: true, weightKg: true, recordedAt: true },
      },
    },
  });

  if (!user) notFound();

  const [totalXp, xpEvents, workoutsTotal, sessionsTotal] = await Promise.all([
    sumUserXp(user.id),
    listXpEvents(user.id, 30),
    db.workout.count({ where: { authorId: user.id, deletedAt: null } }),
    db.workoutSession.count({
      where: { userId: user.id, endedAt: { not: null } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Liste des membres
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <LevelBadge totalXp={totalXp} size="lg" />
        <div className="flex-1 space-y-1">
          <h2 className="text-2xl font-bold">{user.username}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span
              className={cn(
                "rounded px-2 py-0.5",
                user.role === "ADMIN"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {user.role.toLowerCase()}
            </span>
            <span
              className={cn(
                "rounded px-2 py-0.5",
                user.status === "ACTIVE"
                  ? "bg-green-100 text-green-900"
                  : user.status === "PENDING"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-red-100 text-red-900",
              )}
            >
              {user.status.toLowerCase()}
            </span>
          </div>
        </div>
        <UserAdminActions
          userId={user.id}
          username={user.username}
          status={user.status}
          role={user.role}
          usernameLocked={user.usernameLocked || user.usernameChangesCount >= 2}
        />
      </div>

      {user.bio ? (
        <div className="rounded-md border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Bio
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{user.bio}</p>
        </div>
      ) : null}

      <div className="rounded-md border p-6">
        <XpProgress totalXp={totalXp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Inscrit" value={dateFmt.format(user.createdAt)} />
        <Stat
          label="Dernière connexion"
          value={
            user.lastLoginAt ? dateFmt.format(user.lastLoginAt) : "Jamais"
          }
        />
        <Stat label="Séances créées" value={String(workoutsTotal)} />
        <Stat label="Sessions terminées" value={String(sessionsTotal)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Séances récentes (10 dernières)
          </h3>
          {user.workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune séance.</p>
          ) : (
            <div className="space-y-2">
              {user.workouts.map((w) => (
                <Link
                  key={w.id}
                  href={`/workouts/${w.id}`}
                  className="block rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{w.name}</p>
                    <span className="text-xs text-muted-foreground">
                      v{w.currentVersion}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {w.visibility.toLowerCase()} ·{" "}
                    {w._count.sessions} session{w._count.sessions > 1 ? "s" : ""} ·{" "}
                    {w._count.likes} like{w._count.likes > 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Sessions récentes (10 dernières)
          </h3>
          {user.workoutSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune session terminée.
            </p>
          ) : (
            <div className="space-y-2">
              {user.workoutSessions.map((s) => (
                <div key={s.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{s.workout.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateTimeFmt.format(s.endedAt!)}
                    {s.durationSec
                      ? ` · ${Math.round(s.durationSec / 60)} min`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Historique XP (30 derniers)
          </h3>
          {xpEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun XP gagné.</p>
          ) : (
            <ul className="space-y-1">
              {xpEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span>{XP_LABELS[e.type]}</span>
                  <span className="flex gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {dateFmt.format(e.createdAt)}
                    </span>
                    <span className="font-medium text-primary tabular-nums">
                      +{e.amount}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Poids corporel (5 dernières mesures)
          </h3>
          {user.bodyWeights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune mesure enregistrée.
            </p>
          ) : (
            <ul className="space-y-1">
              {user.bodyWeights.map((bw) => (
                <li
                  key={bw.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span className="tabular-nums">{bw.weightKg} kg</span>
                  <span className="text-xs text-muted-foreground">
                    {dateFmt.format(bw.recordedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
