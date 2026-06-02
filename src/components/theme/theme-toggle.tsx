"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options: {
    value: "light" | "dark" | "system";
    icon: React.ReactNode;
    label: string;
  }[] = [
    { value: "light", icon: <Sun className="h-3.5 w-3.5" />, label: "Clair" },
    { value: "system", icon: <Monitor className="h-3.5 w-3.5" />, label: "Auto" },
    { value: "dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Sombre" },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Thème"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={theme === opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            theme === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={opt.label}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
