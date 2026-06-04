import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { listMyThreads } from "@/features/messaging/queries";
import { ThreadListItem } from "@/components/messaging/thread-list-item";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const threads = await listMyThreads(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Messages</h2>
        <Button asChild size="sm">
          <Link href="/messages/new">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau
          </Link>
        </Button>
      </div>

      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="Aucune conversation"
          description="Démarre une conversation en recherchant un membre, ou depuis une séance publique du flux."
          action={
            <Button asChild>
              <Link href="/messages/new">Démarrer une conversation</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <ThreadListItem
              key={t.id}
              thread={t}
              currentUserId={session.user.id}
              hrefBase="/messages"
            />
          ))}
        </div>
      )}
    </div>
  );
}
