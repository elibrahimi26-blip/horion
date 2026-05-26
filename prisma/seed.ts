import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // TODO Sprint 2 : seed muscle groups + ~50 exercices de base
  // TODO Sprint 4 : seed default workout categories (Push/Pull/Legs/Cardio/Full Body)

  console.log("✅ Seed terminé (stub).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
