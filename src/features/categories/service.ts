import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "./defaults";

// Idempotent : ne recrée pas celles qui existent déjà (par nom).
// Appelé à l'inscription d'un nouveau user.
export async function seedDefaultCategories(userId: string) {
  const existing = await db.workoutCategory.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((c) => c.name));
  const toCreate = DEFAULT_CATEGORIES.filter(
    (c) => !existingNames.has(c.name),
  );
  if (toCreate.length === 0) return;
  await db.workoutCategory.createMany({
    data: toCreate.map((c) => ({
      userId,
      name: c.name,
      color: c.color,
      isDefault: true,
    })),
  });
}
