"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/features/categories/actions";
import { initialCategoryState } from "@/features/categories/state";

type Category = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
};

export function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="space-y-4 rounded-md border p-6">
      <div>
        <h3 className="text-base font-semibold">Catégories de séances</h3>
        <p className="text-xs text-muted-foreground">
          Servent à colorer ton calendrier (Push, Pull, Cardio…). 5 par défaut
          créées automatiquement.
        </p>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <CategoryRow key={cat.id} category={cat} />
        ))}
      </div>

      <NewCategoryForm />
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const boundUpdate = updateCategoryAction.bind(null, category.id);
  const [state, formAction] = useFormState(boundUpdate, initialCategoryState);

  // Sortie du mode édition après save réussi
  useEffect(() => {
    if (state.status === "success") setEditing(false);
  }, [state.status]);

  function onDelete() {
    if (
      !confirm(
        `Supprimer la catégorie « ${category.name} » ? Les séances déjà planifiées avec cette catégorie ne seront plus colorées.`,
      )
    ) {
      return;
    }
    startTransition(() => deleteCategoryAction(category.id));
  }

  if (editing) {
    return (
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          name="color"
          defaultValue={category.color}
          className="h-9 w-12 cursor-pointer rounded-md border"
          aria-label="Couleur"
        />
        <Input
          name="name"
          defaultValue={category.name}
          className="min-w-[140px] flex-1"
          required
          maxLength={40}
        />
        <SubmitButton className="" pendingText="…">
          OK
        </SubmitButton>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
        >
          Annuler
        </Button>
        {state.status === "error" && state.error ? (
          <p className="basis-full text-xs text-destructive">{state.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex items-center gap-3">
        <div
          className="h-5 w-5 rounded-full border"
          style={{ backgroundColor: category.color }}
          aria-hidden
        />
        <span className="text-sm font-medium">{category.name}</span>
        {category.isDefault ? (
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            défaut
          </span>
        ) : null}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Éditer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={onDelete}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function NewCategoryForm() {
  const [state, formAction] = useFormState(
    createCategoryAction,
    initialCategoryState,
  );

  return (
    <form action={formAction} className="space-y-2 border-t pt-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Nouvelle catégorie
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          name="color"
          defaultValue="#6366F1"
          className="h-9 w-12 cursor-pointer rounded-md border"
          aria-label="Couleur"
        />
        <Input
          name="name"
          placeholder="Nom (ex : Bras)"
          className="min-w-[140px] flex-1"
          required
          maxLength={40}
        />
        <SubmitButton className="" pendingText="…">
          Ajouter
        </SubmitButton>
      </div>
      {state.status === "error" && state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
