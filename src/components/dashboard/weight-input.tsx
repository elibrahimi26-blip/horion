"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { logBodyWeightAction } from "@/features/body-weight/actions";
import { initialBodyWeightState } from "@/features/body-weight/state";

export function WeightInput({ latestKg }: { latestKg: number | null }) {
  const [state, formAction] = useFormState(
    logBodyWeightAction,
    initialBodyWeightState,
  );
  const [showDate, setShowDate] = useState(false);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label htmlFor="weightKg" className="text-xs">
            Mesure du jour (kg)
          </Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            min="20"
            max="500"
            required
            inputMode="decimal"
            placeholder={latestKg !== null ? String(latestKg) : "ex : 75.5"}
          />
        </div>
        <SubmitButton className="" pendingText="…">
          Enregistrer
        </SubmitButton>
      </div>

      {showDate ? (
        <div className="space-y-1">
          <Label htmlFor="recordedAt" className="text-xs">
            Date de la mesure
          </Label>
          <Input
            id="recordedAt"
            name="recordedAt"
            type="datetime-local"
            max={new Date().toISOString().slice(0, 16)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDate(true)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          + Antédater cette mesure
        </button>
      )}

      {state.status === "success" ? (
        <p className="text-xs text-green-700">Mesure enregistrée.</p>
      ) : null}
      {state.status === "error" && state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
