import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/library/exercise-card";
import {
  listActiveExercises,
  listMuscleGroups,
} from "@/features/exercises/queries";
import { cn } from "@/lib/utils";

type SearchParams = { muscle?: string; q?: string };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [exercises, muscleGroups] = await Promise.all([
    listActiveExercises(),
    listMuscleGroups(),
  ]);

  const muscleFilter = searchParams.muscle;
  const search = searchParams.q?.trim().toLowerCase();

  let filtered = exercises;
  if (muscleFilter) {
    filtered = filtered.filter((ex) =>
      ex.muscles.some((m) => m.muscleGroup.slug === muscleFilter),
    );
  }
  if (search) {
    filtered = filtered.filter(
      (ex) =>
        ex.name.toLowerCase().includes(search) ||
        (ex.nameFr?.toLowerCase().includes(search) ?? false),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bibliothèque d&apos;exercices</h2>
        <p className="text-sm text-muted-foreground">
          {exercises.length} exercices disponibles. Liste gérée par l&apos;admin.
        </p>
      </div>

      <form className="flex gap-2" method="get">
        <Input
          type="search"
          name="q"
          placeholder="Rechercher…"
          defaultValue={search}
          aria-label="Rechercher un exercice"
        />
        {muscleFilter ? (
          <input type="hidden" name="muscle" value={muscleFilter} />
        ) : null}
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <FilterPill
          href={search ? `/library?q=${encodeURIComponent(search)}` : "/library"}
          active={!muscleFilter}
        >
          Tous
        </FilterPill>
        {muscleGroups.map((m) => {
          const query = new URLSearchParams();
          query.set("muscle", m.slug);
          if (search) query.set("q", search);
          return (
            <FilterPill
              key={m.id}
              href={`/library?${query.toString()}`}
              active={muscleFilter === m.slug}
            >
              {m.name}
            </FilterPill>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun exercice trouvé.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}
