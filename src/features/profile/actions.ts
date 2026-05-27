"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_USERNAME_CHANGES } from "@/features/auth/service";
import { updateBioSchema, updateUsernameSchema } from "./schemas";

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProfileState: ProfileFormState = { status: "idle" };

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateUsernameAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireUser();

  const parsed = updateUsernameSchema.safeParse({
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Pseudo invalide.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const me = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      username: true,
      usernameChangesCount: true,
      usernameLocked: true,
    },
  });

  // Pas de changement effectif
  if (me.username === parsed.data.username) {
    return { status: "idle" };
  }

  if (me.usernameLocked) {
    return {
      status: "error",
      error: "Ton pseudo est verrouillé. Contacte un admin pour le débloquer.",
    };
  }

  if (me.usernameChangesCount >= MAX_USERNAME_CHANGES) {
    return {
      status: "error",
      error: `Tu as déjà modifié ton pseudo ${MAX_USERNAME_CHANGES} fois. Contacte un admin.`,
    };
  }

  const taken = await db.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (taken && taken.username !== me.username) {
    return { status: "error", error: "Ce pseudo est déjà pris." };
  }

  const newCount = me.usernameChangesCount + 1;
  await db.user.update({
    where: { id: session.user.id },
    data: {
      username: parsed.data.username,
      usernameChangesCount: newCount,
      usernameLocked: newCount >= MAX_USERNAME_CHANGES,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { status: "success" };
}

export async function updateBioAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await requireUser();

  const parsed = updateBioSchema.safeParse({
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Bio invalide.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { bio: parsed.data.bio || null },
  });

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { status: "success" };
}

// Hard delete RGPD (article 17 - droit à l'effacement).
// La confirmation par re-saisie du pseudo se fait côté client.
// Toutes les données liées sont supprimées par cascade Prisma.
export async function deleteMyAccountAction(formData: FormData) {
  const session = await requireUser();

  // Double-check : la confirmation pseudo doit correspondre
  const confirmation = formData.get("confirmUsername");
  const me = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (confirmation !== me.username) {
    throw new Error("Confirmation invalide");
  }

  await db.user.delete({ where: { id: session.user.id } });

  // signOut clear le cookie et redirige (lance NEXT_REDIRECT)
  await signOut({ redirectTo: "/login?deleted=true" });
}
