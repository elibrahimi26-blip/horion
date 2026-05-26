import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TicketConversation } from "@/components/support/ticket-conversation";
import { getTicket } from "@/features/support/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: { threadId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const ticket = await getTicket(params.threadId, session.user.id, isAdmin);
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/support"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Mes tickets
      </Link>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{ticket.subject}</h2>
        <p className="text-sm">
          Statut :{" "}
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs",
              ticket.status === "OPEN"
                ? "bg-green-100 text-green-900"
                : "bg-muted text-muted-foreground",
            )}
          >
            {ticket.status === "OPEN" ? "ouvert" : "fermé"}
          </span>
        </p>
      </div>

      <TicketConversation
        threadId={ticket.id}
        messages={ticket.messages}
        currentUserId={session.user.id}
        status={ticket.status}
      />
    </div>
  );
}
