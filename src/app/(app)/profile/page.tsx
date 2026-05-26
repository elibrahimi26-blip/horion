import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpProgress } from "@/components/shared/xp-progress";
import { listXpEvents, sumUserXp } from "@/features/xp/service";
import { XP_LABELS } from "@/features/xp/events";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, totalXp, xpEvents] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        username: true,
        email: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    sumUserXp(session.user.id),
    listXpEvents(session.user.id, 20),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold">Profil</h2>
        <Button asChild size="sm" variant="outline">
          <Link href="/profile/settings">Modifier</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-md border p-6">
        <LevelBadge totalXp={totalXp} size="lg" />
        <div className="flex-1 space-y-1">
          <p className="text-lg font-semibold">{user.username}</p>
          <p className="text-xs text-muted-foreground">
            Membre depuis {dateFmt.format(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="rounded-md border p-6">
        <XpProgress totalXp={totalXp} />
      </div>

      <div className="space-y-4 rounded-md border p-6">
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
      </div>

      {xpEvents.length > 0 ? (
        <div className="space-y-3 rounded-md border p-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Historique XP (20 derniers)
          </h3>
          <ul className="space-y-1">
            {xpEvents.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{XP_LABELS[e.type]}</span>
                <span className="flex gap-3">
                  <span className="text-xs text-muted-foreground">
                    {dateTimeFmt.format(e.createdAt)}
                  </span>
                  <span className="font-medium text-primary tabular-nums">
                    +{e.amount} XP
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
