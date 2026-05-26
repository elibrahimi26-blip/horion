import type { ThreadStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function listMyTickets(userId: string) {
  return db.supportThread.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }],
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });
}

export async function listAllTickets(status?: ThreadStatus) {
  return db.supportThread.findMany({
    where: status ? { status } : undefined,
    orderBy: { lastMessageAt: "desc" },
    include: {
      user: { select: { id: true, username: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });
}

export async function countTicketsByStatus() {
  const [open, closed] = await Promise.all([
    db.supportThread.count({ where: { status: "OPEN" } }),
    db.supportThread.count({ where: { status: "CLOSED" } }),
  ]);
  return { open, closed };
}

export async function getTicket(
  threadId: string,
  userId: string,
  isAdmin: boolean,
) {
  return db.supportThread.findFirst({
    where: {
      id: threadId,
      ...(isAdmin ? {} : { userId }),
    },
    include: {
      user: { select: { id: true, username: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, username: true, role: true } },
        },
      },
    },
  });
}
