import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { listNotifications } from "@/features/notifications/queries";
import {
  markAllNotificationsReadAction,
  openNotificationAction,
} from "@/features/notifications/actions";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await listNotifications(session.user.id);
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Notifications</h2>
        {hasUnread ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" size="sm" variant="outline">
              Tout marquer comme lu
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Aucune notification pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const isUnread = !n.readAt;
            return (
              <form
                key={n.id}
                action={openNotificationAction.bind(null, n.id)}
              >
                <button
                  type="submit"
                  className={cn(
                    "block w-full rounded-md border p-4 text-left transition-colors hover:bg-accent",
                    isUnread ? "border-primary/30 bg-accent/30" : "",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{n.title}</p>
                      {n.body ? (
                        <p className="text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      ) : null}
                      {isUnread ? (
                        <span className="inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary-foreground">
                          Non lu
                        </span>
                      ) : null}
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
