"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime, toLocalInput } from "@/lib/format";
import {
  editBodyWeightEntryAction,
  deleteBodyWeightEntryAction,
} from "@/features/body-weight/actions";
import { initialBodyWeightState } from "@/features/body-weight/state";

export function WeightHistoryRow({
  entry,
}: {
  entry: { id: string; weightKg: number; recordedAt: Date };
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useFormState(
    editBodyWeightEntryAction,
    initialBodyWeightState,
  );
  const [isDeleting, startDelete] = useTransition();

  if (editing) {
    return (
      <form
        action={(fd) => {
          formAction(fd);
          setEditing(false);
        }}
        className="flex flex-wrap items-end gap-2 rounded-md border p-3"
      >
        <input type="hidden" name="entryId" value={entry.id} />
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`w-${entry.id}`}>
            Poids (kg)
          </label>
          <Input
            id={`w-${entry.id}`}
            name="weightKg"
            type="number"
            step="0.1"
            min="20"
            max="500"
            defaultValue={entry.weightKg}
            required
            className="w-28"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`d-${entry.id}`}>
            Date
          </label>
          <Input
            id={`d-${entry.id}`}
            name="recordedAt"
            type="datetime-local"
            defaultValue={toLocalInput(entry.recordedAt)}
            max={new Date().toISOString().slice(0, 16)}
            className="w-48"
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" variant="default">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {state.status === "error" && state.error ? (
          <p className="basis-full text-xs text-destructive">{state.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-semibold tabular-nums">
          {entry.weightKg.toLocaleString("fr-FR")} kg
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(entry.recordedAt)}
        </p>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(true)}
          aria-label="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isDeleting}
          onClick={() => {
            if (!confirm("Supprimer cette mesure ?")) return;
            startDelete(() => deleteBodyWeightEntryAction(entry.id));
          }}
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
