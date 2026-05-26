import { cn } from "@/lib/utils";

type MuscleStat = {
  slug: string;
  name: string;
  bodyPart: string;
  volume: number;
  sets: number;
};

type Props = {
  data: MuscleStat[];
  windowDays: number;
};

const BODY_PART_LABELS: Record<string, string> = {
  upper: "Haut du corps",
  core: "Tronc",
  lower: "Bas du corps",
};

// Décision archi §16 #1 : SVG anatomique remis à plus tard.
// On utilise une grille colorée par intensité de volume relatif.
export function MuscleHeatmap({ data, windowDays }: Props) {
  const maxVolume = Math.max(1, ...data.map((m) => m.volume));

  const byBodyPart = new Map<string, MuscleStat[]>();
  for (const m of data) {
    const arr = byBodyPart.get(m.bodyPart) ?? [];
    arr.push(m);
    byBodyPart.set(m.bodyPart, arr);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
          Muscles travaillés
        </h3>
        <p className="text-xs text-muted-foreground">
          {windowDays} derniers jours
        </p>
      </div>

      {data.every((m) => m.volume === 0) ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Pas encore d&apos;activité. Termine des séances pour voir tes muscles
          travaillés.
        </p>
      ) : (
        <div className="space-y-4">
          {["upper", "core", "lower"].map((bp) => {
            const muscles = byBodyPart.get(bp);
            if (!muscles || muscles.length === 0) return null;
            return (
              <div key={bp} className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  {BODY_PART_LABELS[bp] ?? bp}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {muscles.map((m) => {
                    const intensity = m.volume / maxVolume; // 0..1
                    return (
                      <div
                        key={m.slug}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors",
                          intensity === 0 ? "bg-muted/30" : "",
                        )}
                        style={
                          intensity > 0
                            ? {
                                backgroundColor: `hsl(var(--primary) / ${0.08 + intensity * 0.4})`,
                                borderColor: `hsl(var(--primary) / ${0.2 + intensity * 0.5})`,
                              }
                            : undefined
                        }
                        title={`${m.name} · ${m.volume.toLocaleString("fr-FR")} kg·reps · ${m.sets} séries`}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {m.sets}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
