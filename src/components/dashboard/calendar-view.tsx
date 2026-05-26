"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelPlannedSessionAction,
  deletePlannedSessionAction,
  planSessionAction,
} from "@/features/planned/actions";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

type PlannedItem = {
  id: string;
  scheduledFor: string;
  status: "SCHEDULED" | "COMPLETED" | "MISSED" | "CANCELLED";
  notes: string | null;
  workout: { id: string; name: string };
  category: { id: string; name: string; color: string } | null;
};

type ExecutedItem = {
  id: string;
  endedAt: string;
  workout: { id: string; name: string };
};

type WorkoutOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; color: string };

type Props = {
  month: string; // YYYY-MM
  todayKey: string;
  plannedSessions: PlannedItem[];
  executedSessions: ExecutedItem[];
  workouts: WorkoutOption[];
  categories: CategoryOption[];
};

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMonthGrid(year: number, monthIdx: number): Date[][] {
  const firstDay = new Date(year, monthIdx, 1);
  const firstWeekday = firstDay.getDay();
  const offsetToMonday = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - offsetToMonday);

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatMonth(monthIdx: number, year: number): string {
  return `${MONTH_NAMES[monthIdx]} ${year}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y!, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

export function CalendarView({
  month,
  todayKey,
  plannedSessions,
  executedSessions,
  workouts,
  categories,
}: Props) {
  const [year, monthIdx] = month.split("-").map(Number) as [number, number];
  const grid = useMemo(
    () => buildMonthGrid(year, monthIdx - 1),
    [year, monthIdx],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<
      string,
      { planned: PlannedItem[]; executed: ExecutedItem[] }
    >();
    for (const p of plannedSessions) {
      const key = dayKey(new Date(p.scheduledFor));
      const cur = map.get(key) ?? { planned: [], executed: [] };
      cur.planned.push(p);
      map.set(key, cur);
    }
    for (const e of executedSessions) {
      const key = dayKey(new Date(e.endedAt));
      const cur = map.get(key) ?? { planned: [], executed: [] };
      cur.executed.push(e);
      map.set(key, cur);
    }
    return map;
  }, [plannedSessions, executedSessions]);

  const [selectedKey, setSelectedKey] = useState<string>(todayKey);

  const selectedDate = new Date(`${selectedKey}T12:00:00`);
  const selectedEvents = eventsByDay.get(selectedKey) ?? {
    planned: [],
    executed: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {formatMonth(monthIdx - 1, year)}
        </h2>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/calendar?month=${shiftMonth(month, -1)}`}>← Mois précédent</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/calendar?month=${todayKey.slice(0, 7)}`}>
              Aujourd&apos;hui
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/calendar?month=${shiftMonth(month, 1)}`}>Mois suivant →</Link>
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="py-2">
              {label}
            </div>
          ))}
        </div>
        <div>
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((date) => {
                const key = dayKey(date);
                const inMonth = date.getMonth() === monthIdx - 1;
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const ev = eventsByDay.get(key);
                const hasExecuted = (ev?.executed.length ?? 0) > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={cn(
                      "flex min-h-[68px] flex-col items-stretch gap-1 border-r p-1.5 text-left transition-colors last:border-r-0",
                      inMonth ? "" : "bg-muted/20 text-muted-foreground",
                      isSelected ? "bg-accent" : "hover:bg-accent/50",
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs",
                          isToday
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            : "",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {hasExecuted ? (
                        <span
                          className="text-xs text-green-600"
                          aria-label="Séance effectuée"
                        >
                          ✓
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(ev?.planned ?? [])
                        .filter((p) => p.status === "SCHEDULED")
                        .slice(0, 3)
                        .map((p) => (
                          <span
                            key={p.id}
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: p.category?.color ?? "#9ca3af",
                            }}
                            title={p.workout.name}
                            aria-hidden
                          />
                        ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day panel */}
      <DayPanel
        date={selectedDate}
        events={selectedEvents}
        workouts={workouts}
        categories={categories}
      />
    </div>
  );
}

function DayPanel({
  date,
  events,
  workouts,
  categories,
}: {
  date: Date;
  events: { planned: PlannedItem[]; executed: ExecutedItem[] };
  workouts: WorkoutOption[];
  categories: CategoryOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const fmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  function cancel(id: string) {
    if (!confirm("Annuler cette séance planifiée ?")) return;
    startTransition(() => cancelPlannedSessionAction(id));
  }

  function remove(id: string) {
    if (!confirm("Supprimer cette planification ?")) return;
    startTransition(() => deletePlannedSessionAction(id));
  }

  return (
    <div className="space-y-3 rounded-md border p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold capitalize">
          {fmt.format(date)}
        </h3>
        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Planifier une séance
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <PlanForm
          date={dayKey(date)}
          workouts={workouts}
          categories={categories}
          onClose={() => setShowForm(false)}
        />
      ) : null}

      {events.executed.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Effectué
          </p>
          {events.executed.map((e) => (
            <Link
              key={e.id}
              href={`/workouts/${e.workout.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-accent"
            >
              <span className="font-medium">{e.workout.name}</span>
              <span className="text-xs text-green-600">✓ terminée</span>
            </Link>
          ))}
        </div>
      ) : null}

      {events.planned.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Planifié
          </p>
          {events.planned.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
            >
              <div className="flex items-center gap-3">
                {p.category ? (
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.category.color }}
                    aria-hidden
                  />
                ) : null}
                <div>
                  <Link
                    href={`/workouts/${p.workout.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.workout.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.category?.name ?? "Sans catégorie"}
                    {p.status !== "SCHEDULED" ? ` · ${labelStatus(p.status)}` : ""}
                  </p>
                  {p.notes ? (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      {p.notes}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                {p.status === "SCHEDULED" ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/workouts/${p.workout.id}/run`}>Lancer</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => cancel(p.id)}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => remove(p.id)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {events.planned.length === 0 && events.executed.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune séance prévue ou effectuée ce jour-là.
        </p>
      ) : null}
    </div>
  );
}

function PlanForm({
  date,
  workouts,
  categories,
  onClose,
}: {
  date: string;
  workouts: WorkoutOption[];
  categories: CategoryOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await planSessionAction(formData);
      onClose();
    });
  }

  if (workouts.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm">
        <p>
          Tu n&apos;as pas encore créé de séance.{" "}
          <Link href="/workouts/new" className="text-primary hover:underline">
            En créer une
          </Link>{" "}
          pour pouvoir la planifier.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-md border bg-muted/30 p-4">
      <input type="hidden" name="scheduledFor" value={date} />

      <div className="space-y-1">
        <Label htmlFor="workoutId">Séance *</Label>
        <select
          id="workoutId"
          name="workoutId"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">— Choisir —</option>
          {workouts.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="categoryId">Catégorie (optionnel)</Label>
        <select
          id="categoryId"
          name="categoryId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">— Aucune —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={2} maxLength={500} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Planifier"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function labelStatus(s: string): string {
  switch (s) {
    case "COMPLETED":
      return "effectuée";
    case "MISSED":
      return "manquée";
    case "CANCELLED":
      return "annulée";
    default:
      return s.toLowerCase();
  }
}
