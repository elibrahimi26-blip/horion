import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateTicketForm } from "@/components/support/create-ticket-form";
import { listMyTickets } from "@/features/support/queries";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tickets = await listMyTickets(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Support</h2>
        <p className="text-sm text-muted-foreground">
          Une question, un bug, une suggestion ? Ouvre un ticket — l&apos;admin
          te répondra.
        </p>
      </div>

      <CreateTicketForm />

      {tickets.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">
            Mes tickets
          </h3>
          {tickets.map((t) => {
            const last = t.messages[0];
            return (
              <Link
                key={t.id}
                href={`/support/${t.id}`}
                className="block rounded-md border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{t.subject}</p>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs",
                      t.status === "OPEN"
                        ? "bg-green-100 text-green-900"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t.status === "OPEN" ? "ouvert" : "fermé"}
                  </span>
                </div>
                {last ? (
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {last.body}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelative(t.lastMessageAt)}
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
