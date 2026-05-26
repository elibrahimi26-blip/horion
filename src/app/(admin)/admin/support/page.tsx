import Link from "next/link";
import {
  countTicketsByStatus,
  listAllTickets,
} from "@/features/support/queries";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "OPEN" as const, label: "Ouverts", href: "/admin/support" },
  {
    id: "CLOSED" as const,
    label: "Fermés",
    href: "/admin/support?status=closed",
  },
];

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filter = searchParams.status === "closed" ? "CLOSED" : "OPEN";
  const [tickets, counts] = await Promise.all([
    listAllTickets(filter),
    countTicketsByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tickets de support</h2>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "px-4 py-2 text-sm transition-colors",
              filter === t.id
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label} ({t.id === "OPEN" ? counts.open : counts.closed})
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {filter === "OPEN"
            ? "Aucun ticket en cours."
            : "Aucun ticket fermé."}
        </p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/support/${t.id}`}
              className="block rounded-md border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">{t.subject}</p>
                <span className="text-xs text-muted-foreground">
                  {formatRelative(t.lastMessageAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                par {t.user.username}
              </p>
              {t.messages[0] ? (
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {t.messages[0].body}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
