import { getLevelFromXp } from "@/features/xp/levels";
import { cn } from "@/lib/utils";

type Props = {
  totalXp: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-base",
} as const;

export function LevelBadge({ totalXp, size = "md", className }: Props) {
  const level = getLevelFromXp(totalXp);
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground",
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={`Niveau ${level}`}
      title={`Niveau ${level} · ${totalXp} XP`}
    >
      {level}
    </div>
  );
}
