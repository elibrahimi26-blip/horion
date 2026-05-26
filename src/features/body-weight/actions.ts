"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyWeightSchema } from "./schemas";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export type BodyWeightFormState = {
  status: "idle" | "success" | "error";
  error?: string;
};

export const initialBodyWeightState: BodyWeightFormState = { status: "idle" };

export async function logBodyWeightAction(
  _prev: BodyWeightFormState,
  formData: FormData,
): Promise<BodyWeightFormState> {
  const session = await requireUser();

  const rawWeight = formData.get("weightKg");
  const weight = typeof rawWeight === "string" ? Number(rawWeight) : NaN;

  const parsed = bodyWeightSchema.safeParse({ weightKg: weight });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Poids invalide",
    };
  }

  await db.bodyWeightEntry.create({
    data: {
      userId: session.user.id,
      weightKg: parsed.data.weightKg,
    },
  });

  revalidatePath("/dashboard");
  return { status: "success" };
}

export async function deleteBodyWeightEntryAction(entryId: string) {
  const session = await requireUser();
  await db.bodyWeightEntry.deleteMany({
    where: { id: entryId, userId: session.user.id },
  });
  revalidatePath("/dashboard");
}
