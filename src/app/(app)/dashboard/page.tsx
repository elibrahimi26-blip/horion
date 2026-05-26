import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpProgress } from "@/components/shared/xp-progress";
import { sumUserXp } from "@/features/xp/service";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [totalXp, workoutsCount, sessionsCount, sessionsThisWeek] =
    await Promise.all([
      sumUserXp(userId),
      db.workout.count({ where: { authorId: userId, deletedAt: null } }),
      db.workoutSession.count({ where: { userId, endedAt: { not: null } } }),
      db.workoutSession.count({
        where: {
          userId,
          endedAt: {
            gte: startOfThisWeek(),
            not: null,
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <LevelBadge totalXp={totalXp} size="lg" />
        <div>
          <h2 className="text-2xl font-bold">
            Salut {session.user.name ?? ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Tableau de bord — vue rapide de ta progression.
          </p>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <XpProgress totalXp={totalXp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Séances créées" value={workoutsCount} href="/workouts" />
        <StatCard
          label="Sessions terminées"
          value={sessionsCount}
          href="/workouts"
        />
        <StatCard label="Cette semaine" value={sessionsThisWeek} />
      </div>

      <p className="text-sm text-muted-foreground">
        Le dashboard sera enrichi de graphiques (poids corporel, volume, streak,
        carte muscles) au Sprint 6.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="rounded-md border p-4 transition-colors hover:bg-accent">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function startOfThisWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const diff = day === 0 ? 6 : day - 1; // semaine commence lundi
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
