import { auth } from "@/lib/auth";
import {
  listMembersForAdmin,
  listMyThreads,
} from "@/features/messaging/queries";
import { ThreadListItem } from "@/components/messaging/thread-list-item";
import { StartThreadList } from "@/components/messaging/start-thread-list";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [threads, members] = await Promise.all([
    listMyThreads(session.user.id, "ADMIN"),
    listMembersForAdmin(session.user.id),
  ]);

  const membersWithoutThread = members.filter((m) => !m.threadId);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Conversations privées</h2>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Conversations actives ({threads.length})
        </h3>
        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune conversation en cours.
          </p>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <ThreadListItem
                key={t.id}
                thread={t}
                currentUserId={session.user.id}
                hrefBase="/admin/messages"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Démarrer une conversation
        </h3>
        <StartThreadList members={membersWithoutThread} />
      </section>
    </div>
  );
}
