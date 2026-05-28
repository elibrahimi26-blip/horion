import Link from "next/link";

type Props = {
  exercise: {
    id: string;
    name: string;
    nameFr: string | null;
    isCardio: boolean;
    imagePaths: string[];
    mediaUrl: string | null;
    muscles: {
      isPrimary: boolean;
      muscleGroup: { name: string; slug: string };
    }[];
  };
};

export function ExerciseCard({ exercise }: Props) {
  const primary = exercise.muscles.find((m) => m.isPrimary);
  const displayName = exercise.nameFr ?? exercise.name;
  const imageSrc = exercise.mediaUrl
    ? exercise.mediaUrl
    : exercise.imagePaths[0]
      ? `/api/exercise-images/${exercise.imagePaths[0]}`
      : null;

  return (
    <Link
      href={`/library/${exercise.id}`}
      className="block overflow-hidden rounded-md border transition-colors hover:bg-accent"
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-square w-full bg-muted" aria-hidden />
      )}
      <div className="p-4">
        <p className="font-medium">{displayName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {primary?.muscleGroup.name ?? "—"}
          {exercise.isCardio ? " · cardio" : ""}
        </p>
      </div>
    </Link>
  );
}
