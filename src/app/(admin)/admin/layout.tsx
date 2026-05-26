import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN" || session.user.status !== "ACTIVE") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <h1 className="text-lg font-bold">
            Horion <span className="text-muted-foreground">· Admin</span>
          </h1>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/users" className="hover:underline">
              Membres
            </Link>
            <Link href="/admin/exercises" className="hover:underline">
              Exercices
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:underline"
            >
              ← Mon espace
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
