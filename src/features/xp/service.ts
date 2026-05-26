import type { XpEventType } from "@prisma/client";
import { db } from "@/lib/db";
import { createNotification } from "@/features/notifications/service";
import { isOneShot, XP_AMOUNTS } from "./events";
import { getLevelFromXp } from "./levels";

export type AwardResult = {
  awarded: boolean;
  previousXp: number;
  newXp: number;
  leveledUp: boolean;
  newLevel: number;
};

export async function sumUserXp(userId: string): Promise<number> {
  const result = await db.xpEvent.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// Attribue de l'XP à un user pour un événement donné.
// - Pour les events one-shot : no-op si déjà attribué
// - Pour les events répétables : crée un nouvel event à chaque appel
// - Émet une Notification LEVEL_UP en cas de passage de palier
export async function awardXp(
  userId: string,
  type: XpEventType,
): Promise<AwardResult> {
  const amount = XP_AMOUNTS[type];

  if (isOneShot(type)) {
    const existing = await db.xpEvent.findFirst({
      where: { userId, type },
      select: { id: true },
    });
    if (existing) {
      const total = await sumUserXp(userId);
      return {
        awarded: false,
        previousXp: total,
        newXp: total,
        leveledUp: false,
        newLevel: getLevelFromXp(total),
      };
    }
  }

  const previousXp = await sumUserXp(userId);
  const previousLevel = getLevelFromXp(previousXp);

  await db.xpEvent.create({
    data: { userId, type, amount },
  });

  const newXp = previousXp + amount;
  const newLevel = getLevelFromXp(newXp);
  const leveledUp = newLevel > previousLevel;

  if (leveledUp) {
    await createNotification({
      userId,
      type: "LEVEL_UP",
      title: `Niveau ${newLevel} atteint !`,
      body: `Tu viens de passer au niveau ${newLevel}. Continue comme ça.`,
      url: "/profile",
    });
  }

  return {
    awarded: true,
    previousXp,
    newXp,
    leveledUp,
    newLevel,
  };
}

export async function listXpEvents(userId: string, limit = 50) {
  return db.xpEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
