import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseById } from "@/features/exercises/queries";

export default async function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const exercise = await getExerciseById(params.id);
  if (!exercise || exercise.archivedAt || !exercise.isVisible) notFound();

  const primary = exercise.muscles.find((m) => m.isPrimary);
  const secondary = exercise.muscles.filter((m) => !m.isPrimary);
  const displayName = exercise.nameFr ?? exercise.name;
  const heroImage = exercise.mediaUrl
    ? exercise.mediaUrl
    : exercise.imagePaths[0]
      ? `/api/exercise-images/${exercise.imagePaths[0]}`
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Bibliothèque
      </Link>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{displayName}</h2>
        {exercise.isCardio ? (
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
            cardio
          </span>
        ) : null}
      </div>

      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImage}
          alt={displayName}
          className="w-full max-w-xl rounded-md border object-contain"
        />
      ) : null}

      {exercise.description ? (
        <p className="whitespace-pre-wrap text-sm">{exercise.description}</p>
      ) : null}

      {exercise.instructions.length > 0 ? (
        <div className="space-y-2 rounded-md border p-4">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Instructions
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            {exercise.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
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

      {(exercise.equipment || exercise.level || exercise.mechanic || exercise.force) ? (
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {exercise.equipment ? (
            <Tag label="Équipement" value={exercise.equipment} />
          ) : null}
          {exercise.level ? <Tag label="Niveau" value={exercise.level} /> : null}
          {exercise.mechanic ? (
            <Tag label="Mécanique" value={exercise.mechanic} />
          ) : null}
          {exercise.force ? <Tag label="Force" value={exercise.force} /> : null}
        </div>
      ) : null}

      {exercise.estimatedSeconds ? (
        <p className="text-sm text-muted-foreground">
          Durée estimée : {Math.round(exercise.estimatedSeconds / 60)} min
        </p>
      ) : null}
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
