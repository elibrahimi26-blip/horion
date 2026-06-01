// Import des exercices de la bibliothèque open-source yuhonas/free-exercise-db
// (MIT, ~870 exercices avec images statiques). Idempotent : exécutable plusieurs
// fois sans dupliquer (upsert via externalId).
//
// Usage :
//   pnpm exercises:import           → clone + import + nettoie /tmp
//   EXERCISES_DIR=/tmp/x pnpm …     → override du dossier cible (tests)
//
// Le script :
//   1. Clone (ou pull) le repo yuhonas dans /tmp/yuhonas-free-exercise-db
//   2. Lit dist/exercises.json (~870 entrées)
//   3. Map les muscles yuhonas vers les slugs MuscleGroup (yuhonas-mapping.ts)
//   4. Upsert chaque exercice via externalId, avec isVisible=false par défaut
//   5. Copie les images dans EXERCISES_DIR/<externalId>/<n>.jpg
//
// Les exos manuellement créés (admin, seed) ne sont jamais touchés —
// l'upsert ne cible que les rows ayant un externalId.

import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { mapYuhonasMuscle } from "../src/features/exercises/yuhonas-mapping";

const prisma = new PrismaClient();

const REPO_URL = "https://github.com/yuhonas/free-exercise-db.git";
const CLONE_DIR = "/tmp/yuhonas-free-exercise-db";
const EXERCISES_DIR = process.env.EXERCISES_DIR ?? "/app/exercises";

type YuhonasExercise = {
  id: string;
  name: string;
  force: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string | null;
  images: string[]; // ex: ["Barbell_Bench_Press/0.jpg", "Barbell_Bench_Press/1.jpg"]
};

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} a échoué (code ${code})`));
    });
  });
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function cloneOrUpdate(): Promise<void> {
  if (await exists(CLONE_DIR)) {
    console.log(`  · Repo déjà cloné dans ${CLONE_DIR} — pull…`);
    await run("git", ["-C", CLONE_DIR, "pull", "--ff-only"]);
  } else {
    console.log(`  · Clone shallow vers ${CLONE_DIR}…`);
    await run("git", ["clone", "--depth", "1", REPO_URL, CLONE_DIR]);
  }
}

async function loadExercises(): Promise<YuhonasExercise[]> {
  const candidates = [
    path.join(CLONE_DIR, "dist", "exercises.json"),
    path.join(CLONE_DIR, "exercises.json"),
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      const raw = await readFile(candidate, "utf-8");
      const parsed = JSON.parse(raw);
      // Format historique : tableau direct. Format alternatif : { exercises: [...] }
      const arr: YuhonasExercise[] = Array.isArray(parsed)
        ? parsed
        : (parsed.exercises ?? []);
      console.log(`  · ${arr.length} exercices chargés depuis ${candidate}`);
      return arr;
    }
  }
  throw new Error(
    `Impossible de trouver exercises.json (essayé : ${candidates.join(", ")})`,
  );
}

async function copyImages(exercise: YuhonasExercise): Promise<string[]> {
  if (exercise.images.length === 0) return [];

  const srcDir = path.join(CLONE_DIR, "exercises");
  const dstDir = path.join(EXERCISES_DIR, exercise.id);
  await mkdir(dstDir, { recursive: true });

  const kept: string[] = [];
  for (let i = 0; i < exercise.images.length; i++) {
    const rel = exercise.images[i];
    if (!rel) continue;
    const src = path.join(srcDir, rel);
    if (!(await exists(src))) continue;
    const ext = path.extname(rel) || ".jpg";
    const dst = path.join(dstDir, `${i}${ext}`);
    await cp(src, dst, { force: true });
    kept.push(`${exercise.id}/${i}${ext}`);
  }
  return kept;
}

async function importExercise(
  ex: YuhonasExercise,
  muscleMap: Map<string, string>,
): Promise<"created" | "updated" | "skipped"> {
  // Map les muscles yuhonas vers nos slugs. On ignore ceux qu'on ne peut
  // pas mapper (warning à l'utilisateur).
  const primaryIds = new Set<string>();
  const secondaryIds = new Set<string>();

  for (const m of ex.primaryMuscles) {
    const slug = mapYuhonasMuscle(m);
    const id = slug ? muscleMap.get(slug) : null;
    if (id) primaryIds.add(id);
  }
  for (const m of ex.secondaryMuscles) {
    const slug = mapYuhonasMuscle(m);
    const id = slug ? muscleMap.get(slug) : null;
    if (id && !primaryIds.has(id)) secondaryIds.add(id);
  }

  if (primaryIds.size === 0) {
    console.warn(
      `    ⚠ ${ex.id} — aucun muscle primaire mappable (${ex.primaryMuscles.join(", ")}), skip`,
    );
    return "skipped";
  }

  const imagePaths = await copyImages(ex);

  const existing = await prisma.exercise.findUnique({
    where: { externalId: ex.id },
  });

  const data = {
    name: ex.name,
    externalId: ex.id,
    equipment: ex.equipment,
    level: ex.level,
    force: ex.force,
    mechanic: ex.mechanic,
    category: ex.category,
    instructions: ex.instructions,
    imagePaths,
    isCardio: ex.category === "cardio",
  };

  if (existing) {
    // Update sans toucher à isVisible/nameFr/mediaUrl (choix admin préservés)
    await prisma.$transaction([
      prisma.exercise.update({
        where: { id: existing.id },
        data,
      }),
      prisma.exerciseMuscle.deleteMany({ where: { exerciseId: existing.id } }),
      prisma.exerciseMuscle.createMany({
        data: [
          ...Array.from(primaryIds).map((muscleGroupId) => ({
            exerciseId: existing.id,
            muscleGroupId,
            isPrimary: true,
          })),
          ...Array.from(secondaryIds).map((muscleGroupId) => ({
            exerciseId: existing.id,
            muscleGroupId,
            isPrimary: false,
          })),
        ],
      }),
    ]);
    return "updated";
  }

  await prisma.exercise.create({
    data: {
      ...data,
      isVisible: false, // imports yuhonas cachés par défaut — l'admin active
      muscles: {
        create: [
          ...Array.from(primaryIds).map((muscleGroupId) => ({
            muscleGroupId,
            isPrimary: true,
          })),
          ...Array.from(secondaryIds).map((muscleGroupId) => ({
            muscleGroupId,
            isPrimary: false,
          })),
        ],
      },
    },
  });
  return "created";
}

async function main() {
  console.log("📦 Import yuhonas/free-exercise-db");

  await cloneOrUpdate();
  const exercises = await loadExercises();

  console.log(`  · Cible images : ${EXERCISES_DIR}`);
  await mkdir(EXERCISES_DIR, { recursive: true });

  const muscleGroups = await prisma.muscleGroup.findMany();
  const muscleMap = new Map(muscleGroups.map((m) => [m.slug, m.id]));

  // Vérifier qu'on a bien les muscles additionnels nécessaires
  const required = ["abductors", "adductors", "neck", "traps"];
  const missing = required.filter((s) => !muscleMap.has(s));
  if (missing.length > 0) {
    console.warn(
      `  ⚠ MuscleGroups manquants : ${missing.join(", ")} — lance d'abord "pnpm db:seed"`,
    );
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex) continue;
    try {
      const res = await importExercise(ex, muscleMap);
      if (res === "created") created++;
      else if (res === "updated") updated++;
      else skipped++;
    } catch (err) {
      console.error(`    ✗ ${ex.id} :`, err);
      skipped++;
    }
    if ((i + 1) % 50 === 0) {
      console.log(`    … ${i + 1}/${exercises.length}`);
    }
  }

  console.log(
    `\n✅ Import terminé : ${created} créés, ${updated} mis à jour, ${skipped} skip.`,
  );

  // Nettoyage du clone (optionnel — passe SKIP_CLEANUP=1 pour le garder en debug)
  if (process.env.SKIP_CLEANUP !== "1") {
    console.log(`  · Nettoyage de ${CLONE_DIR}…`);
    await rm(CLONE_DIR, { recursive: true, force: true });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
