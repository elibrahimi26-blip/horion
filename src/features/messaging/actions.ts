"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";
import { orderUserPair } from "./queries";
import { messageSchema } from "./schemas";
import type { MessageFormState } from "./state";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function sendPrivateMessageAction(
  threadId: string,
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const session = await requireUser();

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Message invalide",
    };
  }

  const thread = await db.privateThread.findFirst({
    where: {
      id: threadId,
      OR: [{ userAId: session.user.id }, { userBId: session.user.id }],
    },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!thread) {
    return { error: "Conversation introuvable" };
  }

  const recipientId =
    thread.userAId === session.user.id ? thread.userBId : thread.userAId;

  await db.privateMessage.create({
    data: {
      threadId,
      senderId: session.user.id,
      body: parsed.data.body,
    },
  });

  await db.privateThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  // Détermine l'URL côté destinataire : admins lisent dans /admin/messages,
  // membres dans /messages.
  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { role: true },
  });
  const url =
    recipient?.role === "ADMIN"
      ? `/admin/messages/${threadId}`
      : `/messages/${threadId}`;

  await createNotification({
    userId: recipientId,
    type: "NEW_PRIVATE_MESSAGE",
    title: `Nouveau message de ${session.user.name ?? "Horion"}`,
    body: parsed.data.body.slice(0, 120),
    url,
  });

  revalidatePath(`/messages/${threadId}`);
  revalidatePath(`/admin/messages/${threadId}`);
  revalidatePath("/messages");
  revalidatePath("/admin/messages");

  return { error: null };
}

// Démarre (ou récupère) un thread entre l'utilisateur connecté et un autre user.
// Ouvert à tous les utilisateurs ACTIVE — y compris member → member, member →
// admin, admin → member, admin → admin.
export async function startThreadWithUserAction(otherUserId: string) {
  const session = await requireUser();
  if (otherUserId === session.user.id) {
    throw new Error("Impossible d'envoyer un message à soi-même");
  }

  const other = await db.user.findFirst({
    where: { id: otherUserId, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  if (!other) throw new Error("Utilisateur introuvable");

  const pair = orderUserPair(session.user.id, otherUserId);

  const existing = await db.privateThread.findUnique({
    where: { userAId_userBId: pair },
    select: { id: true },
  });

  const threadId =
    existing?.id ??
    (
      await db.privateThread.create({
        data: pair,
        select: { id: true },
      })
    ).id;

  // Redirige vers la bonne route selon le rôle de l'utilisateur courant.
  // Les admins ont leur propre vue avec liste de membres + démarrage rapide.
  const destination =
    session.user.role === "ADMIN"
      ? `/admin/messages/${threadId}`
      : `/messages/${threadId}`;

  revalidatePath("/messages");
  revalidatePath("/admin/messages");
  redirect(destination);
}

// Alias rétro-compat : ancien nom utilisé dans le panel admin.
export const startThreadWithMemberAction = startThreadWithUserAction;
