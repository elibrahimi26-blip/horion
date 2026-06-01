import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExerciseRow } from "@/components/admin/exercise-row";
import { listExercisesForAdmin } from "@/features/exercises/queries";

export const dynamic = "force-dynamic";

export default async function AdminExercisesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const exercises = await listExercisesForAdmin();
  const search = (searchParams.q ?? "").trim().toLowerCase();

  const filtered = search
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          (e.nameFr?.toLowerCase().includes(search) ?? false),
      )
    : exercises;

  const visible = filtered.filter((e) => !e.archivedAt && e.isVisible);
  const hidden = filtered.filter((e) => !e.archivedAt && !e.isVisible);
  const archived = filtered.filter((e) => e.archivedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Exercices ({exercises.length})</h2>
        <Button asChild>
          <Link href="/admin/exercises/new">Nouvel exercice</Link>
        </Button>
      </div>

      <form className="flex gap-2" action="/admin/exercises">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher (nom EN/FR)…"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline">
          Filtrer
        </Button>
        {search ? (
          <Button asChild variant="ghost">
            <Link href="/admin/exercises">Réinitialiser</Link>
          </Button>
        ) : null}
      </form>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Visibles ({visible.length})
        </h3>
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun exercice visible.
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </section>

      {hidden.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            En attente d&apos;approbation ({hidden.length})
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Imports yuhonas en attente. Active ceux que tu veux exposer aux
            membres après avoir ajouté un nom français.
          </p>
          <div className="space-y-2">
            {hidden.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </div>
        </section>
      ) : null}

      {archived.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            Archivés ({archived.length})
          </h3>
          <div className="space-y-2">
            {archived.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
