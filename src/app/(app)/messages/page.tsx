import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
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
      <h2 className="text-2xl font-bold">Messages</h2>

      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title="Aucune conversation"
          description="Démarre une discussion en cliquant sur l'avatar d'un membre depuis une séance publique du flux."
          action={
            <Button asChild variant="outline">
              <Link href="/social">Aller sur le flux</Link>
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
