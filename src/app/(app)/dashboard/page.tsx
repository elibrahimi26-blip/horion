import Link from "next/link";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { XpProgress } from "@/components/shared/xp-progress";
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
import { cn } from "@/lib/utils";

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

  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oldEntry = weightEntries.find((e) => e.recordedAt.getTime() <= monthAgo);
  const delta30d =
    lastWeight && oldEntry
      ? Math.round((lastWeight.weightKg - oldEntry.weightKg) * 10) / 10
      : null;

  const displayName =
    session.user.name ?? session.user.email?.split("@")[0] ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const weeklyGoal = 4;

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-soft">
          {initials || "?"}
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Salut {displayName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Ta progression en un coup d&apos;œil
          </p>
        </div>
      </header>

      <Card className="p-5">
        <XpProgress totalXp={totalXp} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
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
        <StatCard
          label="Cette semaine"
          value={sessions.thisWeek}
          suffix={`/${weeklyGoal}`}
        />
        <StatCard
          label="Série en cours"
          value={streak}
          suffix="j"
          accent={streak >= 7}
          subtitle={streak > 0 ? "En cours" : "Lance une session"}
          icon={streak > 0 ? <Flame className="h-3 w-3" /> : null}
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">Poids corporel</h3>
          {lastWeight ? (
            <span className="text-sm tabular-nums text-muted-foreground">
              {lastWeight.weightKg.toLocaleString("fr-FR")} kg
            </span>
          ) : null}
        </div>

        {lastWeight ? (
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tabular-nums">
                {lastWeight.weightKg.toLocaleString("fr-FR")}
              </span>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
            {delta30d !== null ? (
              <Pill
                variant={
                  delta30d < 0 ? "success" : delta30d > 0 ? "warning" : "default"
                }
              >
                {delta30d < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : delta30d > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : null}
                {delta30d > 0 ? "+" : ""}
                {delta30d.toLocaleString("fr-FR")} kg / 30 j
              </Pill>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3">
          <WeightChart data={weightChartData} />
        </div>

        <div className="mt-4">
          <WeightInput latestKg={lastWeight?.weightKg ?? null} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Volume hebdo</h3>
          <span className="text-xs text-muted-foreground">
            8 dernières semaines
          </span>
        </div>
        <VolumeChart data={weeklyVolume} />
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Muscles travaillés</h3>
          <span className="text-xs text-muted-foreground">
            {MUSCLE_WINDOW_DAYS} derniers jours
          </span>
        </div>
        <MuscleHeatmap data={muscleVolume} windowDays={MUSCLE_WINDOW_DAYS} />
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  subtitle,
  accent,
  icon,
  href,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  subtitle?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <Card
      interactive={Boolean(href)}
      className={cn(
        "p-4",
        accent && "border-primary/30 bg-primary/[0.06]",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-0.5">
        <span
          className={cn(
            "text-3xl font-bold tabular-nums",
            accent && "text-primary",
          )}
        >
          {value}
        </span>
        {suffix ? (
          <span className="text-base text-muted-foreground">{suffix}</span>
        ) : null}
      </p>
      {subtitle ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          {icon}
          {subtitle}
        </p>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
