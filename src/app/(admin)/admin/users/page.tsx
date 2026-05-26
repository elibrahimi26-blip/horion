import { db } from "@/lib/db";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      usernameLocked: true,
      usernameChangesCount: true,
    },
  });

  const pending = users.filter((u) => u.status === "PENDING");
  const active = users.filter((u) => u.status === "ACTIVE");
  const suspended = users.filter((u) => u.status === "SUSPENDED");

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Membres</h2>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          En attente ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune demande en attente.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Actifs ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun membre actif.</p>
        ) : (
          <div className="space-y-2">
            {active.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        )}
      </section>

      {suspended.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
            Suspendus ({suspended.length})
          </h3>
          <div className="space-y-2">
            {suspended.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
