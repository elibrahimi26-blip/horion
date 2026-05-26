import Link from "next/link";

type Props = {
  exercise: {
    id: string;
    name: string;
    isCardio: boolean;
    muscles: {
      isPrimary: boolean;
      muscleGroup: { name: string; slug: string };
    }[];
  };
};

export function ExerciseCard({ exercise }: Props) {
  const primary = exercise.muscles.find((m) => m.isPrimary);

  return (
    <Link
      href={`/library/${exercise.id}`}
      className="block rounded-md border p-4 transition-colors hover:bg-accent"
    >
      <p className="font-medium">{exercise.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {primary?.muscleGroup.name ?? "—"}
        {exercise.isCardio ? " · cardio" : ""}
      </p>
    </Link>
  );
}
