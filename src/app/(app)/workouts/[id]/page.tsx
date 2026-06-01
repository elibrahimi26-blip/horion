import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkoutActions } from "@/components/workout/workout-actions";
import { WorkoutSocialActions } from "@/components/workout/workout-social-actions";
import { auth } from "@/lib/auth";
import { getWorkoutWithCurrentVersion } from "@/features/workouts/queries";
import { getWorkoutSocialState } from "@/features/social/queries";

export default async function WorkoutDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workout = await getWorkoutWithCurrentVersion(params.id, session.user.id);
  if (!workout) notFound();

  const currentVersion = workout.versions[0];
  if (!currentVersion) notFound();

  const isAuthor = workout.authorId === session.user.id;
  const social =
    workout.visibility === "PUBLIC"
      ? await getWorkoutSocialState(workout.id, session.user.id)
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/workouts"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Séances
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{workout.name}</h2>
          {!isAuthor && workout.author ? (
            <p className="text-sm text-muted-foreground">
              par {workout.author.username}
            </p>
          ) : null}
          {workout.visibility === "PUBLIC" ? (
            <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              public
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {social ? (
            <WorkoutSocialActions
              workoutId={workout.id}
              likeCount={social.likeCount}
              saveCount={social.saveCount}
              likedByMe={social.likedByMe}
              savedByMe={social.savedByMe}
              isAuthor={isAuthor}
            />
          ) : null}
          {isAuthor ? (
            <>
              <Button asChild size="sm">
                <Link href={`/workouts/${workout.id}/run`}>Lancer la séance</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/workouts/${workout.id}/edit`}>Modifier</Link>
              </Button>
              <WorkoutActions
                workoutId={workout.id}
                currentVisibility={workout.visibility}
              />
            </>
          ) : null}
        </div>
      </div>

      {workout.description ? (
        <p className="whitespace-pre-wrap text-sm">{workout.description}</p>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Exercices ({currentVersion.exercises.length})
        </h3>
        <div className="space-y-2">
          {currentVersion.exercises.map((ex, i) => {
            const primary = ex.exercise.muscles.find((m) => m.isPrimary);
            return (
              <div key={ex.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {i + 1}.{" "}
                      <Link
                        href={`/library/${ex.exerciseId}`}
                        className="hover:underline"
                      >
                        {ex.exercise.nameFr ?? ex.exercise.name}
                      </Link>
                      {ex.exercise.isCardio ? (
                        <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-900">
                          cardio
                        </span>
                      ) : null}
                    </p>
                    {primary ? (
                      <p className="text-xs text-muted-foreground">
                        {primary.muscleGroup.name}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{ex.targetSets}</span>{" "}
                    série{ex.targetSets > 1 ? "s" : ""}
                    {ex.targetReps ? ` × ${ex.targetReps}` : ""}
                    {ex.targetWeightKg !== null
                      ? ` @ ${ex.targetWeightKg} kg`
                      : ""}
                  </p>
                </div>
                {ex.restSeconds !== null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Repos : {ex.restSeconds} sec
                  </p>
                ) : null}
                {ex.notes ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    {ex.notes}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
