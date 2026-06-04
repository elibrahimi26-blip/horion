import Link from "next/link";
import { redirect } from "next/navigation";
import { Share2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SocialCard } from "@/components/social/social-card";
import { listPublicWorkouts } from "@/features/social/queries";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { items, nextCursor } = await listPublicWorkouts(session.user.id);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Share2 className="h-6 w-6" />}
        title="Aucune séance partagée"
        description="Sois le premier à partager ! Passe une de tes séances en mode « public » depuis l'édition pour qu'elle apparaisse ici."
        action={
          <Button asChild variant="outline">
            <Link href="/workouts">Voir mes séances</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((w) => (
        <SocialCard
          key={w.id}
          workout={w}
          currentUserId={session.user.id}
        />
      ))}
      {nextCursor ? (
        <p className="text-center text-xs text-muted-foreground">
          {items.length} séances affichées. Pagination infinie à venir.
        </p>
      ) : null}
    </div>
  );
}
