"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";
import { messageSchema } from "./schemas";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export type MessageFormState = { error: string | null };
export const initialMessageState: MessageFormState = { error: null };

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
      OR: [{ memberId: session.user.id }, { adminId: session.user.id }],
    },
    select: { id: true, memberId: true, adminId: true },
  });
  if (!thread) {
    return { error: "Conversation introuvable" };
  }

  const recipientId =
    thread.memberId === session.user.id ? thread.adminId : thread.memberId;
  const recipientIsAdmin = recipientId === thread.adminId;

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

  await createNotification({
    userId: recipientId,
    type: "NEW_PRIVATE_MESSAGE",
    title: `Nouveau message de ${session.user.name ?? "Horion"}`,
    body: parsed.data.body.slice(0, 120),
    url: recipientIsAdmin
      ? `/admin/messages/${threadId}`
      : `/messages/${threadId}`,
  });

  revalidatePath(`/messages/${threadId}`);
  revalidatePath(`/admin/messages/${threadId}`);
  revalidatePath("/messages");
  revalidatePath("/admin/messages");

  return { error: null };
}

// Admin uniquement : démarre (ou récupère) le thread avec un membre.
export async function startThreadWithMemberAction(memberId: string) {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const member = await db.user.findFirst({
    where: { id: memberId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!member) throw new Error("Membre introuvable");

  const existing = await db.privateThread.findUnique({
    where: {
      memberId_adminId: { memberId, adminId: session.user.id },
    },
    select: { id: true },
  });

  let threadId: string;
  if (existing) {
    threadId = existing.id;
  } else {
    const created = await db.privateThread.create({
      data: { memberId, adminId: session.user.id },
      select: { id: true },
    });
    threadId = created.id;
  }

  revalidatePath("/admin/messages");
  redirect(`/admin/messages/${threadId}`);
}
