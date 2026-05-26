import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseForm } from "@/components/admin/exercise-form";
import { updateExerciseAction } from "@/features/exercises/actions";
import {
  getExerciseById,
  listMuscleGroups,
} from "@/features/exercises/queries";

export default async function EditExercisePage({
  params,
}: {
  params: { id: string };
}) {
  const [exercise, muscleGroups] = await Promise.all([
    getExerciseById(params.id),
    listMuscleGroups(),
  ]);

  if (!exercise) {
    notFound();
  }

  const boundAction = updateExerciseAction.bind(null, exercise.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/exercises"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Retour
        </Link>
        <h2 className="text-2xl font-bold">Éditer {exercise.name}</h2>
      </div>

      <ExerciseForm
        muscleGroups={muscleGroups}
        exercise={{
          name: exercise.name,
          description: exercise.description,
          isCardio: exercise.isCardio,
          estimatedSeconds: exercise.estimatedSeconds,
          muscles: exercise.muscles.map((m) => ({
            muscleGroupId: m.muscleGroupId,
            isPrimary: m.isPrimary,
          })),
        }}
        action={boundAction}
        submitLabel="Mettre à jour"
      />
    </div>
  );
}
