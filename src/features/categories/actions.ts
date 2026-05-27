"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categoryFormSchema } from "./schemas";
import type { CategoryFormState } from "./state";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requireUser();

  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const taken = await db.workoutCategory.findFirst({
    where: { userId: session.user.id, name: parsed.data.name },
  });
  if (taken) {
    return { status: "error", error: "Tu as déjà une catégorie avec ce nom." };
  }

  await db.workoutCategory.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      color: parsed.data.color,
      isDefault: false,
    },
  });

  revalidatePath("/profile/settings");
  revalidatePath("/calendar");
  return { status: "success" };
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requireUser();

  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      error: "Vérifie le formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.workoutCategory.updateMany({
    where: { id: categoryId, userId: session.user.id },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
    },
  });

  revalidatePath("/profile/settings");
  revalidatePath("/calendar");
  return { status: "success" };
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requireUser();

  // FK PlannedSession.categoryId : onDelete SetNull → les séances
  // planifiées avec cette catégorie restent, sans couleur.
  await db.workoutCategory.deleteMany({
    where: { id: categoryId, userId: session.user.id },
  });

  revalidatePath("/profile/settings");
  revalidatePath("/calendar");
}
