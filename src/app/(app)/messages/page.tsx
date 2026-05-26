import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listMyThreads } from "@/features/messaging/queries";
import { ThreadListItem } from "@/components/messaging/thread-list-item";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role === "ADMIN" ? "ADMIN" : "MEMBER";
  const threads = await listMyThreads(session.user.id, role);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Messages</h2>

      {threads.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune conversation. L&apos;admin peut démarrer une discussion avec
          toi quand il le souhaite.
        </p>
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
