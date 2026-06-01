"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PickerExercise = {
  id: string;
  name: string;
  searchName: string;
  isCardio: boolean;
  thumbnail: string | null;
  level: string | null;
  primaryMuscleSlugs: string[];
  primaryMuscleNames: string[];
};

export type PickerMuscle = {
  slug: string;
  name: string;
  bodyPart: "upper" | "core" | "lower";
};

type Props = {
  exercises: PickerExercise[];
  muscleGroups: PickerMuscle[];
  onClose: () => void;
  onPick: (exerciseId: string) => void;
};

const LEVELS = [
  { slug: "beginner", name: "Débutant" },
  { slug: "intermediate", name: "Intermédiaire" },
  { slug: "expert", name: "Avancé" },
];

const BODY_PART_ORDER: Record<"upper" | "core" | "lower", number> = {
  upper: 0,
  core: 1,
  lower: 2,
};

export function ExercisePickerModal({
  exercises,
  muscleGroups,
  onClose,
  onPick,
}: Props) {
  const [query, setQuery] = useState("");
  const [muscleSlugs, setMuscleSlugs] = useState<Set<string>>(new Set());
  const [levels, setLevels] = useState<Set<string>>(new Set());
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const orderedMuscles = useMemo(() => {
    return [...muscleGroups].sort(
      (a, b) =>
        BODY_PART_ORDER[a.bodyPart] - BODY_PART_ORDER[b.bodyPart] ||
        a.name.localeCompare(b.name, "fr"),
    );
  }, [muscleGroups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !ex.searchName.toLowerCase().includes(q)) return false;
      if (
        muscleSlugs.size > 0 &&
        !ex.primaryMuscleSlugs.some((s) => muscleSlugs.has(s))
      ) {
        return false;
      }
      if (levels.size > 0 && (!ex.level || !levels.has(ex.level))) return false;
      return true;
    });
  }, [exercises, query, muscleSlugs, levels]);

  function toggleSet<T>(
    setter: React.Dispatch<React.SetStateAction<Set<T>>>,
    value: T,
  ) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function handlePick(ex: PickerExercise) {
    onPick(ex.id);
    setRecentlyAdded(ex.id);
    window.setTimeout(() => {
      setRecentlyAdded((curr) => (curr === ex.id ? null : curr));
    }, 1200);
  }

  function resetFilters() {
    setQuery("");
    setMuscleSlugs(new Set());
    setLevels(new Set());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex bg-foreground/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col",
          "h-full sm:my-8 sm:h-[calc(100vh-4rem)] sm:max-h-[800px]",
          "bg-card/95 backdrop-blur-2xl",
          "border-0 sm:border sm:border-border",
          "shadow-floating",
          "sm:rounded-3xl overflow-hidden animate-scale-in",
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choisir un exercice"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Ajouter un exercice</h3>
            <p className="text-xs text-muted-foreground">
              {filtered.length} exercice{filtered.length > 1 ? "s" : ""}{" "}
              disponible{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 border-b border-border bg-background/50 px-6 py-4">
          <Input
            placeholder="Rechercher un exercice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10"
            autoFocus
          />

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Muscle
            </p>
            <div className="flex flex-wrap gap-1.5">
              {orderedMuscles.map((m) => (
                <FilterPill
                  key={m.slug}
                  active={muscleSlugs.has(m.slug)}
                  onClick={() => toggleSet(setMuscleSlugs, m.slug)}
                >
                  {m.name}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Niveau
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <FilterPill
                  key={l.slug}
                  active={levels.has(l.slug)}
                  onClick={() => toggleSet(setLevels, l.slug)}
                >
                  {l.name}
                </FilterPill>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  Aucun exercice ne correspond
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  justAdded={recentlyAdded === ex.id}
                  onClick={() => handlePick(ex)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background/50 px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Clique sur un exercice pour l&apos;ajouter. Tu peux en empiler
            plusieurs d&apos;affilée.
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ExerciseCard({
  exercise,
  justAdded,
  onClick,
}: {
  exercise: PickerExercise;
  justAdded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden text-left",
        "rounded-2xl border border-border bg-card shadow-soft",
        "transition-all duration-200",
        "hover:scale-[1.02] hover:border-primary/30 hover:shadow-lifted",
        "active:scale-[0.98]",
        justAdded && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {exercise.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/exercise-images/${exercise.thumbnail}`}
            alt={exercise.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-30">
            🏋️
          </div>
        )}
        {exercise.isCardio ? (
          <div className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">
            cardio
          </div>
        ) : null}
        {justAdded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/90 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary-foreground">
              ✓ Ajouté
            </span>
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-tight">
          {exercise.name}
        </p>
        {exercise.primaryMuscleNames.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {exercise.primaryMuscleNames.slice(0, 2).join(" • ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
