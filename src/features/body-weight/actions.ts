"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyWeightSchema } from "./schemas";
import type { BodyWeightFormState } from "./state";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

function parseRecordedAt(raw: FormDataEntryValue | null): Date | undefined {
  if (typeof raw !== "string" || raw === "") return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function logBodyWeightAction(
  _prev: BodyWeightFormState,
  formData: FormData,
): Promise<BodyWeightFormState> {
  const session = await requireUser();

  const rawWeight = formData.get("weightKg");
  const weight = typeof rawWeight === "string" ? Number(rawWeight) : NaN;
  const recordedAt = parseRecordedAt(formData.get("recordedAt"));

  const parsed = bodyWeightSchema.safeParse({ weightKg: weight, recordedAt });
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
      ...(parsed.data.recordedAt ? { recordedAt: parsed.data.recordedAt } : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile/weight");
  return { status: "success" };
}

export async function editBodyWeightEntryAction(
  _prev: BodyWeightFormState,
  formData: FormData,
): Promise<BodyWeightFormState> {
  const session = await requireUser();

  const entryId = formData.get("entryId");
  if (typeof entryId !== "string" || entryId === "") {
    return { status: "error", error: "Entrée introuvable." };
  }

  const rawWeight = formData.get("weightKg");
  const weight = typeof rawWeight === "string" ? Number(rawWeight) : NaN;
  const recordedAt = parseRecordedAt(formData.get("recordedAt"));

  const parsed = bodyWeightSchema.safeParse({ weightKg: weight, recordedAt });
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "Poids invalide",
    };
  }

  const result = await db.bodyWeightEntry.updateMany({
    where: { id: entryId, userId: session.user.id },
    data: {
      weightKg: parsed.data.weightKg,
      ...(parsed.data.recordedAt ? { recordedAt: parsed.data.recordedAt } : {}),
    },
  });

  if (result.count === 0) {
    return { status: "error", error: "Entrée introuvable." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/weight");
  return { status: "success" };
}

export async function deleteBodyWeightEntryAction(entryId: string) {
  const session = await requireUser();
  await db.bodyWeightEntry.deleteMany({
    where: { id: entryId, userId: session.user.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/profile/weight");
}

// Hard delete de TOUTES les mesures de poids de l'utilisateur.
// Action irréversible — la confirmation par re-saisie "RESET" est côté client.
export async function resetAllBodyWeightsAction() {
  const session = await requireUser();
  await db.bodyWeightEntry.deleteMany({
    where: { userId: session.user.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/profile/weight");
}
