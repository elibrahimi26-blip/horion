"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Plus, Newspaper, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const ITEMS_LEFT: Item[] = [
  {
    href: "/dashboard",
    label: "Accueil",
    icon: Home,
    match: (p) => p === "/dashboard" || p === "/",
  },
  {
    href: "/workouts",
    label: "Séances",
    icon: Dumbbell,
    match: (p) => p.startsWith("/workouts"),
  },
];

const ITEMS_RIGHT: Item[] = [
  {
    href: "/social",
    label: "Flux",
    icon: Newspaper,
    match: (p) => p.startsWith("/social"),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl pb-safe md:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-md items-stretch justify-between px-2">
        {ITEMS_LEFT.map((it) => (
          <NavItem key={it.href} item={it} active={it.match(pathname)} />
        ))}

        <div className="flex w-16 items-center justify-center">
          <Link
            href="/workouts/new"
            aria-label="Créer une séance"
            className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lifted transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>

        {ITEMS_RIGHT.map((it) => (
          <NavItem key={it.href} item={it} active={it.match(pathname)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
      {item.label}
    </Link>
  );
}
