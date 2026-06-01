import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WorkoutForm } from "@/components/workout/workout-form";
import { updateWorkoutAction } from "@/features/workouts/actions";
import {
  listActiveExercises,
  listMuscleGroups,
} from "@/features/exercises/queries";
import { getWorkoutWithCurrentVersion } from "@/features/workouts/queries";
import { toPickerExercises, toPickerMuscles } from "@/features/workouts/picker";

export default async function EditWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [workout, exercises, muscleGroups] = await Promise.all([
    getWorkoutWithCurrentVersion(params.id, session.user.id),
    listActiveExercises(),
    listMuscleGroups(),
  ]);

  if (!workout || workout.authorId !== session.user.id) notFound();

  const currentVersion = workout.versions[0];
  if (!currentVersion) notFound();

  const lines = currentVersion.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    exerciseName: e.exercise.nameFr ?? e.exercise.name,
    isCardio: e.exercise.isCardio,
    targetSets: e.targetSets,
    targetReps: e.targetReps ?? "",
    targetWeightKg:
      e.targetWeightKg !== null ? String(e.targetWeightKg) : "",
    restSeconds: e.restSeconds !== null ? String(e.restSeconds) : "",
    notes: e.notes ?? "",
  }));

  const boundAction = updateWorkoutAction.bind(null, workout.id);

  return (
    <div className="space-y-6">
      <Link
        href={`/workouts/${workout.id}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Détail séance
      </Link>

      <div>
        <h2 className="text-2xl font-bold">Modifier {workout.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette modification crée une nouvelle version. Les sessions déjà
          effectuées gardent l&apos;ancienne version pour préserver les stats.
        </p>
      </div>

      <WorkoutForm
        exercises={toPickerExercises(exercises)}
        muscleGroups={toPickerMuscles(muscleGroups, exercises)}
        initialValues={{
          name: workout.name,
          description: workout.description ?? "",
          visibility: workout.visibility,
          lines,
        }}
        action={boundAction}
        submitLabel={`Enregistrer (v${workout.currentVersion + 1})`}
      />
    </div>
  );
}
