import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { listUserCategories } from "@/features/categories/queries";

function parseMonth(input?: string): { year: number; monthIdx: number; key: string } {
  const re = /^(\d{4})-(\d{2})$/;
  if (input && re.test(input)) {
    const [, y, m] = input.match(re)!;
    const year = Number(y);
    const monthIdx = Number(m); // 1-based
    if (monthIdx >= 1 && monthIdx <= 12) {
      return { year, monthIdx, key: `${y}-${m}` };
    }
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  return { year: now.getFullYear(), monthIdx: now.getMonth() + 1, key: `${y}-${m}` };
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { year, monthIdx, key: monthKey } = parseMonth(searchParams.month);

  const monthStart = new Date(year, monthIdx - 1, 1);
  const monthEnd = new Date(year, monthIdx, 1);

  // On élargit légèrement pour capter les events des semaines débordantes
  const rangeStart = new Date(monthStart);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(monthEnd);
  rangeEnd.setDate(rangeEnd.getDate() + 7);

  const [plannedSessions, executedSessions, workouts, categories] =
    await Promise.all([
      db.plannedSession.findMany({
        where: {
          userId: session.user.id,
          scheduledFor: { gte: rangeStart, lt: rangeEnd },
        },
        include: {
          workout: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, color: true } },
        },
        orderBy: { scheduledFor: "asc" },
      }),
      db.workoutSession.findMany({
        where: {
          userId: session.user.id,
          endedAt: { gte: rangeStart, lt: rangeEnd, not: null },
        },
        include: { workout: { select: { id: true, name: true } } },
        orderBy: { endedAt: "asc" },
      }),
      db.workout.findMany({
        where: { authorId: session.user.id, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      }),
      listUserCategories(session.user.id),
    ]);

  return (
    <CalendarView
      month={monthKey}
      todayKey={todayKey()}
      plannedSessions={plannedSessions.map((p) => ({
        id: p.id,
        scheduledFor: p.scheduledFor.toISOString(),
        status: p.status,
        notes: p.notes,
        workout: p.workout,
        category: p.category,
      }))}
      executedSessions={executedSessions
        .filter((s) => s.endedAt !== null)
        .map((s) => ({
          id: s.id,
          endedAt: s.endedAt!.toISOString(),
          workout: s.workout,
        }))}
      workouts={workouts}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
      }))}
    />
  );
}
