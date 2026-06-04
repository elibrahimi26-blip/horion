import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageUserButton } from "@/components/messaging/message-user-button";
import { searchUsers } from "@/features/messaging/queries";

export const dynamic = "force-dynamic";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const query = searchParams.q?.trim() ?? "";
  const results = query.length >= 2
    ? await searchUsers(query, session.user.id, 20)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nouveau message</h2>
        <Button asChild size="sm" variant="ghost">
          <Link href="/messages">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Messages
          </Link>
        </Button>
      </div>

      <form method="get" className="flex gap-2">
        <Input
          type="search"
          name="q"
          placeholder="Pseudo de l'utilisateur…"
          defaultValue={query}
          aria-label="Rechercher un utilisateur"
          minLength={2}
          autoFocus
        />
        <Button type="submit" variant="outline">
          <Search className="mr-1.5 h-4 w-4" />
          Rechercher
        </Button>
      </form>

      {query.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6" />}
          title="Trouve un membre"
          description="Tape au moins 2 caractères du pseudo recherché pour démarrer une conversation."
        />
      ) : query.length === 1 ? (
        <p className="text-sm text-muted-foreground">
          Tape au moins 2 caractères.
        </p>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Aucun résultat"
          description={`Aucun membre actif ne correspond à « ${query} ».`}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </p>
          {results.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-md border bg-card p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.username}</p>
                {u.role === "ADMIN" ? (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                    admin
                  </span>
                ) : null}
              </div>
              <MessageUserButton
                userId={u.id}
                label="Démarrer"
                variant="default"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
