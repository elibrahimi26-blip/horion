import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { UserRow } from "@/components/follows/user-row";
import { listFollowing } from "@/features/follows/queries";

export const dynamic = "force-dynamic";

export default async function FollowingPage({
  params,
}: {
  params: { username: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { username: params.username },
    select: { id: true, username: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") notFound();

  const following = await listFollowing(user.id, session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{user.username} suit</h2>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/u/${user.username}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profil
          </Link>
        </Button>
      </div>

      {following.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Aucun abonnement"
          description={`${user.username} ne suit personne pour l'instant.`}
        />
      ) : (
        <div className="space-y-2">
          {following.map((u) => (
            <UserRow key={u.id} user={u} currentUserId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
