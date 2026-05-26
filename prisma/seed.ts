import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ────── Muscle groups ──────
type MuscleSeed = {
  slug: string;
  name: string;
  bodyPart: "upper" | "core" | "lower";
};

const MUSCLES: MuscleSeed[] = [
  { slug: "chest", name: "Pectoraux", bodyPart: "upper" },
  { slug: "back", name: "Dos", bodyPart: "upper" },
  { slug: "shoulders", name: "Épaules", bodyPart: "upper" },
  { slug: "biceps", name: "Biceps", bodyPart: "upper" },
  { slug: "triceps", name: "Triceps", bodyPart: "upper" },
  { slug: "forearms", name: "Avant-bras", bodyPart: "upper" },
  { slug: "abs", name: "Abdominaux", bodyPart: "core" },
  { slug: "lower-back", name: "Lombaires", bodyPart: "core" },
  { slug: "glutes", name: "Fessiers", bodyPart: "lower" },
  { slug: "quads", name: "Quadriceps", bodyPart: "lower" },
  { slug: "hamstrings", name: "Ischio-jambiers", bodyPart: "lower" },
  { slug: "calves", name: "Mollets", bodyPart: "lower" },
];

// ────── Exercises ──────
type MuscleRef = { slug: string; isPrimary: boolean };
type ExerciseSeed = {
  name: string;
  description: string;
  isCardio?: boolean;
  muscles: MuscleRef[];
};

const EXERCISES: ExerciseSeed[] = [
  // ── Pectoraux ──
  {
    name: "Développé couché barre",
    description: "Allongé sur le banc, descendre la barre au niveau du milieu de la poitrine puis pousser.",
    muscles: [
      { slug: "chest", isPrimary: true },
      { slug: "triceps", isPrimary: false },
      { slug: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Développé incliné barre",
    description: "Banc incliné à 30-45°. Cible le haut des pectoraux.",
    muscles: [
      { slug: "chest", isPrimary: true },
      { slug: "shoulders", isPrimary: false },
      { slug: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Développé couché haltères",
    description: "Variante haltères du développé couché. Amplitude légèrement plus grande.",
    muscles: [
      { slug: "chest", isPrimary: true },
      { slug: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Développé incliné haltères",
    description: "Banc incliné, haltères. Travaille le haut des pectoraux avec plus d'amplitude qu'à la barre.",
    muscles: [
      { slug: "chest", isPrimary: true },
      { slug: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Écarté couché haltères",
    description: "Bras semi-fléchis, ouverture latérale puis fermeture. Mouvement d'isolation.",
    muscles: [{ slug: "chest", isPrimary: true }],
  },
  {
    name: "Pompes",
    description: "Au poids du corps, mains écartées à largeur d'épaules.",
    muscles: [
      { slug: "chest", isPrimary: true },
      { slug: "triceps", isPrimary: false },
      { slug: "shoulders", isPrimary: false },
    ],
  },

  // ── Dos ──
  {
    name: "Tractions pronation",
    description: "Paumes vers l'avant, prise large. Tirer le menton au-dessus de la barre.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Tractions supination",
    description: "Paumes vers soi, prise serrée. Plus de sollicitation des biceps.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Rowing barre",
    description: "Buste penché, tirer la barre vers le nombril en gardant le dos droit.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Tirage horizontal poulie",
    description: "Assis, tirer la poignée vers le ventre coudes près du corps.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Tirage vertical (lat pulldown)",
    description: "Assis, tirer la barre vers le haut du sternum, coudes vers le bas.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "biceps", isPrimary: false },
    ],
  },
  {
    name: "Soulevé de terre conventionnel",
    description: "Mouvement polyarticulaire majeur. Garder le dos droit, pousser dans le sol.",
    muscles: [
      { slug: "back", isPrimary: true },
      { slug: "hamstrings", isPrimary: false },
      { slug: "glutes", isPrimary: false },
      { slug: "lower-back", isPrimary: false },
    ],
  },

  // ── Épaules ──
  {
    name: "Développé militaire barre",
    description: "Debout ou assis, pousser la barre au-dessus de la tête.",
    muscles: [
      { slug: "shoulders", isPrimary: true },
      { slug: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Développé haltères assis",
    description: "Assis dossier vertical, haltères de chaque côté, pousser vers le haut.",
    muscles: [
      { slug: "shoulders", isPrimary: true },
      { slug: "triceps", isPrimary: false },
    ],
  },
  {
    name: "Élévations latérales haltères",
    description: "Bras tendus le long du corps, monter les haltères à l'horizontale.",
    muscles: [{ slug: "shoulders", isPrimary: true }],
  },
  {
    name: "Élévations frontales",
    description: "Bras tendus devant soi, monter les haltères jusqu'à hauteur d'épaule.",
    muscles: [{ slug: "shoulders", isPrimary: true }],
  },
  {
    name: "Oiseau penché haltères",
    description: "Buste penché vers l'avant, ouvrir les bras à l'horizontale. Cible l'arrière d'épaule.",
    muscles: [{ slug: "shoulders", isPrimary: true }],
  },

  // ── Biceps ──
  {
    name: "Curl barre",
    description: "Debout, fléchir les coudes pour monter la barre vers les épaules.",
    muscles: [
      { slug: "biceps", isPrimary: true },
      { slug: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Curl haltères alternés",
    description: "Debout, monter un haltère à la fois en supinant le poignet.",
    muscles: [
      { slug: "biceps", isPrimary: true },
      { slug: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Curl marteau",
    description: "Prise neutre (paumes face-à-face). Cible aussi le brachial.",
    muscles: [
      { slug: "biceps", isPrimary: true },
      { slug: "forearms", isPrimary: false },
    ],
  },
  {
    name: "Curl pupitre",
    description: "Bras appuyés sur le pupitre, curl en isolation stricte.",
    muscles: [{ slug: "biceps", isPrimary: true }],
  },

  // ── Triceps ──
  {
    name: "Dips",
    description: "Aux barres parallèles, descendre et remonter le corps.",
    muscles: [
      { slug: "triceps", isPrimary: true },
      { slug: "chest", isPrimary: false },
      { slug: "shoulders", isPrimary: false },
    ],
  },
  {
    name: "Extensions poulie corde",
    description: "Debout face à la poulie haute, tendre les bras vers le bas, coudes fixes.",
    muscles: [{ slug: "triceps", isPrimary: true }],
  },
  {
    name: "Extension haltère nuque",
    description: "Haltère tenu à deux mains derrière la tête, tendre les bras vers le haut.",
    muscles: [{ slug: "triceps", isPrimary: true }],
  },
  {
    name: "Kickback haltère",
    description: "Buste penché, bras le long du corps, étendre l'avant-bras vers l'arrière.",
    muscles: [{ slug: "triceps", isPrimary: true }],
  },

  // ── Avant-bras ──
  {
    name: "Curl poignets",
    description: "Avant-bras posés sur les cuisses, paumes vers le haut. Monter et descendre les poignets.",
    muscles: [{ slug: "forearms", isPrimary: true }],
  },
  {
    name: "Extension poignets",
    description: "Avant-bras posés, paumes vers le bas. Monter et descendre les poignets.",
    muscles: [{ slug: "forearms", isPrimary: true }],
  },

  // ── Abdominaux ──
  {
    name: "Crunch",
    description: "Allongé sur le dos, décoller les épaules en contractant les abdos.",
    muscles: [{ slug: "abs", isPrimary: true }],
  },
  {
    name: "Planche",
    description: "Maintien gainé en appui sur les avant-bras, corps aligné. Mesurer en secondes.",
    muscles: [
      { slug: "abs", isPrimary: true },
      { slug: "lower-back", isPrimary: false },
    ],
  },
  {
    name: "Russian twist",
    description: "Assis, jambes décollées, faire pivoter le buste de gauche à droite.",
    muscles: [{ slug: "abs", isPrimary: true }],
  },
  {
    name: "Relevé de jambes suspendu",
    description: "Suspendu à la barre, monter les genoux ou jambes tendues vers la poitrine.",
    muscles: [{ slug: "abs", isPrimary: true }],
  },

  // ── Lombaires ──
  {
    name: "Hyperextensions banc romain",
    description: "Sur banc romain, monter et descendre le buste en gainant les lombaires.",
    muscles: [
      { slug: "lower-back", isPrimary: true },
      { slug: "glutes", isPrimary: false },
    ],
  },
  {
    name: "Good morning",
    description: "Barre sur les épaules, basculer le buste vers l'avant en gardant le dos droit.",
    muscles: [
      { slug: "lower-back", isPrimary: true },
      { slug: "hamstrings", isPrimary: false },
      { slug: "glutes", isPrimary: false },
    ],
  },

  // ── Fessiers ──
  {
    name: "Hip thrust barre",
    description: "Dos appuyé sur un banc, barre sur les hanches, pousser vers le haut.",
    muscles: [
      { slug: "glutes", isPrimary: true },
      { slug: "hamstrings", isPrimary: false },
    ],
  },
  {
    name: "Pont fessier",
    description: "Au sol, pieds proches des fesses, lever les hanches.",
    muscles: [{ slug: "glutes", isPrimary: true }],
  },
  {
    name: "Squat sumo",
    description: "Pieds très écartés, pointes vers l'extérieur. Cible plus les fessiers et adducteurs.",
    muscles: [
      { slug: "glutes", isPrimary: true },
      { slug: "quads", isPrimary: false },
    ],
  },
  {
    name: "Fente arrière",
    description: "Reculer une jambe loin derrière, descendre en flexion sur la jambe avant.",
    muscles: [
      { slug: "glutes", isPrimary: true },
      { slug: "quads", isPrimary: false },
    ],
  },

  // ── Quadriceps ──
  {
    name: "Squat barre",
    description: "Barre sur le haut du dos, descendre cuisses parallèles au sol puis remonter.",
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "glutes", isPrimary: false },
    ],
  },
  {
    name: "Squat front",
    description: "Barre tenue devant à la base du cou. Plus d'engagement quadriceps que le squat classique.",
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "glutes", isPrimary: false },
    ],
  },
  {
    name: "Presse à cuisses",
    description: "Sur machine, pousser le chariot avec les pieds.",
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "glutes", isPrimary: false },
    ],
  },
  {
    name: "Leg extension",
    description: "Sur machine, tendre les jambes en isolation des quadriceps.",
    muscles: [{ slug: "quads", isPrimary: true }],
  },
  {
    name: "Fentes haltères",
    description: "Pas en avant, descendre le genou arrière vers le sol.",
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "glutes", isPrimary: false },
    ],
  },

  // ── Ischio-jambiers ──
  {
    name: "Soulevé de terre roumain",
    description: "Jambes quasi-tendues, basculer le buste vers l'avant en sentant l'étirement arrière.",
    muscles: [
      { slug: "hamstrings", isPrimary: true },
      { slug: "glutes", isPrimary: false },
      { slug: "lower-back", isPrimary: false },
    ],
  },
  {
    name: "Leg curl couché",
    description: "Sur machine, allongé sur le ventre, fléchir les jambes vers les fesses.",
    muscles: [{ slug: "hamstrings", isPrimary: true }],
  },
  {
    name: "Leg curl assis",
    description: "Sur machine assise, plier les genoux contre résistance.",
    muscles: [{ slug: "hamstrings", isPrimary: true }],
  },

  // ── Mollets ──
  {
    name: "Mollets debout machine",
    description: "Sur machine ou marche, monter sur la pointe des pieds puis redescendre.",
    muscles: [{ slug: "calves", isPrimary: true }],
  },
  {
    name: "Mollets assis machine",
    description: "Assis, charge sur les genoux, monter les talons. Cible le soléaire.",
    muscles: [{ slug: "calves", isPrimary: true }],
  },
  {
    name: "Mollets unilatéraux poids du corps",
    description: "Sur une marche, sur une seule jambe, monter et descendre.",
    muscles: [{ slug: "calves", isPrimary: true }],
  },

  // ── Cardio ──
  {
    name: "Tapis de course",
    description: "Course ou marche. Durée en minutes, intensité ajustable.",
    isCardio: true,
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "calves", isPrimary: false },
    ],
  },
  {
    name: "Vélo (ergocycle)",
    description: "Cardio à faible impact. Ajustable en résistance.",
    isCardio: true,
    muscles: [
      { slug: "quads", isPrimary: true },
      { slug: "calves", isPrimary: false },
    ],
  },
];

// ────── Bootstrap admin ──────
async function bootstrapAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    console.log("  · ADMIN_EMAIL non défini — skip bootstrap admin");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    console.log(`  ! ADMIN_EMAIL=${adminEmail} n'existe pas encore en base.`);
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

// ────── Muscle groups ──────
async function seedMuscleGroups() {
  console.log("  · Seeding muscle groups…");
  for (const mg of MUSCLES) {
    await prisma.muscleGroup.upsert({
      where: { slug: mg.slug },
      create: mg,
      update: { name: mg.name, bodyPart: mg.bodyPart },
    });
  }
  console.log(`    ${MUSCLES.length} groupes musculaires`);
}

// ────── Exercises ──────
async function seedExercises() {
  console.log("  · Seeding exercises…");

  const muscles = await prisma.muscleGroup.findMany();
  const muscleMap = new Map(muscles.map((m) => [m.slug, m.id]));

  let created = 0;
  let skipped = 0;

  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.exercise.create({
      data: {
        name: ex.name,
        description: ex.description,
        isCardio: ex.isCardio ?? false,
        muscles: {
          create: ex.muscles.map((m) => {
            const id = muscleMap.get(m.slug);
            if (!id) throw new Error(`Muscle group introuvable: ${m.slug}`);
            return { muscleGroupId: id, isPrimary: m.isPrimary };
          }),
        },
      },
    });
    created++;
  }

  console.log(`    ${created} créés, ${skipped} déjà présents (total ${EXERCISES.length})`);
}

async function main() {
  console.log("🌱 Seeding database…");

  await seedMuscleGroups();
  await seedExercises();
  await bootstrapAdmin();

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
