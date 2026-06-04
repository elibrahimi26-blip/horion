import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/shared/level-badge";
import { XpProgress } from "@/components/shared/xp-progress";
import { PushNotificationsCard } from "@/components/profile/push-notifications-card";
import { listXpEvents, sumUserXp } from "@/features/xp/service";
import { XP_LABELS } from "@/features/xp/events";
import { formatDateMonthYear } from "@/lib/format";

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
            Membre depuis {formatDateMonthYear(user.createdAt)}
          </p>
        </div>
      </div>

      {session.user.role === "ADMIN" ? (
        <Link
          href="/admin/dashboard"
          className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Panel administrateur</p>
              <p className="text-xs text-muted-foreground">
                Gestion des membres, contenu et modération
              </p>
            </div>
          </div>
          <span className="text-primary">→</span>
        </Link>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/profile/weight"
          className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-muted"
        >
          <div>
            <p className="text-sm font-semibold">Suivi du poids</p>
            <p className="text-xs text-muted-foreground">
              Ajouter, modifier, supprimer
            </p>
          </div>
          <span>→</span>
        </Link>
        <Link
          href="/profile/sessions"
          className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-muted"
        >
          <div>
            <p className="text-sm font-semibold">Mes séances</p>
            <p className="text-xs text-muted-foreground">
              Historique et gestion
            </p>
          </div>
          <span>→</span>
        </Link>
      </div>

      <PushNotificationsCard />

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
