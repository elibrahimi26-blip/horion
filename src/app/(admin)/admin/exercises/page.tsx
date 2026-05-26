import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExerciseRow } from "@/components/admin/exercise-row";
import { listExercisesForAdmin } from "@/features/exercises/queries";

export default async function AdminExercisesPage() {
  const exercises = await listExercisesForAdmin();
  const active = exercises.filter((e) => !e.archivedAt);
  const archived = exercises.filter((e) => e.archivedAt);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Exercices</h2>
        <Button asChild>
          <Link href="/admin/exercises/new">Nouvel exercice</Link>
        </Button>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Actifs ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun exercice actif.</p>
        ) : (
          <div className="space-y-2">
            {active.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </div>
        )}
      </section>

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
