import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RunSession } from "@/components/workout/run-session";
import { getWorkoutWithCurrentVersion } from "@/features/workouts/queries";

// Le contenu de la session est dynamique : ne pas mettre en cache.
export const dynamic = "force-dynamic";

export default async function RunWorkoutPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workout = await getWorkoutWithCurrentVersion(params.id, session.user.id);
  if (!workout) notFound();

  // Pour l'instant, seuls l'auteur peut lancer une séance.
  // (À élargir aux séances enregistrées dans un futur sprint.)
  if (workout.authorId !== session.user.id) {
    redirect(`/workouts/${workout.id}`);
  }

  const currentVersion = workout.versions[0];
  if (!currentVersion) notFound();

  // Récupère ou crée une session active pour ce user + ce workout.
  // Une session reste "active" tant que endedAt est null.
  let activeSession = await db.workoutSession.findFirst({
    where: {
      userId: session.user.id,
      workoutId: workout.id,
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
    include: {
      sets: { select: { exerciseId: true, setNumber: true } },
    },
  });

  if (!activeSession) {
    activeSession = await db.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutId: workout.id,
        workoutVersionId: currentVersion.id,
      },
      include: {
        sets: { select: { exerciseId: true, setNumber: true } },
      },
    });
  }

  return (
    <RunSession
      workout={{ id: workout.id, name: workout.name }}
      exercises={currentVersion.exercises.map((ex) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.exercise.name,
        isCardio: ex.exercise.isCardio,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeightKg: ex.targetWeightKg,
        restSeconds: ex.restSeconds,
        notes: ex.notes,
      }))}
      sessionId={activeSession.id}
      sessionStartedAt={activeSession.startedAt.toISOString()}
      existingSets={activeSession.sets}
    />
  );
}
