import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SocialCard } from "@/components/social/social-card";
import { listPublicWorkouts } from "@/features/social/queries";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { items, nextCursor } = await listPublicWorkouts(session.user.id);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Aucune séance publique pour l&apos;instant. Sois le premier à partager
        en passant une de tes séances en mode &laquo; public &raquo;.
      </div>
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
