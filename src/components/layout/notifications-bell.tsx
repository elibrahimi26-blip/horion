import Link from "next/link";
import { auth } from "@/lib/auth";
import { countUnreadNotifications } from "@/features/notifications/queries";

export async function NotificationsBell() {
  const session = await auth();
  if (!session?.user) return null;

  const count = await countUnreadNotifications(session.user.id);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center text-base hover:opacity-80"
      aria-label={
        count > 0
          ? `${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}`
          : "Notifications"
      }
    >
      <span>🔔</span>
      {count > 0 ? (
        <span className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium leading-none text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
