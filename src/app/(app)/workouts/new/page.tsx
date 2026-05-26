import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WorkoutForm } from "@/components/workout/workout-form";
import { createWorkoutAction } from "@/features/workouts/actions";
import { listActiveExercises } from "@/features/exercises/queries";

export default async function NewWorkoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const exercises = await listActiveExercises();
  const options = exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    isCardio: ex.isCardio,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Nouvelle séance</h2>
      <WorkoutForm
        exercises={options}
        action={createWorkoutAction}
        submitLabel="Créer la séance"
      />
    </div>
  );
}
