import { db } from "@/lib/db";

export async function listBodyWeights(userId: string, sinceDays = 365) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  return db.bodyWeightEntry.findMany({
    where: { userId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
  });
}

export async function latestBodyWeight(userId: string) {
  return db.bodyWeightEntry.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });
}
