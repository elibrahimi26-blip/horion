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
      className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-col",
          "h-full sm:my-8 sm:h-[calc(100vh-4rem)] sm:max-h-[800px]",
          "bg-white/90 backdrop-blur-2xl",
          "border-0 sm:border sm:border-black/[0.06]",
          "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
          "sm:rounded-3xl overflow-hidden",
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choisir un exercice"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold">Ajouter un exercice</h3>
            <p className="text-xs text-black/50">
              {filtered.length} exercice{filtered.length > 1 ? "s" : ""}{" "}
              disponible{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-black/60 transition-colors hover:bg-black/[0.08]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 border-b border-black/[0.06] bg-white/50 px-6 py-4">
          <Input
            placeholder="Rechercher un exercice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl border-black/[0.08] bg-white"
            autoFocus
          />

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
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
                <p className="text-sm text-black/50">
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

        <div className="border-t border-black/[0.06] bg-white/50 px-6 py-3 text-center">
          <p className="text-xs text-black/50">
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
          ? "bg-black text-white shadow-sm"
          : "bg-black/[0.05] text-black/70 hover:bg-black/[0.08]",
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
        "rounded-2xl border border-black/[0.06] bg-white shadow-sm",
        "transition-all duration-200",
        "hover:scale-[1.02] hover:border-black/[0.12] hover:shadow-md",
        "active:scale-[0.98]",
        justAdded && "ring-2 ring-green-500 ring-offset-2",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {exercise.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/exercise-images/${exercise.thumbnail}`}
            alt={exercise.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-20">
            🏋️
          </div>
        )}
        {exercise.isCardio ? (
          <div className="absolute right-2 top-2 rounded-full bg-blue-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            cardio
          </div>
        ) : null}
        {justAdded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 backdrop-blur-sm">
            <span className="text-sm font-semibold text-white">✓ Ajouté</span>
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-tight">
          {exercise.name}
        </p>
        {exercise.primaryMuscleNames.length > 0 ? (
          <p className="mt-1 line-clamp-1 text-xs text-black/50">
            {exercise.primaryMuscleNames.slice(0, 2).join(" • ")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
