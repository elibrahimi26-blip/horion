import type {
  PickerExercise,
  PickerMuscle,
} from "@/components/workout/exercise-picker-modal";
import type { ExerciseWithMuscles } from "@/features/exercises/queries";

type MuscleGroupRow = {
  slug: string;
  name: string;
  bodyPart: string;
};

export function toPickerExercises(
  exercises: ExerciseWithMuscles[],
): PickerExercise[] {
  return exercises.map((ex) => {
    const displayName = ex.nameFr ?? ex.name;
    const primary = ex.muscles.filter((m) => m.isPrimary);
    return {
      id: ex.id,
      name: displayName,
      searchName: `${displayName} ${ex.name}`,
      isCardio: ex.isCardio,
      thumbnail: ex.imagePaths[0] ?? null,
      level: ex.level,
      primaryMuscleSlugs: primary.map((m) => m.muscleGroup.slug),
      primaryMuscleNames: primary.map((m) => m.muscleGroup.name),
    };
  });
}

// Ne renvoie que les muscles effectivement référencés par au moins un exercice
// actif — évite d'afficher des filtres vides dans le picker.
export function toPickerMuscles(
  muscleGroups: MuscleGroupRow[],
  exercises: ExerciseWithMuscles[],
): PickerMuscle[] {
  const used = new Set<string>();
  for (const ex of exercises) {
    for (const m of ex.muscles) {
      if (m.isPrimary) used.add(m.muscleGroup.slug);
    }
  }
  return muscleGroups
    .filter((m) => used.has(m.slug))
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      bodyPart: m.bodyPart as "upper" | "core" | "lower",
    }));
}
