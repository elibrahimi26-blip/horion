import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Conversation } from "@/components/messaging/conversation";
import { getThread } from "@/features/messaging/queries";

export const dynamic = "force-dynamic";

export default async function MemberConversationPage({
  params,
}: {
  params: { threadId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Auto-mark des messages comme lus avant le fetch (le viewer ouvre
  // le thread → toutes les messages des autres sont marqués lus)
  await db.privateMessage.updateMany({
    where: {
      threadId: params.threadId,
      senderId: { not: session.user.id },
      readAt: null,
      thread: {
        OR: [{ memberId: session.user.id }, { adminId: session.user.id }],
      },
    },
    data: { readAt: new Date() },
  });

  const thread = await getThread(params.threadId, session.user.id);
  if (!thread) notFound();

  const otherPerson =
    thread.member.id === session.user.id ? thread.admin : thread.member;

  return (
    <div className="space-y-6">
      <Link
        href="/messages"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Conversations
      </Link>

      <h2 className="text-2xl font-bold">{otherPerson.username}</h2>

      <Conversation
        threadId={thread.id}
        messages={thread.messages}
        currentUserId={session.user.id}
        otherPersonName={otherPerson.username}
      />
    </div>
  );
}
