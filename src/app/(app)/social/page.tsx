import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SocialCard } from "@/components/social/social-card";
import { listPublicWorkouts } from "@/features/social/queries";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workouts = await listPublicWorkouts(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Flux communautaire</h2>
        <p className="text-sm text-muted-foreground">
          Les séances rendues publiques par les membres du groupe.
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune séance publique pour l&apos;instant. Sois le premier à partager
          en passant une de tes séances en mode &laquo; public &raquo;.
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <SocialCard
              key={w.id}
              workout={w}
              currentUserId={session.user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
