import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
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
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/dashboard" className="text-lg font-bold">
            Horion
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/workouts" className="hover:underline">
              Séances
            </Link>
            <Link href="/calendar" className="hover:underline">
              Calendrier
            </Link>
            <Link href="/social" className="hover:underline">
              Flux
            </Link>
            <Link href="/library" className="hover:underline">
              Bibliothèque
            </Link>
            <Link href="/messages" className="hover:underline">
              Messages
            </Link>
            <Link href="/profile" className="hover:underline">
              Profil
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/dashboard"
                className="rounded bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20"
              >
                Admin
              </Link>
            ) : null}
            <NotificationsBell />
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
