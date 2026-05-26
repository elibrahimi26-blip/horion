import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        Bienvenue {session?.user?.name ?? ""}
      </h2>
      <p className="text-muted-foreground">
        Ton dashboard sera rempli de stats, graphiques et streak. Sprint 6
        ajoutera les composants visuels.
      </p>
    </div>
  );
}
