// Mapping entre les noms de muscles utilisés par la bibliothèque yuhonas
// (https://github.com/yuhonas/free-exercise-db) et les slugs MuscleGroup
// utilisés en interne par Horion.
//
// Certains muscles yuhonas n'existent pas en base (abductors, adductors,
// neck, traps) — ils sont créés lors du seed. D'autres sont fusionnés
// (ex: "lats" et "middle back" pointent tous les deux vers le slug "back"
// — Horion regroupe l'ensemble du dos dans un seul groupe).
export const YUHONAS_MUSCLE_TO_SLUG: Record<string, string> = {
  abdominals: "abs",
  abductors: "abductors",
  adductors: "adductors",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "back",
  "lower back": "lower-back",
  "middle back": "back",
  neck: "neck",
  quadriceps: "quads",
  shoulders: "shoulders",
  traps: "traps",
  triceps: "triceps",
};

// Groupes musculaires absents du seed initial mais référencés par yuhonas.
// Ajoutés au seed pour que l'import yuhonas trouve toujours un slug cible.
export const ADDITIONAL_MUSCLE_GROUPS: Array<{
  slug: string;
  name: string;
  bodyPart: "upper" | "core" | "lower";
}> = [
  { slug: "abductors", name: "Abducteurs", bodyPart: "lower" },
  { slug: "adductors", name: "Adducteurs", bodyPart: "lower" },
  { slug: "neck", name: "Cou", bodyPart: "upper" },
  { slug: "traps", name: "Trapèzes", bodyPart: "upper" },
];

export function mapYuhonasMuscle(name: string): string | null {
  return YUHONAS_MUSCLE_TO_SLUG[name.toLowerCase()] ?? null;
}
