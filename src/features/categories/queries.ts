import { db } from "@/lib/db";

export async function listUserCategories(userId: string) {
  return db.workoutCategory.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}
