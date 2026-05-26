import { getXpProgress } from "@/features/xp/levels";

export function XpProgress({ totalXp }: { totalXp: number }) {
  const p = getXpProgress(totalXp);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Niveau {p.level}</span>
        {p.isMaxLevel ? (
          <span className="text-muted-foreground">Niveau max atteint</span>
        ) : (
          <span className="tabular-nums text-muted-foreground">
            {p.xpInLevel} / {p.xpForNextLevel} XP
          </span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${p.percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Total : {p.totalXp.toLocaleString("fr-FR")} XP
      </p>
    </div>
  );
}
