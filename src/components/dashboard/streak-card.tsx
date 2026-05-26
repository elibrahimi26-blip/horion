type Props = { streak: number };

export function StreakCard({ streak }: Props) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Série en cours
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-bold tabular-nums">{streak}</p>
        <p className="text-sm text-muted-foreground">
          jour{streak > 1 ? "s" : ""} d&apos;affilée
        </p>
      </div>
      {streak === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Termine une séance pour démarrer une série.
        </p>
      ) : streak >= 7 ? (
        <p className="mt-1 text-xs text-green-700">
          🔥 Série de plus d&apos;une semaine, continue !
        </p>
      ) : null}
    </div>
  );
}
