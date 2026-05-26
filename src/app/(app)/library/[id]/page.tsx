import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseById } from "@/features/exercises/queries";

export default async function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const exercise = await getExerciseById(params.id);
  if (!exercise || exercise.archivedAt) notFound();

  const primary = exercise.muscles.find((m) => m.isPrimary);
  const secondary = exercise.muscles.filter((m) => !m.isPrimary);

  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Bibliothèque
      </Link>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>
        {exercise.isCardio ? (
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
            cardio
          </span>
        ) : null}
      </div>

      {exercise.description ? (
        <p className="whitespace-pre-wrap text-sm">{exercise.description}</p>
      ) : null}

      <div className="space-y-2 rounded-md border p-4">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Muscles ciblés
        </h3>
        {primary ? (
          <p className="text-sm">
            <span className="font-medium">Principal :</span>{" "}
            {primary.muscleGroup.name}
          </p>
        ) : null}
        {secondary.length > 0 ? (
          <p className="text-sm">
            <span className="font-medium">Secondaires :</span>{" "}
            {secondary.map((s) => s.muscleGroup.name).join(", ")}
          </p>
        ) : null}
      </div>

      {exercise.estimatedSeconds ? (
        <p className="text-sm text-muted-foreground">
          Durée estimée : {Math.round(exercise.estimatedSeconds / 60)} min
        </p>
      ) : null}
    </div>
  );
}
