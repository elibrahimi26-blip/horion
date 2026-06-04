import { db } from "@/lib/db";

// Tri lexicographique des 2 ids → garantit qu'on crée toujours
// (a, b) avec a < b. Permet le @@unique([userAId, userBId])
// de marcher sans avoir à chercher dans les deux ordres.
export function orderUserPair(id1: string, id2: string) {
  return id1 < id2 ? { userAId: id1, userBId: id2 } : { userAId: id2, userBId: id1 };
}

export async function listMyThreads(userId: string) {
  const threads = await db.privateThread.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, username: true, avatarUrl: true } },
      userB: { select: { id: true, username: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true },
      },
    },
  });

  // Compte les messages non lus pour chaque thread (envoyés par l'autre).
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
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, username: true, avatarUrl: true } },
      userB: { select: { id: true, username: true, avatarUrl: true } },
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

// Liste tous les membres actifs avec leur thread existant avec l'admin courant.
// Utilisé par le panel admin pour démarrer une conversation rapidement.
export async function listMembersForAdmin(adminId: string) {
  const [members, threads] = await Promise.all([
    db.user.findMany({
      where: { status: "ACTIVE", role: "MEMBER" },
      select: { id: true, username: true, email: true },
      orderBy: { username: "asc" },
    }),
    db.privateThread.findMany({
      where: { OR: [{ userAId: adminId }, { userBId: adminId }] },
      select: { id: true, userAId: true, userBId: true },
    }),
  ]);

  const threadByPartner = new Map<string, string>();
  for (const t of threads) {
    const partnerId = t.userAId === adminId ? t.userBId : t.userAId;
    threadByPartner.set(partnerId, t.id);
  }

  return members.map((m) => ({
    ...m,
    threadId: threadByPartner.get(m.id) ?? null,
  }));
}
