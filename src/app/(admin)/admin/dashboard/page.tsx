import Link from "next/link";
import { db } from "@/lib/db";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    pendingCount,
    activeCount,
    suspendedCount,
    totalCount,
    sessionsTotal,
    sessionsThisMonth,
    workoutsTotal,
    openTickets,
    totalLikes,
    recentMembers,
    recentSessions,
    topMembers,
  ] = await Promise.all([
    db.user.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "SUSPENDED" } }),
    db.user.count(),
    db.workoutSession.count({ where: { endedAt: { not: null } } }),
    db.workoutSession.count({
      where: { endedAt: { not: null, gte: startOfMonth } },
    }),
    db.workout.count({ where: { deletedAt: null } }),
    db.supportThread.count({ where: { status: "OPEN" } }),
    db.workoutLike.count(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        username: true,
        status: true,
        createdAt: true,
      },
    }),
    db.workoutSession.findMany({
      where: { endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      take: 5,
      select: {
        id: true,
        endedAt: true,
        user: { select: { id: true, username: true } },
        workout: { select: { name: true } },
      },
    }),
    db.workoutSession.groupBy({
      by: ["userId"],
      where: { endedAt: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const topMemberUsers = topMembers.length
    ? await db.user.findMany({
        where: { id: { in: topMembers.map((t) => t.userId) } },
        select: { id: true, username: true },
      })
    : [];
  const userById = new Map(topMemberUsers.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard admin</h2>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Membres
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="En attente"
            value={pendingCount}
            variant={pendingCount > 0 ? "warn" : "default"}
            href="/admin/users"
          />
          <StatCard label="Actifs" value={activeCount} href="/admin/users" />
          <StatCard
            label="Suspendus"
            value={suspendedCount}
            href="/admin/users"
          />
          <StatCard label="Total" value={totalCount} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Activité
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Sessions totales" value={sessionsTotal} />
          <StatCard label="Sessions ce mois" value={sessionsThisMonth} />
          <StatCard label="Séances créées" value={workoutsTotal} />
          <StatCard label="Likes au total" value={totalLikes} />
        </div>
      </section>

      <div className="space-y-2">
        {openTickets > 0 ? (
          <Link
            href="/admin/support"
            className="block rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100"
          >
            <span className="font-medium">
              {openTickets} ticket{openTickets > 1 ? "s" : ""} de support
            </span>{" "}
            ouvert{openTickets > 1 ? "s" : ""} — à traiter.
          </Link>
        ) : null}

        {pendingCount > 0 ? (
          <Link
            href="/admin/users"
            className="block rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100"
          >
            <span className="font-medium">
              {pendingCount} demande{pendingCount > 1 ? "s" : ""} d&apos;inscription
            </span>{" "}
            en attente de validation.
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Inscriptions récentes
          </h3>
          {recentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inscription.</p>
          ) : (
            <div className="space-y-2">
              {recentMembers.map((m) => (
                <Link
                  key={m.id}
                  href={`/admin/users/${m.id}`}
                  className="block rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{m.username}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.status.toLowerCase()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Sessions récentes
          </h3>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune session terminée.
            </p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <Link
                        href={`/admin/users/${s.user.id}`}
                        className="font-medium hover:underline"
                      >
                        {s.user.username}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        → {s.workout.name}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(s.endedAt!)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Top membres (par sessions terminées)
        </h3>
        {topMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun classement encore.
          </p>
        ) : (
          <ol className="space-y-2">
            {topMembers.map((t, i) => {
              const u = userById.get(t.userId);
              if (!u) return null;
              return (
                <li
                  key={t.userId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-xs font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {u.username}
                    </Link>
                  </div>
                  <span className="text-sm tabular-nums">
                    {t._count.id} session{t._count.id > 1 ? "s" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  variant = "default",
}: {
  label: string;
  value: number;
  href?: string;
  variant?: "default" | "warn";
}) {
  const content = (
    <div
      className={cn(
        "rounded-md border p-4 transition-colors",
        href ? "hover:bg-accent" : "",
        variant === "warn" && value > 0
          ? "border-amber-200 bg-amber-50"
          : "",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
