import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [pendingCount, activeCount, totalCount] = await Promise.all([
    db.user.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard admin</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Actifs</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </div>
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">Total membres</p>
          <p className="text-2xl font-bold">{totalCount}</p>
        </div>
      </div>

      {pendingCount > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <Link href="/admin/users" className="font-medium underline">
              {pendingCount} demande{pendingCount > 1 ? "s" : ""} d&apos;inscription
            </Link>{" "}
            en attente de validation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
