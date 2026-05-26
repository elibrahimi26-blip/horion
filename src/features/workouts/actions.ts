"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardXp } from "@/features/xp/service";
import { workoutFormSchema } from "./schemas";
import { createWorkout, updateWorkoutWithNewVersion } from "./versioning";

export type WorkoutFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialWorkoutState: WorkoutFormState = { status: "idle" };

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseWorkoutFormData(formData: FormData) {
  const exercisesRaw = formData.get("exercises");
  let exercises: unknown = [];
  if (typeof exercisesRaw === "string") {
    try {
      exercises = JSON.parse(exercisesRaw);
    } catch {
      exercises = [];
    }
  }

  return {
    name: formData.get("name"),
    description: (formData.get("description") as string | null)?.trim() || null,
    visibility:
      formData.get("visibility") === "PUBLIC" ? "PUBLIC" : "PRIVATE",
    exercises,
  };
}

export async function createWorkoutAction(
  _prev: WorkoutFormState,
  formData: FormData,
): Promise<WorkoutFormState> {
  const session = await requireUser();

  const parsed = workoutFormSchema.safeParse(parseWorkoutFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const created = await createWorkout(session.user.id, parsed.data);

  // XP one-shot : +50 dès que l'utilisateur a 3 séances créées.
  const count = await db.workout.count({
    where: { authorId: session.user.id, deletedAt: null },
  });
  if (count >= 3) {
    await awardXp(session.user.id, "THREE_WORKOUTS_CREATED");
  }

  revalidatePath("/workouts");
  redirect(`/workouts/${created.id}`);
}

export async function updateWorkoutAction(
  workoutId: string,
  _prev: WorkoutFormState,
  formData: FormData,
): Promise<WorkoutFormState> {
  const session = await requireUser();

  const parsed = workoutFormSchema.safeParse(parseWorkoutFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await updateWorkoutWithNewVersion(workoutId, session.user.id, parsed.data);

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
  redirect(`/workouts/${workoutId}`);
}

export async function deleteWorkoutAction(workoutId: string) {
  const session = await requireUser();

  await db.workout.updateMany({
    where: { id: workoutId, authorId: session.user.id, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/workouts");
  redirect("/workouts");
}

export async function setWorkoutVisibilityAction(
  workoutId: string,
  visibility: "PRIVATE" | "PUBLIC",
) {
  const session = await requireUser();

  await db.workout.updateMany({
    where: { id: workoutId, authorId: session.user.id, deletedAt: null },
    data: { visibility },
  });

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
}
