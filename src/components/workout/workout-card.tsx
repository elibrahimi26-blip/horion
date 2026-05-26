import Link from "next/link";

type Props = {
  workout: {
    id: string;
    name: string;
    description: string | null;
    visibility: "PRIVATE" | "PUBLIC";
    versions: { _count: { exercises: number } }[];
    _count: { sessions: number; likes: number; saves: number };
    author?: { username: string } | null;
  };
};

export function WorkoutCard({ workout }: Props) {
  const exerciseCount = workout.versions[0]?._count.exercises ?? 0;

  return (
    <Link
      href={`/workouts/${workout.id}`}
      className="block space-y-2 rounded-md border p-4 transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{workout.name}</p>
        {workout.visibility === "PUBLIC" ? (
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
            public
          </span>
        ) : null}
      </div>

      {workout.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {workout.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {exerciseCount} exercice{exerciseCount > 1 ? "s" : ""}
        </span>
        {workout._count.sessions > 0 ? (
          <span>
            {workout._count.sessions} session{workout._count.sessions > 1 ? "s" : ""}
          </span>
        ) : null}
        {workout.author ? <span>par {workout.author.username}</span> : null}
      </div>
    </Link>
  );
}
