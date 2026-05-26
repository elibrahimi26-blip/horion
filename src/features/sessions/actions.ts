"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { setLogSchema, type SetLogInput } from "./schemas";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Upsert sur (sessionId, exerciseId, setNumber). Permet de
// reloguer une série si réseau coupé puis retour, sans dupliquer.
export async function saveSetAction(input: SetLogInput) {
  const session = await requireUser();
  const parsed = setLogSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid set input");
  }

  // Vérifie que la session est bien à l'utilisateur et toujours active
  const ws = await db.workoutSession.findFirst({
    where: {
      id: parsed.data.sessionId,
      userId: session.user.id,
      endedAt: null,
    },
    select: { id: true },
  });
  if (!ws) throw new Error("Session introuvable ou déjà terminée");

  const existing = await db.sessionSet.findFirst({
    where: {
      sessionId: parsed.data.sessionId,
      exerciseId: parsed.data.exerciseId,
      setNumber: parsed.data.setNumber,
    },
    select: { id: true },
  });

  if (existing) {
    await db.sessionSet.update({
      where: { id: existing.id },
      data: {
        weightKg: parsed.data.weightKg ?? null,
        reps: parsed.data.reps ?? null,
        durationSec: parsed.data.durationSec ?? null,
        restSec: parsed.data.restSec ?? null,
        completed: true,
      },
    });
  } else {
    await db.sessionSet.create({
      data: {
        sessionId: parsed.data.sessionId,
        exerciseId: parsed.data.exerciseId,
        setNumber: parsed.data.setNumber,
        weightKg: parsed.data.weightKg ?? null,
        reps: parsed.data.reps ?? null,
        durationSec: parsed.data.durationSec ?? null,
        restSec: parsed.data.restSec ?? null,
        completed: true,
      },
    });
  }
}

export async function endSessionAction(sessionId: string, notes: string | null) {
  const session = await requireUser();

  const ws = await db.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, endedAt: null },
    select: { id: true, startedAt: true, workoutId: true },
  });
  if (!ws) return;

  const endedAt = new Date();
  const durationSec = Math.max(
    0,
    Math.floor((endedAt.getTime() - ws.startedAt.getTime()) / 1000),
  );

  await db.workoutSession.update({
    where: { id: ws.id },
    data: {
      endedAt,
      durationSec,
      notes: notes ?? null,
    },
  });

  // TODO Sprint 4 : awardXp(WORKOUT_COMPLETED)
  // TODO Sprint 4 : update PlannedSession.status = COMPLETED si lien

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${ws.workoutId}`);
}

export async function cancelSessionAction(sessionId: string) {
  const session = await requireUser();

  const ws = await db.workoutSession.findFirst({
    where: { id: sessionId, userId: session.user.id, endedAt: null },
    select: { id: true, workoutId: true },
  });
  if (!ws) return;

  // Supprime la session inachevée et tous ses sets
  await db.workoutSession.delete({ where: { id: ws.id } });

  revalidatePath(`/workouts/${ws.workoutId}`);
}
