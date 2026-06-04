import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Scale } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { WeightInput } from "@/components/dashboard/weight-input";
import { WeightHistoryRow } from "@/components/dashboard/weight-history-row";
import { ResetWeightsButton } from "@/components/profile/reset-weights-button";

export default async function WeightHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const entries = await db.bodyWeightEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { recordedAt: "desc" },
  });

  const latestKg = entries[0]?.weightKg ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suivi du poids</h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/profile">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Profil
          </Link>
        </Button>
      </div>

      <div className="rounded-md border p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Ajouter une mesure
        </h3>
        <WeightInput latestKg={latestKg} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Historique ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <EmptyState
            icon={<Scale className="h-6 w-6" />}
            title="Aucune mesure"
            description="Ajoute ta première pesée avec le formulaire ci-dessus pour visualiser ta progression."
          />
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <WeightHistoryRow key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>

      <ResetWeightsButton count={entries.length} />
    </div>
  );
}
