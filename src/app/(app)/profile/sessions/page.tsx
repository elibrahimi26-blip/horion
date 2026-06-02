import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { SessionHistoryRow } from "@/components/profile/session-history-row";
import { ResetSessionsButton } from "@/components/profile/reset-sessions-button";

export default async function ProfileSessionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessions = await db.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 200,
    include: {
      workout: { select: { name: true } },
      _count: { select: { sets: true } },
    },
  });

  const items = sessions.map((s) => ({
    id: s.id,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    durationSec: s.durationSec,
    setsCount: s._count.sets,
    workoutName: s.workout.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mes séances</h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profil
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Historique ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            Aucune séance enregistrée.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((s) => (
              <SessionHistoryRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>

      <ResetSessionsButton count={items.length} />
    </div>
  );
}
