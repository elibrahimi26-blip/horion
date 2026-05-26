"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exerciseFormSchema } from "./schemas";

export type ExerciseFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialExerciseState: ExerciseFormState = { status: "idle" };

async function requireAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    throw new Error("Forbidden");
  }
}

function parseExerciseFormData(formData: FormData) {
  const muscleIds = formData
    .getAll("muscleIds")
    .filter((v): v is string => typeof v === "string");
  const primaryRaw = formData.get("primaryMuscleId");
  const primaryId = typeof primaryRaw === "string" ? primaryRaw : null;

  const muscles = muscleIds.map((id) => ({
    muscleGroupId: id,
    isPrimary: id === primaryId,
  }));

  const estimatedRaw = formData.get("estimatedSeconds");
  const estimatedSeconds =
    typeof estimatedRaw === "string" && estimatedRaw.trim().length > 0
      ? Number(estimatedRaw)
      : null;

  return {
    name: formData.get("name"),
    description: (formData.get("description") as string | null)?.trim() || null,
    isCardio: formData.get("isCardio") === "on",
    estimatedSeconds,
    muscles,
  };
}

export async function createExerciseAction(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireAdmin();

  const parsed = exerciseFormSchema.safeParse(parseExerciseFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.exercise.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isCardio: parsed.data.isCardio,
      estimatedSeconds: parsed.data.estimatedSeconds ?? null,
      muscles: {
        create: parsed.data.muscles.map((m) => ({
          muscleGroupId: m.muscleGroupId,
          isPrimary: m.isPrimary,
        })),
      },
    },
  });

  revalidatePath("/admin/exercises");
  revalidatePath("/library");
  redirect("/admin/exercises");
}

export async function updateExerciseAction(
  exerciseId: string,
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireAdmin();

  const parsed = exerciseFormSchema.safeParse(parseExerciseFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.$transaction([
    db.exercise.update({
      where: { id: exerciseId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        isCardio: parsed.data.isCardio,
        estimatedSeconds: parsed.data.estimatedSeconds ?? null,
      },
    }),
    db.exerciseMuscle.deleteMany({ where: { exerciseId } }),
    db.exerciseMuscle.createMany({
      data: parsed.data.muscles.map((m) => ({
        exerciseId,
        muscleGroupId: m.muscleGroupId,
        isPrimary: m.isPrimary,
      })),
    }),
  ]);

  revalidatePath("/admin/exercises");
  revalidatePath(`/admin/exercises/${exerciseId}`);
  revalidatePath("/library");
  revalidatePath(`/library/${exerciseId}`);
  redirect("/admin/exercises");
}

export async function archiveExerciseAction(exerciseId: string) {
  await requireAdmin();
  await db.exercise.update({
    where: { id: exerciseId },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/admin/exercises");
  revalidatePath("/library");
}

export async function restoreExerciseAction(exerciseId: string) {
  await requireAdmin();
  await db.exercise.update({
    where: { id: exerciseId },
    data: { archivedAt: null },
  });
  revalidatePath("/admin/exercises");
  revalidatePath("/library");
}
