"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { plannedSessionSchema } from "./schemas";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function planSessionAction(formData: FormData) {
  const session = await requireUser();

  const parsed = plannedSessionSchema.safeParse({
    workoutId: formData.get("workoutId"),
    scheduledFor: formData.get("scheduledFor"),
    categoryId: (formData.get("categoryId") as string | null) || null,
    notes: (formData.get("notes") as string | null)?.trim() || null,
  });

  if (!parsed.success) {
    throw new Error("Invalid planned session input");
  }

  // Vérifie que la séance existe et appartient au user
  const workout = await db.workout.findFirst({
    where: {
      id: parsed.data.workoutId,
      authorId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!workout) throw new Error("Workout introuvable");

  // Vérifie que la catégorie (si fournie) appartient au user
  if (parsed.data.categoryId) {
    const cat = await db.workoutCategory.findFirst({
      where: { id: parsed.data.categoryId, userId: session.user.id },
      select: { id: true },
    });
    if (!cat) throw new Error("Catégorie introuvable");
  }

  // La date est en YYYY-MM-DD ; on positionne à midi pour éviter les
  // bascules de jour liées aux fuseaux horaires.
  const scheduledAt = new Date(`${parsed.data.scheduledFor}T12:00:00`);

  await db.plannedSession.create({
    data: {
      userId: session.user.id,
      workoutId: parsed.data.workoutId,
      scheduledFor: scheduledAt,
      categoryId: parsed.data.categoryId ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/calendar");
}

export async function cancelPlannedSessionAction(plannedId: string) {
  const session = await requireUser();

  await db.plannedSession.updateMany({
    where: {
      id: plannedId,
      userId: session.user.id,
      status: "SCHEDULED",
    },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/calendar");
}

export async function deletePlannedSessionAction(plannedId: string) {
  const session = await requireUser();

  await db.plannedSession.deleteMany({
    where: { id: plannedId, userId: session.user.id },
  });

  revalidatePath("/calendar");
}
