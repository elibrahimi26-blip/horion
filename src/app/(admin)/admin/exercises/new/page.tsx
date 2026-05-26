import Link from "next/link";
import { ExerciseForm } from "@/components/admin/exercise-form";
import { createExerciseAction } from "@/features/exercises/actions";
import { listMuscleGroups } from "@/features/exercises/queries";

export default async function NewExercisePage() {
  const muscleGroups = await listMuscleGroups();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/exercises"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Retour
        </Link>
        <h2 className="text-2xl font-bold">Nouvel exercice</h2>
      </div>

      <ExerciseForm
        muscleGroups={muscleGroups}
        action={createExerciseAction}
        submitLabel="Créer l'exercice"
      />
    </div>
  );
}
