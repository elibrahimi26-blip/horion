"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";
import { createTicketSchema, supportReplySchema } from "./schemas";
import type { TicketFormState } from "./state";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function notifyAllAdmins(params: {
  title: string;
  body?: string;
  url: string;
}) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "NEW_SUPPORT_REPLY",
        title: params.title,
        body: params.body,
        url: params.url,
      }),
    ),
  );
}

export async function createTicketAction(
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const session = await requireUser();

  const parsed = createTicketSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Champ invalide" };
  }

  const ticket = await db.supportThread.create({
    data: {
      userId: session.user.id,
      subject: parsed.data.subject,
      messages: {
        create: {
          senderId: session.user.id,
          body: parsed.data.body,
        },
      },
    },
    select: { id: true, subject: true },
  });

  await notifyAllAdmins({
    title: `Nouveau ticket : ${ticket.subject}`,
    body: parsed.data.body.slice(0, 120),
    url: `/admin/support/${ticket.id}`,
  });

  revalidatePath("/support");
  revalidatePath("/admin/support");
  redirect(`/support/${ticket.id}`);
}

export async function replyTicketAction(
  threadId: string,
  _prev: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const session = await requireUser();

  const parsed = supportReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Message invalide" };
  }

  const ticket = await db.supportThread.findFirst({
    where: {
      id: threadId,
      ...(session.user.role === "ADMIN" ? {} : { userId: session.user.id }),
    },
    select: { id: true, userId: true, status: true, subject: true },
  });
  if (!ticket) return { error: "Ticket introuvable" };
  if (ticket.status === "CLOSED") return { error: "Ticket fermé" };

  await db.supportMessage.create({
    data: {
      threadId,
      senderId: session.user.id,
      body: parsed.data.body,
    },
  });
  await db.supportThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  if (session.user.role === "ADMIN") {
    await createNotification({
      userId: ticket.userId,
      type: "NEW_SUPPORT_REPLY",
      title: `Réponse à ton ticket : ${ticket.subject}`,
      body: parsed.data.body.slice(0, 120),
      url: `/support/${threadId}`,
    });
  } else {
    await notifyAllAdmins({
      title: `Nouvelle réponse : ${ticket.subject}`,
      body: parsed.data.body.slice(0, 120),
      url: `/admin/support/${threadId}`,
    });
  }

  revalidatePath(`/support/${threadId}`);
  revalidatePath(`/admin/support/${threadId}`);
  revalidatePath("/support");
  revalidatePath("/admin/support");

  return { error: null };
}

export async function closeTicketAction(threadId: string) {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  await db.supportThread.update({
    where: { id: threadId },
    data: { status: "CLOSED" },
  });

  revalidatePath(`/support/${threadId}`);
  revalidatePath(`/admin/support/${threadId}`);
  revalidatePath("/admin/support");
}

export async function reopenTicketAction(threadId: string) {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  await db.supportThread.update({
    where: { id: threadId },
    data: { status: "OPEN" },
  });

  revalidatePath(`/support/${threadId}`);
  revalidatePath(`/admin/support/${threadId}`);
  revalidatePath("/admin/support");
}
