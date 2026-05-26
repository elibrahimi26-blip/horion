import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold">Profil</h2>
        <Button asChild size="sm" variant="outline">
          <Link href="/profile/settings">Modifier</Link>
        </Button>
      </div>

      <div className="space-y-4 rounded-md border p-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Pseudo
          </p>
          <p className="text-lg font-medium">{user.username}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <p className="text-sm">{user.email}</p>
        </div>
        {user.bio ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Bio
            </p>
            <p className="whitespace-pre-wrap text-sm">{user.bio}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Membre depuis
          </p>
          <p className="text-sm">{dateFmt.format(user.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
