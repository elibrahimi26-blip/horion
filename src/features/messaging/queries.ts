import { db } from "@/lib/db";

type Role = "MEMBER" | "ADMIN";

export async function listMyThreads(userId: string, role: Role) {
  const where =
    role === "ADMIN" ? { adminId: userId } : { memberId: userId };

  const threads = await db.privateThread.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      member: { select: { id: true, username: true } },
      admin: { select: { id: true, username: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
    },
  });

  // Compte les messages non lus pour chaque thread (envoyés par l'autre).
  // N+1 acceptable pour ~10 users avec ≤ 1 thread chacun.
  const unreadCounts = await Promise.all(
    threads.map((t) =>
      db.privateMessage.count({
        where: {
          threadId: t.id,
          senderId: { not: userId },
          readAt: null,
        },
      }),
    ),
  );

  return threads.map((t, i) => ({
    ...t,
    unreadCount: unreadCounts[i] ?? 0,
  }));
}

export async function getThread(threadId: string, userId: string) {
  return db.privateThread.findFirst({
    where: {
      id: threadId,
      OR: [{ memberId: userId }, { adminId: userId }],
    },
    include: {
      member: { select: { id: true, username: true } },
      admin: { select: { id: true, username: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderId: true,
          body: true,
          createdAt: true,
          readAt: true,
        },
      },
    },
  });
}

// Liste les membres actifs avec leur thread (s'il existe) côté admin.
export async function listMembersForAdmin(adminId: string) {
  const [members, threads] = await Promise.all([
    db.user.findMany({
      where: { status: "ACTIVE", role: "MEMBER" },
      select: { id: true, username: true, email: true },
      orderBy: { username: "asc" },
    }),
    db.privateThread.findMany({
      where: { adminId },
      select: { id: true, memberId: true },
    }),
  ]);

  const threadByMember = new Map(threads.map((t) => [t.memberId, t.id]));

  return members.map((m) => ({
    ...m,
    threadId: threadByMember.get(m.id) ?? null,
  }));
}
