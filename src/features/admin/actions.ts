"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import { accountActivatedEmail } from "@/features/auth/emails";
import { createNotification } from "@/features/notifications/service";

async function requireAdmin() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "ADMIN" ||
    session.user.status !== "ACTIVE"
  ) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function validateUserAction(userId: string) {
  await requireAdmin();

  const user = await db.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
    select: { id: true, username: true, email: true },
  });

  const tpl = accountActivatedEmail(user);
  await sendEmail({ to: user.email, ...tpl });

  await createNotification({
    userId: user.id,
    type: "ACCOUNT_VALIDATED",
    title: "Ton compte a été activé",
    body: "Bienvenue dans Horion. Crée ta première séance pour commencer !",
    url: "/dashboard",
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
}

export async function suspendUserAction(userId: string) {
  await requireAdmin();

  await db.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/admin/users");
}

export async function reactivateUserAction(userId: string) {
  await requireAdmin();

  await db.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin/users");
}

export async function unlockUsernameAction(userId: string) {
  await requireAdmin();

  await db.user.update({
    where: { id: userId },
    data: { usernameLocked: false, usernameChangesCount: 0 },
  });

  revalidatePath("/admin/users");
}
