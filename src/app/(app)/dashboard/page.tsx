import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpProgress } from "@/components/shared/xp-progress";
import { StreakCard } from "@/components/dashboard/streak-card";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { WeightInput } from "@/components/dashboard/weight-input";
import { sumUserXp } from "@/features/xp/service";
import {
  getMuscleVolume,
  getSessionsCounts,
  getStreak,
  getWeeklyVolume,
} from "@/features/stats/queries";
import {
  latestBodyWeight,
  listBodyWeights,
} from "@/features/body-weight/queries";

const MUSCLE_WINDOW_DAYS = 28;
const WEIGHT_LOOKBACK_DAYS = 180;

const dateShortFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [
    totalXp,
    workoutsCount,
    sessions,
    streak,
    weeklyVolume,
    muscleVolume,
    weightEntries,
    lastWeight,
  ] = await Promise.all([
    sumUserXp(userId),
    db.workout.count({ where: { authorId: userId, deletedAt: null } }),
    getSessionsCounts(userId),
    getStreak(userId),
    getWeeklyVolume(userId, 8),
    getMuscleVolume(userId, MUSCLE_WINDOW_DAYS),
    listBodyWeights(userId, WEIGHT_LOOKBACK_DAYS),
    latestBodyWeight(userId),
  ]);

  const weightChartData = weightEntries.map((e) => ({
    label: dateShortFmt.format(e.recordedAt),
    weightKg: e.weightKg,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <LevelBadge totalXp={totalXp} size="lg" />
        <div>
          <h2 className="text-2xl font-bold">
            Salut {session.user.name ?? ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Tableau de bord — ta progression en un coup d&apos;œil.
          </p>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <XpProgress totalXp={totalXp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Séances créées"
          value={workoutsCount}
          href="/workouts"
        />
        <StatCard
          label="Sessions totales"
          value={sessions.total}
          href="/workouts"
        />
        <StatCard label="Cette semaine" value={sessions.thisWeek} />
        <StreakCard streak={streak} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Poids corporel
            </h3>
            {lastWeight ? (
              <p className="text-sm font-medium tabular-nums">
                {lastWeight.weightKg} kg
              </p>
            ) : null}
          </div>
          <WeightChart data={weightChartData} />
          <WeightInput latestKg={lastWeight?.weightKg ?? null} />
        </div>

        <div className="space-y-3 rounded-md border p-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Volume hebdo (8 dernières semaines)
          </h3>
          <VolumeChart data={weeklyVolume} />
          <p className="text-xs text-muted-foreground">
            Volume = somme de (poids × reps) sur toutes les séries terminées.
          </p>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <MuscleHeatmap data={muscleVolume} windowDays={MUSCLE_WINDOW_DAYS} />
      </div>
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
