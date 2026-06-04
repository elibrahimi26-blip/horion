"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";

async function requireUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function followUserAction(targetUserId: string) {
  const session = await requireUser();
  if (targetUserId === session.user.id) {
    throw new Error("Tu ne peux pas te suivre toi-même");
  }

  const [me, target] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { username: true },
    }),
    db.user.findFirst({
      where: { id: targetUserId, status: "ACTIVE" },
      select: { id: true, username: true },
    }),
  ]);
  if (!target) throw new Error("Utilisateur introuvable");

  // upsert pour gérer les double-clics sans throw P2002.
  const result = await db.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    },
    create: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
    update: {},
    select: { createdAt: true },
  });

  // Notification uniquement si c'est un follow neuf (pas un upsert sur existant).
  // Heuristique : si createdAt < 5 sec, c'est un nouveau follow.
  const isNew = Date.now() - result.createdAt.getTime() < 5_000;
  if (isNew) {
    await createNotification({
      userId: targetUserId,
      type: "NEW_FOLLOWER",
      title: `${me.username} te suit`,
      body: "Tu as un nouveau follower sur Horion.",
      url: `/u/${me.username}`,
    });
  }

  revalidatePath(`/u/${target.username}`);
  revalidatePath("/social");
}

export async function unfollowUserAction(targetUserId: string) {
  const session = await requireUser();

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  await db.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
  });

  if (target) revalidatePath(`/u/${target.username}`);
  revalidatePath("/social");
}
