"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";
import { awardXp } from "@/features/xp/service";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function toggleLikeAction(workoutId: string) {
  const session = await requireUser();

  const workout = await db.workout.findFirst({
    where: { id: workoutId, visibility: "PUBLIC", deletedAt: null },
    select: { id: true, authorId: true, name: true },
  });
  if (!workout) throw new Error("Séance introuvable ou non publique");

  const existing = await db.workoutLike.findUnique({
    where: {
      workoutId_userId: { workoutId, userId: session.user.id },
    },
  });

  if (existing) {
    await db.workoutLike.delete({
      where: {
        workoutId_userId: { workoutId, userId: session.user.id },
      },
    });
  } else {
    await db.workoutLike.create({
      data: { workoutId, userId: session.user.id },
    });

    // Notif + XP au propriétaire (pas pour les auto-likes)
    if (workout.authorId !== session.user.id) {
      await createNotification({
        userId: workout.authorId,
        type: "WORKOUT_LIKED",
        title: `${session.user.name ?? "Quelqu'un"} a liké « ${workout.name} »`,
        url: `/workouts/${workout.id}`,
      });
      await awardXp(workout.authorId, "LIKE_RECEIVED");
    }
  }

  revalidatePath("/social");
  revalidatePath(`/workouts/${workoutId}`);
}

export async function toggleSaveAction(workoutId: string) {
  const session = await requireUser();

  const workout = await db.workout.findFirst({
    where: { id: workoutId, visibility: "PUBLIC", deletedAt: null },
    select: { id: true, authorId: true, name: true },
  });
  if (!workout) throw new Error("Séance introuvable ou non publique");

  const existing = await db.workoutSave.findUnique({
    where: {
      workoutId_userId: { workoutId, userId: session.user.id },
    },
  });

  if (existing) {
    await db.workoutSave.delete({
      where: {
        workoutId_userId: { workoutId, userId: session.user.id },
      },
    });
  } else {
    await db.workoutSave.create({
      data: { workoutId, userId: session.user.id },
    });

    if (workout.authorId !== session.user.id) {
      await createNotification({
        userId: workout.authorId,
        type: "WORKOUT_SAVED",
        title: `${session.user.name ?? "Quelqu'un"} a enregistré « ${workout.name} »`,
        url: `/workouts/${workout.id}`,
      });
    }
  }

  revalidatePath("/social");
  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
}
