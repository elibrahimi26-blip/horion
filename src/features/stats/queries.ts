import { db } from "@/lib/db";

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Nombre de jours consécutifs avec au moins une session terminée.
// Inclut aujourd'hui s'il y a déjà eu une séance ; sinon part d'hier
// (1 jour de "grâce" pour éviter de casser un streak au matin).
export async function getStreak(userId: string): Promise<number> {
  const sessions = await db.workoutSession.findMany({
    where: { userId, endedAt: { not: null } },
    select: { endedAt: true },
    orderBy: { endedAt: "desc" },
    take: 500,
  });

  if (sessions.length === 0) return 0;

  const daysSet = new Set<string>();
  for (const s of sessions) {
    if (s.endedAt) daysSet.add(dayKey(s.endedAt));
  }

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Si aujourd'hui n'a pas de session, on autorise le streak à
  // commencer hier (sans casser ; mais si hier non plus → 0)
  if (!daysSet.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!daysSet.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (daysSet.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Volume = somme de (poids × reps) sur tous les sets complétés.
// Agrégé par semaine (lundi-dimanche), sur N semaines glissantes.
export async function getWeeklyVolume(userId: string, weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - (weeks - 1) * 7);
  const sinceMonday = startOfMonday(since);

  const sets = await db.sessionSet.findMany({
    where: {
      completed: true,
      session: {
        userId,
        endedAt: { not: null, gte: sinceMonday },
      },
    },
    select: {
      weightKg: true,
      reps: true,
      session: { select: { endedAt: true } },
    },
  });

  const byWeek = new Map<string, number>();
  for (const s of sets) {
    if (!s.session.endedAt) continue;
    const key = dayKey(startOfMonday(s.session.endedAt));
    const volume = (s.weightKg ?? 0) * (s.reps ?? 0);
    byWeek.set(key, (byWeek.get(key) ?? 0) + volume);
  }

  // Générer toutes les semaines (incl. celles à 0) pour un graphe lisible
  const result: Array<{ weekKey: string; weekLabel: string; volume: number }> = [];
  const cursor = new Date(sinceMonday);
  for (let i = 0; i < weeks; i++) {
    const key = dayKey(cursor);
    const label = cursor.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    result.push({
      weekKey: key,
      weekLabel: label,
      volume: Math.round(byWeek.get(key) ?? 0),
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return result;
}

// Volume par muscle principal sur les N derniers jours.
// Pour chaque set, on alloue tout le volume au muscle marqué isPrimary
// de l'exercice (les muscles secondaires ne reçoivent rien — choix
// simplificateur, à affiner plus tard).
export async function getMuscleVolume(userId: string, days = 28) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sets = await db.sessionSet.findMany({
    where: {
      completed: true,
      session: {
        userId,
        endedAt: { not: null, gte: since },
      },
    },
    select: {
      weightKg: true,
      reps: true,
      exercise: {
        select: {
          muscles: {
            where: { isPrimary: true },
            select: {
              muscleGroup: { select: { slug: true, name: true, bodyPart: true } },
            },
          },
        },
      },
    },
  });

  // Liste de tous les muscles pour afficher même ceux à 0 volume
  const allMuscles = await db.muscleGroup.findMany({
    orderBy: [{ bodyPart: "asc" }, { name: "asc" }],
  });

  const byMuscle = new Map<
    string,
    { name: string; bodyPart: string; volume: number; sets: number }
  >();
  for (const m of allMuscles) {
    byMuscle.set(m.slug, {
      name: m.name,
      bodyPart: m.bodyPart,
      volume: 0,
      sets: 0,
    });
  }

  for (const s of sets) {
    const primary = s.exercise.muscles[0]?.muscleGroup;
    if (!primary) continue;
    const cur = byMuscle.get(primary.slug);
    if (!cur) continue;
    cur.volume += (s.weightKg ?? 0) * (s.reps ?? 0);
    cur.sets += 1;
  }

  return Array.from(byMuscle.entries()).map(([slug, data]) => ({
    slug,
    name: data.name,
    bodyPart: data.bodyPart,
    volume: Math.round(data.volume),
    sets: data.sets,
  }));
}

export async function getSessionsCounts(userId: string) {
  const startOfWeek = startOfMonday(new Date());
  const [total, thisWeek] = await Promise.all([
    db.workoutSession.count({
      where: { userId, endedAt: { not: null } },
    }),
    db.workoutSession.count({
      where: { userId, endedAt: { not: null, gte: startOfWeek } },
    }),
  ]);
  return { total, thisWeek };
}
