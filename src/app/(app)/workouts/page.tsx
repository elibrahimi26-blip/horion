import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/workout/workout-card";
import { auth } from "@/lib/auth";
import {
  listMyWorkouts,
  listSavedWorkouts,
} from "@/features/workouts/queries";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "mine" as const, label: "Mes séances", href: "/workouts" },
  { id: "saved" as const, label: "Enregistrées", href: "/workouts?tab=saved" },
];

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tab = searchParams.tab === "saved" ? "saved" : "mine";

  const workouts =
    tab === "mine"
      ? await listMyWorkouts(session.user.id)
      : await listSavedWorkouts(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Séances</h2>
        <Button asChild>
          <Link href="/workouts/new">Nouvelle séance</Link>
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "px-4 py-2 text-sm transition-colors",
              tab === t.id
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "mine"
              ? "Tu n'as pas encore créé de séance."
              : "Tu n'as pas encore enregistré de séance partagée."}
          </p>
          {tab === "mine" ? (
            <Button asChild className="mt-4">
              <Link href="/workouts/new">Créer ma première séance</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </div>
  );
}
