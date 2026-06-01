import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WorkoutForm } from "@/components/workout/workout-form";
import { createWorkoutAction } from "@/features/workouts/actions";
import {
  listActiveExercises,
  listMuscleGroups,
} from "@/features/exercises/queries";
import { toPickerExercises, toPickerMuscles } from "@/features/workouts/picker";

export default async function NewWorkoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [exercises, muscleGroups] = await Promise.all([
    listActiveExercises(),
    listMuscleGroups(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Nouvelle séance</h2>
      <WorkoutForm
        exercises={toPickerExercises(exercises)}
        muscleGroups={toPickerMuscles(muscleGroups, exercises)}
        action={createWorkoutAction}
        submitLabel="Créer la séance"
      />
    </div>
  );
}
