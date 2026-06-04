"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/social", label: "Séances", icon: Dumbbell, exact: true },
  { href: "/social/alimentation", label: "Alimentation", icon: Apple, exact: false },
] as const;

export function SocialTabs() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Sections Flux">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
