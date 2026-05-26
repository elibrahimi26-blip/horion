import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.log("  · ADMIN_EMAIL non défini — skip bootstrap admin");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    console.log(
      `  ! ADMIN_EMAIL=${adminEmail} n'existe pas encore en base.`,
    );
    console.log(
      `    → Inscris-toi via /register avec cet email, puis relance "pnpm db:seed".`,
    );
    return;
  }

  if (existing.role === "ADMIN" && existing.status === "ACTIVE") {
    console.log(`  · ${adminEmail} est déjà admin actif`);
    return;
  }

  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: "ADMIN", status: "ACTIVE" },
  });
  console.log(`  ✓ ${adminEmail} promu ADMIN + ACTIVE`);
}

async function main() {
  console.log("🌱 Seeding database…");

  await bootstrapAdmin();

  // TODO Sprint 2 : seed muscle groups + ~50 exercices de base
  // TODO Sprint 4 : seed default workout categories (Push/Pull/Legs/Cardio/Full Body)

  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
