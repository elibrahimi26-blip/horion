"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  BookOpen,
  Newspaper,
  Calendar,
  MessageSquare,
  LifeBuoy,
  User,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
};

const NAV: NavLink[] = [
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
  {
    href: "/library",
    label: "Bibliothèque",
    icon: BookOpen,
    match: (p) => p.startsWith("/library"),
  },
  {
    href: "/calendar",
    label: "Calendrier",
    icon: Calendar,
    match: (p) => p.startsWith("/calendar"),
  },
  {
    href: "/social",
    label: "Flux",
    icon: Newspaper,
    match: (p) => p.startsWith("/social"),
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageSquare,
    match: (p) => p.startsWith("/messages"),
  },
  {
    href: "/support",
    label: "Support",
    icon: LifeBuoy,
    match: (p) => p.startsWith("/support"),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export function TopBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight md:text-xl"
        >
          Horion
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href="/admin/dashboard"
              className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 md:inline-flex"
              title="Panel admin"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          ) : null}
          <ThemeToggle className="hidden sm:inline-flex" />
          <NotificationsBell />
          <div className="hidden md:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
