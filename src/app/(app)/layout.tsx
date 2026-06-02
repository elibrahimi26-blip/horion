import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { NotificationsBell } from "@/components/layout/notifications-bell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-dvh bg-background">
      <TopBar isAdmin={isAdmin} notifications={<NotificationsBell />} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-6 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
